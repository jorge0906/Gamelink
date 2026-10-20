import {Injectable, NotFoundException, BadRequestException, InternalServerErrorException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {Model, Types} from 'mongoose';
import { CreateVideojuegoDto, QueryVideojuegoDto, UpdateVideojuegoDto } from "./dto/videojuego.dto/videojuego.dto";
import { Videojuego } from "./schemas/videojuego.schema/videojuego.schema";

@Injectable()
export class VideojuegosService {
    constructor(
        @InjectModel('Videojuego') private videojuegoModel: Model<Videojuego>,
        @InjectModel('Valoracion') private valoracionModel: Model<any>,
        @InjectModel('Favorito') private favoritoModel: Model<any>
    ) {}

    async create(createVideojuegoDto: CreateVideojuegoDto, usuarioId: string): Promise<Videojuego> {
        const nuevoVideojuego = new this.videojuegoModel({
            ...createVideojuegoDto,
            usuario_id: usuarioId,
            rating: 0
        });

        return nuevoVideojuego.save();
    }

    async findAll(queryDto: QueryVideojuegoDto): Promise<{ data: Videojuego[], meta: any }> {
        const {
            buscar,
            tema,
            anioMin,
            anioMax,
            ratingMin,
            page = 1,
            limit = 10,
            ordenarPor = 'rating',
            orden = 'desc'
        } = queryDto;

        // Construir el filtro
        const filter: any = {};

        // Búsqueda por texto
        if (buscar) {
            filter.$text = { $search: buscar };
        }

        // Filtro por tema
        if (tema) {
            filter.tema = tema;
        }

        // Filtro por rango de años
        if (anioMin || anioMax) {
            filter.anio = {};
            if (anioMin) filter.anio.$gte = anioMin;
            if (anioMax) filter.anio.$lte = anioMax;
        }

        // Filtro por rating mínimo
        if (ratingMin) {
            filter.rating = { $gte: ratingMin };
        }

        // Calcular paginación
        const skip = (page - 1) * limit;

        // Definir el orden
        const sort: any = {};
        sort[ordenarPor] = orden === 'asc' ? 1 : -1;

        // Ejecutar consulta
        const [videojuegos, total] = await Promise.all([
            this.videojuegoModel.find(filter)
                .populate('usuario_id', 'nick nombre foto_perfil')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.videojuegoModel.countDocuments(filter)
        ]);

        // Devolver resultados paginados
        return {
            data: videojuegos,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async findById(id: string): Promise<Videojuego> {
        const videojuego = await this.videojuegoModel.findById(id)
            .populate('usuario_id', 'nick nombre foto_perfil')
            .exec();

        if (!videojuego) {
            throw new NotFoundException('Videojuego no encontrado');
        }

        return videojuego;
    }


    async findByUsuario(usuarioId: string): Promise<Videojuego[]> {
        return this.videojuegoModel.find({ usuario_id: usuarioId })
            .sort({ fecha_ingreso: -1 })
            .exec();
    }

    async update(id: string, updateVideojuegoDto: UpdateVideojuegoDto, usuarioId: string): Promise<Videojuego> {
        const videojuego = await this.findById(id);

        // Verificar si el usuario es el creador del videojuego
        if (videojuego.usuario_id.toString() !== usuarioId) {
            throw new BadRequestException('No tienes permisos para editar este videojuego');
        }

        // Actualizar campos
        Object.assign(videojuego, updateVideojuegoDto);

        return videojuego.save();
    }

    async delete(id: string, usuarioId: string): Promise<void> {
        let videojuego;

        // Obtener el videojuego por ID
        try {
            videojuego = await this.findById(id);
        } catch (error) {
            throw new NotFoundException('Videojuego no encontrado');
        }

        // Verificar si el usuario es el propietario del videojuego
        let hasPermission = false;

        if (videojuego.usuario_id instanceof Object && videojuego.usuario_id._id) {
            hasPermission = videojuego.usuario_id._id.equals(usuarioId);
        } else {
            hasPermission = videojuego.usuario_id.toString() === usuarioId.toString();
        }

        if (!hasPermission) {
            throw new BadRequestException('No tienes permisos para eliminar este videojuego');
        }

        // Eliminar todas las valoraciones, comentarios y favoritos asociados
        try {
            await Promise.all([
                this.valoracionModel.deleteMany({ videojuego_id: id }),
                this.favoritoModel.deleteMany({ videojuego_id: id })
            ]);
        } catch (error) {
            throw new InternalServerErrorException('Error al eliminar los datos asociados');
        }



        // Eliminar el videojuego
        try {
            await this.videojuegoModel.findByIdAndDelete(id);
        } catch (error) {
            throw new InternalServerErrorException('Error al eliminar el videojuego');
        }
    }



    async getTemas(): Promise<string[]> {
        const temas = await this.videojuegoModel.aggregate([
            { $group: { _id: '$tema' } },
            { $sort: { _id: 1 } }
        ]);

        return temas.map(tema => tema._id);
    }

    async getPlataformas(): Promise<string[]> {
        const plataformas = await this.videojuegoModel.aggregate([
            { $unwind: '$plataformas' },
            { $group: { _id: '$plataformas' } },
            { $sort: { _id: 1 } }
        ]);

        return plataformas.map(plataforma => plataforma._id);
    }

    async updateRating(id: string, rating: number): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID de videojuego inválido');
        }

        await this.videojuegoModel.findByIdAndUpdate(id, { rating: rating }).exec();
    }


    async getStats(): Promise<any> {
        const totalVideojuegos = await this.videojuegoModel.countDocuments();
        const mejorValorados = await this.videojuegoModel.find()
            .sort({ rating: -1 })
            .limit(5)
            .select('nombre rating tema')
            .exec();

        const recienAgregados = await this.videojuegoModel.find()
            .sort({ fecha_ingreso: -1 })
            .limit(5)
            .select('nombre fecha_ingreso tema')
            .exec();

        const distribucionPorTema = await this.videojuegoModel.aggregate([
            { $group: { _id: '$tema', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const distribucionPorAnio = await this.videojuegoModel.aggregate([
            { $group: { _id: '$anio', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        return {
            totalVideojuegos,
            mejorValorados,
            recienAgregados,
            distribucionPorTema,
            distribucionPorAnio
        };
    }

    async search(term: string): Promise<Videojuego[]> {
        if (!term || term.trim() === '') {
            return [];
        }

        return this.videojuegoModel.find({ $text: { $search: term } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(10)
            .exec();
    }
}