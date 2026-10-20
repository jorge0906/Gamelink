import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    Request,
    UnauthorizedException, Req
} from '@nestjs/common';
import { ValoracionesService } from './valoraciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam, ApiQuery
} from '@nestjs/swagger';
import { CreateValoracionDto } from './dto/valoracion.dto/create-valoracion.dto';
import { UpdateValoracionDto } from './dto/valoracion.dto/update-valoracion.dto';
import {FilterValoracionesDto} from "./dto/valoracion.dto/filter-valoraciones.dto";
import {User} from "../auth/user.decorator";

@ApiTags('valoraciones')
@Controller('valoraciones')
export class ValoracionesController {
    constructor(private readonly valoracionesService: ValoracionesService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una nueva valoración con comentario' })
    create(@Request() req, @Body() createValoracionDto: CreateValoracionDto) {
        const userId = req.user.userId || req.user.id || req.user.sub;
        if (!userId) {
            throw new UnauthorizedException('Usuario no autorizado');
        }
        return this.valoracionesService.create(userId, createValoracionDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Obtener todas las valoraciones con filtros' })
    @ApiQuery({ name: 'videojuego_id', required: false })
    @ApiQuery({ name: 'usuario_id', required: false })
    @ApiQuery({ name: 'puntuacion', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    findAll(@Query() query: FilterValoracionesDto, @Request() req) {
        if (!query.usuario_id && req.user?.userId) {
            query.usuario_id = req.user.userId;
        }
        return this.valoracionesService.findAll(query);
    }


    @Get(':id')
    @ApiOperation({ summary: 'Obtener una valoración por ID' })
    @ApiParam({ name: 'id', description: 'ID de la valoración' })
    findOne(@Param('id') id: string) {
        return this.valoracionesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar una valoración' })
    @ApiParam({ name: 'id', description: 'ID de la valoración' })
    update(
        @Param('id') id: string,
        @Request() req,
        @Body() updateValoracionDto: UpdateValoracionDto
    ) {
        const userId = req.user?.userId || req.user?.id || req.user?.sub;
        if (!userId) {
            throw new UnauthorizedException('Usuario no autorizado');
        }
        return this.valoracionesService.update(id, userId, updateValoracionDto);
    }


    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string, @Request() req) {
        const userId = req.user.id;
        return this.valoracionesService.remove(id, userId);
    }

    @Post(':id/unlike')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Quitar like a una valoración' })
    @ApiParam({ name: 'id', description: 'ID de la valoración' })
    async unlike(@Param('id') id: string, @Request() req) {
        const userId = req.user.userId || req.user.id || req.user.sub;
        if (!userId) {
            throw new UnauthorizedException('Usuario no autorizado');
        }


        return this.valoracionesService.removeLike(id, userId);
    }

    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Dar like a una valoración' })
    async toggleLike(@Param('id') id: string, @Request() req) {
        const userId = req.user.userId || req.user.id || req.user.sub;
        return this.valoracionesService.toggleLike(id, userId);
    }


    @Get('videojuego/:id/mi-valoracion')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener la valoración del usuario actual para un videojuego' })
    @ApiParam({ name: 'id', description: 'ID del videojuego' })
    getUserValoracion(@Param('id') id: string, @Request() req) {
        return this.valoracionesService.getUserValoracion(id, req.user.userId);
    }

    @Get('videojuego/:id/promedio')
    @ApiOperation({ summary: 'Obtener el promedio de valoraciones de un videojuego' })
    @ApiParam({ name: 'id', description: 'ID del videojuego' })
    getPromedio(@Param('id') id: string) {
        return this.valoracionesService.getPromedioValoraciones(id);
    }

    @Get('mis-valoraciones')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener todas las valoraciones del usuario actual' })
    getMisValoraciones(@Request() req, @Query() query: CreateValoracionDto) {
        const queryWithUser = { ...query, usuario_id: req.user.userId };
        return this.valoracionesService.findAll(queryWithUser);
    }
}
