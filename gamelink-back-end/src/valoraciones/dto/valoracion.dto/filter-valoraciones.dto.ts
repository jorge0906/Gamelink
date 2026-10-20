import { IsOptional, IsMongoId, IsNumberString } from 'class-validator';

export class FilterValoracionesDto {
    @IsOptional()
    @IsMongoId()
    usuario_id?: string;

    @IsOptional()
    @IsMongoId()
    videojuego_id?: string;

    @IsOptional()
    @IsNumberString()
    puntuacion?: string;

    @IsOptional()
    @IsNumberString()
    page?: string;

    @IsOptional()
    @IsNumberString()
    limit?: string;
}
