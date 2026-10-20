import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
    timestamps: { createdAt: 'fecha_registro' }
})
export class Usuario extends Document {
    @Prop({ required: true, unique: true })
    correo: string;

    @Prop({ required: true, unique: true })
    nick: string;

    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    apellido: string;

    @Prop({ required: true, select: false }) // No devolver contraseña por defecto
    contraseña: string;

    @Prop({ required: true })
    edad: number;

    @Prop({ required: true, enum: ['M', 'F', 'Otro'] })
    sexo: string;

    @Prop()
    foto_perfil: string;

    @Prop()
    descripcion: string;

    @Prop({ type: Date, default: Date.now })
    fecha_registro: Date;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);