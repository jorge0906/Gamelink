import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavoritosController } from './favoritos.controller';
import { FavoritosService } from './favoritos.service';
import {FavoritoSchema} from "./schemas/favorito.schema/favorito.schema";
import {VideojuegoSchema} from "../videojuegos/schemas/videojuego.schema/videojuego.schema";


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Favorito', schema: FavoritoSchema },
      { name: 'Videojuego', schema: VideojuegoSchema }
    ])
  ],
  controllers: [FavoritosController],
  providers: [FavoritosService],
  exports: [FavoritosService]
})
export class FavoritosModule {}