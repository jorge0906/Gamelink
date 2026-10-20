import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema/usuario.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectModel('Usuario') private usuarioModel: Model<Usuario>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'secretKey'),
        });
    }

    async validate(payload: any) {
        try {
            if (!payload.sub) {
                console.log('JWT Strategy - Token sin sub:', payload);
                throw new UnauthorizedException('Token inválido');
            }

            // Buscar el usuario en la base de datos
            const usuario = await this.usuarioModel.findById(payload.sub);

            if (!usuario) {
                console.log('JWT Strategy - Usuario no encontrado:', payload.sub);
                throw new UnauthorizedException('Usuario no encontrado');
            }

            // Devolver la información necesaria para req.user
            return {
                id: usuario._id,
                correo: usuario.correo,
                nick: usuario.nick,
                nombre: usuario.nombre,
                apellido: usuario.apellido
            };
        } catch (error) {
            console.error('JWT Strategy - Error en validación:', error);
            throw new UnauthorizedException('Error en la autenticación');
        }
    }
}