import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { VideojuegosService } from '../videojuegos/videojuegos.service';
import {Valoracion, ValoracionDocument} from "./schemas/valoracion.schema/valoracion.schema";
import {CreateValoracionDto} from "./dto/valoracion.dto/valoracion.dto";
import {UpdateValoracionDto} from "./dto/valoracion.dto/update-valoracion.dto";

@Injectable()
export class ValoracionesService {
    constructor(
        @InjectModel(Valoracion.name) private valoracionModel: Model<ValoracionDocument>,
        private videojuegosService: VideojuegosService,
    ) {}

    async create(userId: string, createValoracionDto: CreateValoracionDto): Promise<Valoracion> {
        // Verificar que el videojuego existe
        const videojuegoExists = await this.videojuegosService.findById(createValoracionDto.videojuego_id);
        if (!videojuegoExists) {
            throw new NotFoundException(`Videojuego con ID ${createValoracionDto.videojuego_id} no encontrado`);
        }

        // Verificar si ya existe una valoración del usuario para este videojuego
        const existingValoracion = await this.valoracionModel.findOne({
            usuario_id: new Types.ObjectId(userId),
            videojuego_id: new Types.ObjectId(createValoracionDto.videojuego_id),
        });

        if (existingValoracion) {
            throw new ConflictException('Ya has valorado este videojuego. Utiliza la función de actualizar valoración.');
        }

        // Crear nueva valoración
        const newValoracion = new this.valoracionModel({
            ...createValoracionDto,
            usuario_id: new Types.ObjectId(userId),
            videojuego_id: new Types.ObjectId(createValoracionDto.videojuego_id),
        });

        const savedValoracion = await newValoracion.save();

        // Actualizar rating promedio del videojuego
        await this.actualizarRatingPromedio(createValoracionDto.videojuego_id);

        return savedValoracion;
    }


