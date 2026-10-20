import { IsOptional, IsString, IsInt, Max, Min } from 'class-validator';

export class UpdateValoracionDto {
    @IsOptional()
    @IsString()
    comentario?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    puntuacion?: number;

}

