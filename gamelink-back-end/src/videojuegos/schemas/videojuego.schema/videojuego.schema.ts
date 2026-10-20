import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
    timestamps: { createdAt: 'fecha_ingreso', updatedAt: 'ultima_actualizacion' },
    collection: 'videojuegos'
})
export class Videojuego extends Document {
    @Prop({ required: true, index: true })
    nombre: string;

    @Prop({ required: true, index: true })
    tema: string;

    @Prop({ required: true, index: true })
    anio: number;

    @Prop({ default: 0 })
    rating: number;

    @Prop({ required: true })
    edad_minima: number;

    @Prop({ required: true })
    descripcion: string;

    @Prop()
    imagen: string;

    @Prop({ type: [String], default: [] })
    plataformas: string[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
    usuario_id: MongooseSchema.Types.ObjectId | string;
}

export const VideojuegoSchema = SchemaFactory.createForClass(Videojuego);

VideojuegoSchema.index({ nombre: 'text', descripcion: 'text' });