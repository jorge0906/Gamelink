import { IsNotEmpty, IsString, IsMongoId, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateValoracionDto {
    @IsMongoId()
    @IsNotEmpty()
    videojuego_id: string;

    @IsInt()
    @Min(1)
    @Max(5)
    puntuacion: number;

    @IsOptional()
    @IsString()
    comentario?: string;
}
