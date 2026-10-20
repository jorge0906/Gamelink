import {IsNotEmpty, IsString, IsNumber, Min, Max, IsMongoId, IsOptional} from 'class-validator';
import {ApiPropertyOptional} from "@nestjs/swagger";

export class CreateValoracionDto {
    @IsOptional()
    @IsMongoId()
    @ApiPropertyOptional()
    usuario_id?: string;

    @IsOptional()
    @IsMongoId()
    @ApiPropertyOptional()
    videojuego_id: string;

    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional()
    puntuacion?: number;

    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional()
    page?: number;

    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional()
    limit?: number;


}