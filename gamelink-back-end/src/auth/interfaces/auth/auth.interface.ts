export interface JwtPayload {
    sub: string;
    username?: string;
    iat?: number;
    exp?: number;
}

export interface AuthResponse {
    access_token: string;
    usuario: {
        id: string;
        correo: string;
        nick: string;
    };
}