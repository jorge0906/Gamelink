import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ValoracionDocument = Valoracion & Document;

@Schema({ timestamps: true })
export class Valoracion {
    @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
    usuario_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Videojuego', required: true })
    videojuego_id: Types.ObjectId;

    @Prop({ required: true, min: 1, max: 5 })
    puntuacion: number;

    @Prop({ required: true })
    comentario: string;

    @Prop({ default: [] })
    likes: Types.ObjectId[];

    @Prop({ default: 'activo', enum: ['activo', 'moderacion', 'eliminado'] })
    estado: string;

    @Prop({ type: Date, default: Date.now })
    fecha_valoracion: Date;
}

export const ValoracionSchema = SchemaFactory.createForClass(Valoracion);

// Índice para evitar valoraciones duplicadas del mismo usuario para el mismo videojuego
ValoracionSchema.index({ usuario_id: 1, videojuego_id: 1 }, { unique: true });
