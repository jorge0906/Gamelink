import { Controller, Get, Put, Delete, Body, Param, UseGuards, Req, Query, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {ChangePasswordDto, UpdateUsuarioDto} from "./dto/usuario.dto/usuario.dto";

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Get()
    @ApiOperation({ summary: 'Obtener todos los usuarios' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios' })
    findAll() {
        return this.usuariosService.findAll();
    }

    @Get('search')
    @ApiOperation({ summary: 'Buscar usuarios por nombre o nick' })
    @ApiQuery({ name: 'q', description: 'Término de búsqueda' })
    @ApiResponse({ status: 200, description: 'Resultados de la búsqueda' })
    search(@Query('q') query: string) {
        return this.usuariosService.search(query);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil del usuario' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    getProfile(@Req() req) {
        return this.usuariosService.findById(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un usuario por ID' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    findById(@Param('id') id: string) {
        return this.usuariosService.findById(id);
    }

    @Get('nick/:nick')
    @ApiOperation({ summary: 'Obtener un usuario por nick' })
    @ApiParam({ name: 'nick', description: 'Nick del usuario' })
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    findByNick(@Param('nick') nick: string) {
        return this.usuariosService.findByNick(nick);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil actualizado' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    update(@Req() req, @Body() updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.update(req.user.id, updateUsuarioDto);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cambiar contraseña del usuario' })
    @ApiResponse({ status: 200, description: 'Contraseña cambiada' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.usuariosService.changePassword(req.user.id, changePasswordDto);
    }

    @Delete('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar cuenta del usuario' })
    @ApiResponse({ status: 200, description: 'Cuenta eliminada' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    delete(@Req() req) {
        return this.usuariosService.delete(req.user.id);
    }

    @Get('check/nick/:nick')
    @ApiOperation({ summary: 'Verificar disponibilidad de nick' })
    @ApiParam({ name: 'nick', description: 'Nick a verificar' })
    @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario a excluir (opcional)' })
    @ApiResponse({ status: 200, description: 'Resultado de la verificación' })
    checkNickAvailability(
        @Param('nick') nick: string,
        @Query('userId') userId?: string
    ) {
        return this.usuariosService.isNickAvailable(nick, userId);
    }

    @Get('check/email/:email')
    @ApiOperation({ summary: 'Verificar disponibilidad de correo' })
    @ApiParam({ name: 'email', description: 'Correo a verificar' })
    @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario a excluir (opcional)' })
    @ApiResponse({ status: 200, description: 'Resultado de la verificación' })
    checkEmailAvailability(
        @Param('email') email: string,
        @Query('userId') userId?: string
    ) {
        return this.usuariosService.isEmailAvailable(email, userId);
    }
}