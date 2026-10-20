import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { VideojuegosService } from './videojuegos.service';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateVideojuegoDto, QueryVideojuegoDto, UpdateVideojuegoDto } from "./dto/videojuego.dto/videojuego.dto";

@ApiTags('videojuegos')
@Controller('videojuegos')
export class VideojuegosController {
    constructor(private readonly videojuegosService: VideojuegosService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear un nuevo videojuego' })
    @ApiResponse({ status: 201, description: 'Videojuego creado con éxito' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    create(@Body() createVideojuegoDto: CreateVideojuegoDto, @Req() req) {
        return this.videojuegosService.create(createVideojuegoDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener videojuegos con filtros y paginación' })
    @ApiResponse({ status: 200, description: 'Lista de videojuegos' })
    findAll(@Query() queryDto: QueryVideojuegoDto) {
        return this.videojuegosService.findAll(queryDto);
    }

    @Get('mis-juegos')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener videojuegos del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Lista de videojuegos del usuario' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    findByUsuario(@Req() req) {
        return this.videojuegosService.findByUsuario(req.user.id);
    }

    @Get('temas')
    @ApiOperation({ summary: 'Obtener lista de todos los temas/géneros' })
    @ApiResponse({ status: 200, description: 'Lista de temas' })
    getTemas() {
        return this.videojuegosService.getTemas();
    }

    @Get('plataformas')
    @ApiOperation({ summary: 'Obtener lista de todas las plataformas' })
    @ApiResponse({ status: 200, description: 'Lista de plataformas' })
    getPlataformas() {
        return this.videojuegosService.getPlataformas();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de videojuegos' })
    @ApiResponse({ status: 200, description: 'Estadísticas generales' })
    getStats() {
        return this.videojuegosService.getStats();
    }

    @Get('search')
    @ApiOperation({ summary: 'Buscar videojuegos por texto' })
    @ApiQuery({ name: 'q', description: 'Término de búsqueda' })
    @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
    search(@Query('q') query: string) {
        return this.videojuegosService.search(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un videojuego por ID' })
    @ApiParam({ name: 'id', description: 'ID del videojuego' })
    @ApiResponse({ status: 200, description: 'Videojuego encontrado' })
    @ApiResponse({ status: 404, description: 'Videojuego no encontrado' })
    findById(@Param('id') id: string) {
        return this.videojuegosService.findById(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar un videojuego' })
    @ApiParam({ name: 'id', description: 'ID del videojuego' })
    @ApiResponse({ status: 200, description: 'Videojuego actualizado' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para editar' })
    update(
        @Param('id') id: string,
        @Body() updateVideojuegoDto: UpdateVideojuegoDto,
        @Req() req
    ) {
        return this.videojuegosService.update(id, updateVideojuegoDto, req.user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar un videojuego' })
    @ApiParam({ name: 'id', description: 'ID del videojuego' })
    @ApiResponse({ status: 200, description: 'Videojuego eliminado' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar' })
    delete(@Param('id') id: string, @Req() req) {
        return this.videojuegosService.delete(id, req.user.id);
    }
}