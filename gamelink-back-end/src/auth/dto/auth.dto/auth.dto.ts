import { IsNotEmpty, IsEmail, IsString, MinLength, IsOptional, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'Correo electrónico del usuario' })
    @IsEmail({}, { message: 'Correo electrónico inválido' })
    @IsNotEmpty({ message: 'El correo es obligatorio' })
    correo: string;

    @ApiProperty({ description: 'Contraseña del usuario' })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    contraseña: string;
}

export class RegisterDto {
    @ApiProperty({ description: 'Correo electrónico del usuario' })
    @IsEmail({}, { message: 'Correo electrónico inválido' })
    @IsNotEmpty({ message: 'El correo es obligatorio' })
    correo: string;

    @ApiProperty({ description: 'Nombre de usuario (nick)' })
    @IsString()
    @IsNotEmpty({ message: 'El nick es obligatorio' })
    @MinLength(3, { message: 'El nick debe tener al menos 3 caracteres' })
    nick: string;

    @ApiProperty({ description: 'Nombre del usuario' })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre: string;

    @ApiProperty({ description: 'Apellido del usuario' })
    @IsString()
    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    apellido: string;

    @ApiProperty({ description: 'Contraseña del usuario' })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    contraseña: string;

    @ApiProperty({ description: 'Edad del usuario' })
    @IsInt({ message: 'La edad debe ser un número entero' })
    @IsNotEmpty({ message: 'La edad es obligatoria' })
    edad: number;

    @ApiProperty({ description: 'Sexo del usuario', enum: ['M', 'F', 'Otro'] })
    @IsString()
    @IsIn(['M', 'F', 'Otro'], { message: 'El sexo debe ser M, F u Otro' })
    @IsNotEmpty({ message: 'El sexo es obligatorio' })
    sexo: string;

    @ApiPropertyOptional({ description: 'URL de la foto de perfil' })
    @IsOptional()
    @IsString()
    foto_perfil?: string;

    @ApiPropertyOptional({ description: 'Descripción o biografía' })
    @IsOptional()
    @IsString()
    descripcion?: string;
}