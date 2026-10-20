import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import {UsuarioSchema} from "./schemas/usuario.schema/usuario.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Usuario', schema: UsuarioSchema }
    ])
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService]
})
export class UsuariosModule {}