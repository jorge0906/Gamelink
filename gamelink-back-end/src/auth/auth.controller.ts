import {Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException, Logger} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {LoginDto} from "./dto/auth.dto/auth.dto";

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    private readonly logger = new Logger(AuthController.name);


    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        try {
            // Pasar el objeto loginDto completo
            const result = await this.authService.login(loginDto);
            return result;
        } catch (error) {
            this.logger.error(`Error en login: ${error.message}`);
            throw new UnauthorizedException(error.message);
        }
    }

    @Post('register')
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    @ApiResponse({ status: 201, description: 'Usuario registrado con éxito' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    async register(@Body() registerDto: any) {
        return this.authService.register(registerDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil obtenido con éxito' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    getProfile(@Req() req) {
        return req.user;
    }
}