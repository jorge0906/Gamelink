import {Injectable, UnauthorizedException, BadRequestException, Logger} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/schemas/usuario.schema/usuario.schema';
import {LoginDto} from "./dto/auth.dto/auth.dto";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        @InjectModel('Usuario') private usuarioModel: Model<Usuario>,
        private jwtService: JwtService,
    ) {}



    async login(loginDto: LoginDto): Promise<any> {
        try {
            // Buscar usuario por correo
            const usuario = await this.usuarioModel
                .findOne({ correo: loginDto.correo })
                .select('+contraseña')
                .exec();


            if (!usuario) {
                this.logger.warn(`Usuario no encontrado: ${loginDto.correo}`);
                throw new UnauthorizedException('Credenciales inválidas');
            }

            this.logger.log(`Usuario encontrado: ${JSON.stringify(usuario)}`);

            // Verificar que el campo contraseña existe
            if (!usuario.contraseña) {
                this.logger.error(`Usuario sin contraseña almacenada: ${loginDto.correo}`);

                const defaultPassword = await bcrypt.hash('123456', 10);

                // Actualizar el usuario con la contraseña por defecto
                await this.usuarioModel.updateOne(
                    { _id: usuario._id },
                    { $set: { contraseña: defaultPassword } }
                );

                this.logger.log(`Contraseña por defecto establecida para: ${loginDto.correo}`);

                // Continuar con la autenticación usando la contraseña por defecto
                if (loginDto.contraseña === '123456') {
                    return this.generateToken(usuario);
                } else {
                    throw new UnauthorizedException('Credenciales inválidas');
                }
            }

            // Verificación normal de contraseña
            const isPasswordValid = await bcrypt.compare(
                loginDto.contraseña,
                usuario.contraseña
            );

            if (!isPasswordValid) {
                this.logger.warn(`Contraseña incorrecta para: ${loginDto.correo}`);
                throw new UnauthorizedException('Credenciales inválidas');
            }

            this.logger.log(`Autenticación exitosa para: ${loginDto.correo}`);
            return this.generateToken(usuario);
        } catch (error) {
            this.logger.error(`Error en login: ${error.message}`, error.stack);
            throw new UnauthorizedException('Error en verificación de credenciales');
        }
    }


    private generateToken(usuario: any): { token: string, usuario: any } {
        const payload = {
            sub: usuario._id,
            correo: usuario.correo,
            nick: usuario.nick
        };

        return {
            token: this.jwtService.sign(payload),
            usuario: {
                id: usuario._id,
                correo: usuario.correo,
                nick: usuario.nick,
                nombre: usuario.nombre,
                foto_perfil: usuario.foto_perfil
            }
        };
    }

    async register(registerDto: any) {
        console.log('AuthService - register: Datos recibidos:', registerDto);

        const { correo, contraseña, nick } = registerDto;

        // Verificar si el correo ya está registrado
        const existingUserByEmail = await this.usuarioModel.findOne({
            correo: { $regex: new RegExp(`^${correo}$`, 'i') }
        });

        if (existingUserByEmail) {
            console.log(`AuthService - register: Correo ${correo} ya registrado`);
            throw new BadRequestException('El correo ya está registrado');
        }

        // Verificar si el nick ya está en uso
        const existingUserByNick = await this.usuarioModel.findOne({
            nick: { $regex: new RegExp(`^${nick}$`, 'i') }
        });

        if (existingUserByNick) {
            console.log(`AuthService - register: Nick ${nick} ya en uso`);
            throw new BadRequestException('El nick ya está en uso');
        }

        try {
            // Hashear la contraseña
            console.log('AuthService - register: Hasheando contraseña...');
            const hashedPassword = await bcrypt.hash(contraseña, 10);
            console.log('AuthService - register: Contraseña hasheada correctamente');

            // Crear el nuevo usuario con la contraseña hasheada
            const userData = {
                ...registerDto,
                contraseña: hashedPassword,
                fecha_registro: new Date()
            };

            console.log('AuthService - register: Creando nuevo usuario con datos:', {
                ...userData,
                contraseña: '[PROTEGIDA]'
            });

            const newUser = new this.usuarioModel(userData);
            const savedUser = await newUser.save();

            console.log('AuthService - register: Usuario guardado con ID:', savedUser._id);

            // Generar token JWT
            const payload = {
                sub: savedUser._id,
                correo: savedUser.correo,
                nick: savedUser.nick
            };

            // Devolver token y datos del usuario (sin contraseña)
            const userResponse = this.sanitizeUser(savedUser);

            console.log('AuthService - register: Registro exitoso, generando token para:', savedUser.correo);

            return {
                access_token: this.jwtService.sign(payload),
                usuario: userResponse
            };
        } catch (error) {
            console.error('AuthService - register: Error al registrar usuario:', error);
            throw new BadRequestException('Error al registrar el usuario: ' + error.message);
        }
    }


    private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Error comparando contraseñas:', error);
            return false;
        }
    }


    private sanitizeUser(user: any) {
        const userObj = user.toObject ? user.toObject() : user;
        const { contraseña, ...userResponse } = userObj;
        return userResponse;
    }


    async validateUser(userId: string) {
        try {
            const user = await this.usuarioModel.findById(userId);
            if (!user) {
                throw new UnauthorizedException('Usuario no encontrado');
            }
            return this.sanitizeUser(user);
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }
    }
}