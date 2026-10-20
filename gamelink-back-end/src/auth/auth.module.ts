import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuarioSchema } from "../usuarios/schemas/usuario.schema/usuario.schema";

@Module({
  imports: [
    ConfigModule,

    // Configuración de Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configuración de JWT (una sola configuración)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secretKey'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES', '7d'),
        },
      }),
      inject: [ConfigService],
    }),

    // Configuración de Mongoose
    MongooseModule.forFeature([{ name: 'Usuario', schema: UsuarioSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}