import {IsMongoId, IsNotEmpty, IsUUID} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoritoDto {
    @IsMongoId({ message: 'videojuego_id debe ser un ObjectId válido' })
    videojuego_id: string;
}

