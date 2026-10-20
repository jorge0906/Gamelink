import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    InternalServerErrorException, Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {Favorito} from "./interfaces/favorito/favorito.interface";
import {CreateFavoritoDto} from "./dto/favorito.dto/favorito.dto";


@Injectable()
export class FavoritosService {

    private readonly logger = new Logger(FavoritosService.name);
    constructor(
        @InjectModel('Favorito') private favoritoModel: Model<Favorito>,
        @InjectModel('Videojuego') private videojuegoModel: Model<any>
    ) {}

    async addToFavorites(createFavoritoDto: CreateFavoritoDto, usuarioId: string): Promise<Favorito> {
        const { videojuego_id } = createFavoritoDto;

        // Verificar que el videojuego existe (buscar por UUID)
        const videojuego = await this.videojuegoModel.findOne({ _id: videojuego_id }).exec();
        if (!videojuego) {
            throw new NotFoundException('Videojuego no encontrado');
        }

        // Verificar si ya está en favoritos
        const favoritoExistente = await this.favoritoModel.findOne({
            usuario_id: usuarioId,
            videojuego_id,
        });

        if (favoritoExistente) {
            throw new ConflictException('Este videojuego ya está en tu lista de favoritos');
        }

        // Agregar a favoritos
        const nuevoFavorito = new this.favoritoModel({
            usuario_id: usuarioId,
            videojuego_id,
        });

        return nuevoFavorito.save();
    }


    async removeFromFavorites(videojuegoId: string, usuarioId: string): Promise<void> {
        const favorito = await this.favoritoModel.findOne({
            usuario_id: usuarioId,
            videojuego_id: videojuegoId,
        });

        if (!favorito) {
            throw new NotFoundException('Este videojuego no está en tu lista de favoritos');
        }

        await this.favoritoModel.findByIdAndDelete(favorito._id);
    }

    async getFavorites(usuarioId: string): Promise<any[]> {
        const favoritos = await this.favoritoModel.find({ usuario_id: usuarioId })
            .populate('videojuego_id', 'nombre tema año rating descripcion')
            .sort({ fecha_agregado: -1 })
            .exec();

        return favoritos.map(favorito => ({
            id: favorito._id,
            fecha_agregado: favorito.fecha_agregado,
            videojuego: favorito.videojuego_id,
        }));
    }

    async checkIsFavorite(videojuegoId: string, usuarioId: string): Promise<boolean> {
        // Validar que videojuegoId y usuarioId sean válidos
        if (!videojuegoId || videojuegoId === 'undefined') {
            throw new BadRequestException('ID de videojuego inválido');
        }

        if (!usuarioId || usuarioId === 'undefined') {
            throw new BadRequestException('ID de usuario inválido');
        }

        try {
            const favorito = await this.favoritoModel.findOne({
                videojuego_id: videojuegoId,
                usuario_id: usuarioId,
            }).exec();

            return !!favorito;
        } catch (error) {
            this.logger.error(`Error al verificar favorito: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Error al verificar favorito');
        }
    }



}