import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideojuegosController } from './videojuegos.controller';
import { VideojuegosService } from './videojuegos.service';
import {VideojuegoSchema} from "./schemas/videojuego.schema/videojuego.schema";
import {ValoracionSchema} from "../valoraciones/schemas/valoracion.schema/valoracion.schema";
import {FavoritoSchema} from "../favoritos/schemas/favorito.schema/favorito.schema";


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Videojuego', schema: VideojuegoSchema },
      { name: 'Valoracion', schema: ValoracionSchema },
      { name: 'Favorito', schema: FavoritoSchema }
    ])
  ],
  controllers: [VideojuegosController],
  providers: [VideojuegosService],
  exports: [VideojuegosService]
})
export class VideojuegosModule {}