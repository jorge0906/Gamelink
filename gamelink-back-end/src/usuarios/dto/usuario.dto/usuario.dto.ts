import { IsEmail, IsString, IsInt, IsOptional, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto {
    @ApiPropertyOptional({ description: 'Nombre del usuario' })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiPropertyOptional({ description: 'Apellido del usuario' })
    @IsOptional()
    @IsString()
    apellido?: string;

    @ApiPropertyOptional({ description: 'Edad del usuario' })
    @IsOptional()
    @IsInt()
    edad?: number;

    @ApiPropertyOptional({ description: 'Sexo del usuario', enum: ['M', 'F', 'Otro'] })
    @IsOptional()
    @IsString()
    @IsIn(['M', 'F', 'Otro'])
    sexo?: string;

    @ApiPropertyOptional({ description: 'URL de la foto de perfil' })
    @IsOptional()
    @IsString()
    foto_perfil?: string;

    @ApiPropertyOptional({ description: 'Descripción o biografía del usuario' })
    @IsOptional()
    @IsString()
    descripcion?: string;
}

export class ChangePasswordDto {
    @ApiProperty({ description: 'Contraseña actual del usuario' })
    @IsString()
    @MinLength(6)
    contraseña_actual: string;

    @ApiProperty({ description: 'Nueva contraseña' })
    @IsString()
    @MinLength(6)
    nueva_contraseña: string;

    @ApiProperty({ description: 'Confirmación de la nueva contraseña' })
    @IsString()
    @MinLength(6)
    confirmar_contraseña: string;
}
