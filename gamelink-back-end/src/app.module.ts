import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {MongooseModule} from "@nestjs/mongoose";
import 'dotenv/config';
import {ConfigModule} from "@nestjs/config";
import { UsuariosModule } from './usuarios/usuarios.module';
import { VideojuegosModule } from './videojuegos/videojuegos.module';
import { ValoracionesModule } from './valoraciones/valoraciones.module';
import { FavoritosModule } from './favoritos/favoritos.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
        process.env.DBURL as string
    ),
    UsuariosModule,
    VideojuegosModule,
    ValoracionesModule,
    FavoritosModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
