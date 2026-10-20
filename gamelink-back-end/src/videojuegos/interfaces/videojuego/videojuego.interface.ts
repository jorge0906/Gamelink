export interface Videojuego {
    id: string;
    nombre: string;
    tema: string;
    anio: number;
    rating: number;
    edad_minima: number;
    descripcion: string;
    imagen?: string;
    plataformas?: string[];
    fecha_ingreso: Date;
    usuario_id: string;
}