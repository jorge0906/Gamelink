import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVideojuegoDto {
    @ApiProperty({ description: 'Nombre del videojuego' })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre: string;

    @ApiProperty({ description: 'Tema o género del videojuego' })
    @IsString()
    @IsNotEmpty({ message: 'El tema es obligatorio' })
    tema: string;

    @ApiProperty({ description: 'Año de lanzamiento' })
    @IsInt()
    @Min(1950, { message: 'El anio debe ser mayor o igual a 1950' })
    @Max(new Date().getFullYear() + 5, { message: `El anio no puede ser mayor a ${new Date().getFullYear() + 5}` })
    @IsNotEmpty({ message: 'El anio es obligatorio' })
    anio: number;

    @ApiProperty({ description: 'Edad mínima recomendada' })
    @IsInt()
    @Min(0, { message: 'La edad mínima no puede ser negativa' })
    @Max(18, { message: 'La edad mínima no puede ser mayor a 18' })
    @IsNotEmpty({ message: 'La edad mínima es obligatoria' })
    edad_minima: number;

    @ApiProperty({ description: 'Descripción del videojuego' })
    @IsString()
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    descripcion: string;

    @ApiPropertyOptional({ description: 'URL de la imagen del videojuego' })
    @IsOptional()
    @IsString()
    imagen?: string;

    @ApiPropertyOptional({ description: 'Plataformas disponibles', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    plataformas?: string[];
}

export class UpdateVideojuegoDto {
    @ApiPropertyOptional({ description: 'Nombre del videojuego' })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiPropertyOptional({ description: 'Tema o género del videojuego' })
    @IsOptional()
    @IsString()
    tema?: string;

    @ApiPropertyOptional({ description: 'Año de lanzamiento' })
    @IsOptional()
    @IsInt()
    @Min(1950, { message: 'El anio debe ser mayor o igual a 1950' })
    @Max(new Date().getFullYear() + 5, { message: `El anio no puede ser mayor a ${new Date().getFullYear() + 5}` })
    anio?: number;

    @ApiPropertyOptional({ description: 'Edad mínima recomendada' })
    @IsOptional()
    @IsInt()
    @Min(0, { message: 'La edad mínima no puede ser negativa' })
    @Max(18, { message: 'La edad mínima no puede ser mayor a 18' })
    edad_minima?: number;

    @ApiPropertyOptional({ description: 'Descripción del videojuego' })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiPropertyOptional({ description: 'URL de la imagen del videojuego' })
    @IsOptional()
    @IsString()
    imagen?: string;

    @ApiPropertyOptional({ description: 'Plataformas disponibles', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    plataformas?: string[];
}

export class QueryVideojuegoDto {
    @ApiPropertyOptional({ description: 'Término de búsqueda (nombre)' })
    @IsOptional()
    @IsString()
    buscar?: string;

    @ApiPropertyOptional({ description: 'Filtrar por tema/género' })
    @IsOptional()
    @IsString()
    tema?: string;

    @ApiPropertyOptional({ description: 'Año mínimo' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    anioMin?: number;

    @ApiPropertyOptional({ description: 'Año máximo' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    anioMax?: number;

    @ApiPropertyOptional({ description: 'Rating mínimo (1-5)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    ratingMin?: number;

    @ApiPropertyOptional({ description: 'Número de página' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Elementos por página' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Campo para ordenar (nombre, anio, rating)' })
    @IsOptional()
    @IsString()
    ordenarPor?: string = 'rating';

    @ApiPropertyOptional({ description: 'Dirección de ordenamiento (asc, desc)' })
    @IsOptional()
    @IsString()
    orden?: 'asc' | 'desc' = 'desc';
}