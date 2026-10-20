import { Controller, Post, Delete, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { FavoritosService } from './favoritos.service';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import {CreateFavoritoDto} from "./dto/favorito.dto/favorito.dto";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@ApiTags('favoritos')
@Controller('favoritos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritosController {
    constructor(private readonly favoritosService: FavoritosService) {}

    @Post()
    @ApiOperation({ summary: 'Agregar videojuego a favoritos' })
    @ApiResponse({ status: 201, description: 'Videojuego agregado a favoritos' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 409, description: 'Ya está en favoritos' })
    addToFavorites(@Body() createFavoritoDto: CreateFavoritoDto, @Req() req) {
        return this.favoritosService.addToFavorites(createFavoritoDto, req.user.id);
    }

    @Delete(':videojuegoId')
    @ApiOperation({ summary: 'Eliminar videojuego de favoritos' })
    @ApiParam({ name: 'videojuegoId', description: 'ID del videojuego a eliminar de favoritos' })
    @ApiResponse({ status: 200, description: 'Videojuego eliminado de favoritos' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 404, description: 'No está en favoritos' })
    removeFromFavorites(@Param('videojuegoId') videojuegoId: string, @Req() req) {
        return this.favoritosService.removeFromFavorites(videojuegoId, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener lista de favoritos del usuario' })
    @ApiResponse({ status: 200, description: 'Lista de videojuegos favoritos' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    getFavorites(@Req() req) {
        return this.favoritosService.getFavorites(req.user.id);
    }

    @Get(':videojuegoId/check')
    @ApiOperation({ summary: 'Verificar si un videojuego está en favoritos' })
    @ApiParam({ name: 'videojuegoId', description: 'ID del videojuego a verificar' })
    @ApiResponse({ status: 200, description: 'Resultado de la verificación' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    checkIsFavorite(@Param('videojuegoId') videojuegoId: string, @Req() req) {
        return this.favoritosService.checkIsFavorite(videojuegoId, req.user.id);
    }
}
