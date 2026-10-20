import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
    timestamps: { createdAt: 'fecha_agregado' }
})
export class Favorito extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
    usuario_id: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Videojuego', required: true })
    videojuego_id: string;

    @Prop({ type: Date, default: Date.now })
    fecha_agregado: Date;
}

export const FavoritoSchema = SchemaFactory.createForClass(Favorito);

// Agregar índice compuesto para evitar duplicados
FavoritoSchema.index({ usuario_id: 1, videojuego_id: 1 }, { unique: true });
