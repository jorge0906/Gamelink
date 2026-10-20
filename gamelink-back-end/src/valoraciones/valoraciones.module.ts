import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ValoracionesService } from './valoraciones.service';
import { ValoracionesController } from './valoraciones.controller';
import { VideojuegosModule } from '../videojuegos/videojuegos.module';
import {Valoracion, ValoracionSchema} from "./schemas/valoracion.schema/valoracion.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Valoracion.name, schema: ValoracionSchema },
    ]),
    VideojuegosModule,
  ],
  controllers: [ValoracionesController],
  providers: [ValoracionesService],
  exports: [ValoracionesService],
})
export class ValoracionesModule {}