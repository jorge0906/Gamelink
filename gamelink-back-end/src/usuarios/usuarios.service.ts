import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {ChangePasswordDto, UpdateUsuarioDto} from "./dto/usuario.dto/usuario.dto";
import {Usuario} from "./schemas/usuario.schema/usuario.schema";

@Injectable()
export class UsuariosService {
    constructor(
        @InjectModel('Usuario') private usuarioModel: Model<Usuario>
    ) {}

    async findAll(): Promise<Usuario[]> {
        return this.usuarioModel.find()
            .select('-contraseña')
            .exec();
    }

    async findById(id: string): Promise<Usuario> {
        const usuario = await this.usuarioModel.findById(id)
            .select('-contraseña')
            .exec();

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return usuario;
    }

    async findByNick(nick: string): Promise<Usuario> {
        const usuario = await this.usuarioModel.findOne({ nick })
            .select('-contraseña')
            .exec();

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return usuario;
    }

    async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        const usuario = await this.findById(id);

        // Actualizar campos
        Object.assign(usuario, updateUsuarioDto);

        await usuario.save();

        return this.findById(id); // Devolver usuario actualizado sin contraseña
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
        const { contraseña_actual, nueva_contraseña, confirmar_contraseña } = changePasswordDto;

        // Verificar que las contraseñas coincidan
        if (nueva_contraseña !== confirmar_contraseña) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        // Buscar usuario con contraseña
        const usuario = await this.usuarioModel.findById(id)
            .select('+contraseña')
            .exec();

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Verificar contraseña actual
        const isPasswordValid = await bcrypt.compare(contraseña_actual, usuario.contraseña);

        if (!isPasswordValid) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        // Actualizar contraseña
        usuario.contraseña = await bcrypt.hash(nueva_contraseña, 10);

        await usuario.save();
    }

    async delete(id: string): Promise<void> {
        const usuario = await this.findById(id);

        // Eliminar usuario
        await this.usuarioModel.findByIdAndDelete(id);


    }

    async search(query: string): Promise<Usuario[]> {
        if (!query || query.trim() === '') {
            return [];
        }

        const searchRegex = new RegExp(query, 'i');

        return this.usuarioModel.find({
            $or: [
                { nick: searchRegex },
                { nombre: searchRegex },
                { apellido: searchRegex }
            ]
        })
            .select('-contraseña')
            .limit(10)
            .exec();
    }

    async isNickAvailable(nick: string, excludeUserId?: string): Promise<boolean> {
        const query: any = { nick };

        // Excluir al usuario actual si se proporciona ID
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }

        const count = await this.usuarioModel.countDocuments(query);

        return count === 0;
    }

    async isEmailAvailable(correo: string, excludeUserId?: string): Promise<boolean> {
        const query: any = { correo };

        // Excluir al usuario actual si se proporciona ID
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }

        const count = await this.usuarioModel.countDocuments(query);

        return count === 0;
    }
}