    async toggleLike(id: string, userId: string): Promise<Valoracion> {
        try {
            if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
                throw new BadRequestException('ID inválido');
            }

            console.log(`Alternando like para valoración ${id} de usuario ${userId}`);

            // Buscar la valoración por ID
            const valoracion = await this.valoracionModel.findById(id);
            if (!valoracion) {
                throw new NotFoundException('Valoración no encontrada');
            }

            // Convertir el array de likes a strings para facilitar la comparación
            const likesAsStrings = valoracion.likes.map(like => like.toString());

            // Verificar si el usuario ya ha dado like
            const hasUserLiked = likesAsStrings.includes(userId);
            console.log(`El usuario ${userId} ya dio like: ${hasUserLiked}`);

            if (hasUserLiked) {
                // Si ya ha dado like, lo quitamos
                console.log('Quitando like...');
                valoracion.likes = valoracion.likes.filter(like => like.toString() !== userId);
            } else {
                // Si no ha dado like, lo agregamos
                console.log('Agregando like...');
                valoracion.likes.push(new Types.ObjectId(userId));
            }

            // Guardar los cambios en la valoración
            const updatedValoracion = await valoracion.save();
            console.log(`Like alternado. Resultado: ${updatedValoracion.likes.length} likes totales.`);

            return updatedValoracion;
        } catch (error) {
            console.error('Error al dar like:', error);  // Log detallado del error
            throw new InternalServerErrorException('Error al dar like');
        }
    }

    async findAll(query?: any): Promise<{ data: Valoracion[]; total: number }> {
        const conditions = {};
        const limit = query?.limit ? parseInt(query.limit) : 10;
        const page = query?.page ? parseInt(query.page) : 1;
        const skip = (page - 1) * limit;

        if (query?.videojuego_id) {
            conditions['videojuego_id'] = new Types.ObjectId(query.videojuego_id);
        }

        if (query?.usuario_id) {
            conditions['usuario_id'] = new Types.ObjectId(query.usuario_id);
        }

        if (query?.puntuacion) {
            conditions['puntuacion'] = parseInt(query.puntuacion);
        }

        const [data, total] = await Promise.all([
            this.valoracionModel
                .find(conditions)
                .populate('usuario_id', 'nombre nick foto_perfil')
                .sort({ fecha_valoracion: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.valoracionModel.countDocuments(conditions).exec(),
        ]);

        return { data, total };
    }

    async findOne(id: string): Promise<Valoracion> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID de valoración inválido');
        }

        const valoracion = await this.valoracionModel
            .findById(id)
            .populate('usuario_id', 'nombre nick foto_perfil')
            .populate('videojuego_id', 'nombre imagen')
            .exec();

        if (!valoracion) {
            throw new NotFoundException(`Valoración con ID ${id} no encontrada`);
        }

        return valoracion;
    }

    async update(id: string, userId: string, updateValoracionDto: UpdateValoracionDto): Promise<Valoracion> {
        console.log('userId recibido en update:', userId);
        console.log('Es válido:', Types.ObjectId.isValid(userId));

        if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('ID inválido');
        }


        const valoracion = await this.valoracionModel.findById(id);

        if (!valoracion) {
            throw new NotFoundException('Valoración no encontrada');
        }

        if (valoracion.usuario_id.toString() !== userId.toString()) {
            throw new NotFoundException('No tienes permiso para editar esta valoración');
        }

        const updatedValoracion = await this.valoracionModel
            .findByIdAndUpdate(id, updateValoracionDto, { new: true })
            .exec();

        if (!updatedValoracion) {
            throw new NotFoundException('Error al actualizar la valoración');
        }



        await this.actualizarRatingPromedio(valoracion.videojuego_id.toString());

        return updatedValoracion;
    }


    async remove(id: string, userId: string) {
        console.log('Buscando valoración con:');
        console.log('ID:', id);
        console.log('userId:', userId);

        const valoracion = await this.valoracionModel.findOne({
            _id: new Types.ObjectId(id),
            usuario_id: new Types.ObjectId(userId),
        });

        console.log('Resultado findOne:', valoracion);

        if (!valoracion) {
            throw new NotFoundException('Valoración no encontrada o no tienes permiso para eliminarla');
        }

        // Eliminar la valoración usando el ObjectId
        return this.valoracionModel.deleteOne({ _id: new Types.ObjectId(id) });
    }




    async getUserValoracion(videojuegoId: string, userId: string): Promise<Valoracion | null> {
        if (!Types.ObjectId.isValid(videojuegoId) || !Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('ID de videojuego o usuario inválido');
        }

        return this.valoracionModel
            .findOne({
                videojuego_id: new Types.ObjectId(videojuegoId),
                usuario_id: new Types.ObjectId(userId),
            })
            .exec();
    }

    async getPromedioValoraciones(videojuegoId: string): Promise<{ promedio: number; total: number }> {
        if (!Types.ObjectId.isValid(videojuegoId)) {
            throw new BadRequestException('ID de videojuego inválido');
        }

        const result = await this.valoracionModel.aggregate([
            {
                $match: { videojuego_id: new Types.ObjectId(videojuegoId) },
            },
            {
                $group: {
                    _id: null,
                    promedio: { $avg: '$puntuacion' },
                    total: { $sum: 1 },
                },
            },
        ]);

        if (result.length === 0) {
            return { promedio: 0, total: 0 };
        }

        return {
            promedio: parseFloat(result[0].promedio.toFixed(1)),
            total: result[0].total,
        };
    }

    private async actualizarRatingPromedio(videojuegoId: string): Promise<void> {
        // Calcular el nuevo promedio
        const { promedio } = await this.getPromedioValoraciones(videojuegoId);

        // Actualizar el rating del videojuego
        await this.videojuegosService.updateRating(videojuegoId, promedio);
    }


    async removeLike(id: string, userId: string): Promise<Valoracion> {
        try {
            if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
                throw new BadRequestException('ID inválido');
            }

            console.log(`Quitando like explícitamente para valoración ${id} de usuario ${userId}`);

            // Buscar la valoración por ID
            const valoracion = await this.valoracionModel.findById(id);
            if (!valoracion) {
                throw new NotFoundException('Valoración no encontrada');
            }

            // Quitar el like del usuario sin importar si existe o no
            valoracion.likes = valoracion.likes.filter(
                (like: Types.ObjectId) => like.toString() !== userId.toString()
            );

            console.log(`Después de filtrar, quedan ${valoracion.likes.length} likes`);

            // Guardar los cambios en la valoración
            const updatedValoracion = await valoracion.save();
            return updatedValoracion;
        } catch (error) {
            console.error('Error al quitar like:', error);
            throw new InternalServerErrorException('Error al quitar like');
        }
    }
}