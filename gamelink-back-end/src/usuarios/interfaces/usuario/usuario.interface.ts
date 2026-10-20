export interface Usuario {
    id: string;
    correo: string;
    nick: string;
    nombre: string;
    apellido: string;
    contraseña?: string;
    edad: number;
    sexo: string;
    foto_perfil?: string;
    descripcion?: string;
    fecha_registro: Date;
}