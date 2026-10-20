import {Types} from "mongoose";

export interface Valoracion {
    id: Types.ObjectId;
    usuario_id: Types.ObjectId;
    videojuego_id: Types.ObjectId;
    puntuacion: number;
    comentario: string;
    fecha: Date;
    likes: Array<string | { _id: string }>;
    estado: string;


    usuarioHaDadoLike?: boolean;
    likesCount?: number;
    likeEnProceso?: boolean;
    [key: string]: any;
}