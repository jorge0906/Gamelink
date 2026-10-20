import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Videojuego {
  _id: string;
  nombre: string;
  tema: string;
  anio: number;
  rating: number;
  edad_minima: number;
  descripcion: string;
  imagen?: string;
  fecha_ingreso: Date;
  usuario_id: string | { _id: string; nick: string; nombre: string };
  plataformas: string[];
  usuario?: {
    nick: string;
    nombre: string;
    foto_perfil?: string;
  };
  isFavorite?: boolean;
}


export interface VideojuegosResponse {
  data: Videojuego[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VideojuegosService {
  private apiUrl = environment.apiUrl;

  private mockVideojuegos: Videojuego[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Obtener videojuegos con filtros y paginación
  getVideojuegos(params?: any): Observable<VideojuegosResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<VideojuegosResponse>(`${this.apiUrl}/videojuegos`, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo videojuegos:', error);
          return this.getMockVideojuegos(params); // Fallback a mock
        })
      );
  }

  // Obtener videojuego por ID
  getVideojuegoById(id: string): Observable<Videojuego> {
    return this.http.get<Videojuego>(`${this.apiUrl}/videojuegos/${id}`)
      .pipe(
        tap(videojuego => console.log('Videojuego cargado:', videojuego)),
        catchError(error => {
          console.error('Error cargando videojuego:', error);
          return this.getMockVideojuegoById(id);
        })
      );
  }

  addVideojuego(videojuegoData: Partial<Videojuego>): Observable<Videojuego> {
    console.log('Enviando datos al backend (original):', videojuegoData);

    const currentUser = this.authService.getCurrentUser();

    const { usuario_id, rating, ...datosPermitidos } = videojuegoData;

    console.log('Datos filtrados a enviar:', datosPermitidos);
    console.log('Usuario actual:', currentUser);

    return this.http.post<Videojuego>(`${this.apiUrl}/videojuegos`, datosPermitidos).pipe(
      tap(response => console.log('Videojuego añadido con éxito:', response)),
      catchError(error => {
        console.error('Error añadiendo videojuego:', error);

        if (error.status === 401 || error.status === 403) {
          console.log('Error de autenticación, creando mock');

          const mockResponse: Videojuego = {
            _id: 'mock-' + new Date().getTime(),
            nombre: datosPermitidos.nombre || '',
            tema: datosPermitidos.tema || '',
            anio: datosPermitidos.anio || new Date().getFullYear(),
            rating: 0,
            edad_minima: datosPermitidos.edad_minima || 3,
            descripcion: datosPermitidos.descripcion || '',
            imagen: datosPermitidos.imagen || '',
            plataformas: datosPermitidos.plataformas || [],
            fecha_ingreso: new Date(),
            usuario_id: currentUser?.id || '',
            usuario: currentUser ? {
              nick: currentUser.nick,
              nombre: currentUser.nombre,
              foto_perfil: currentUser.foto_perfil
            } : undefined
          };

          if (this.mockVideojuegos) {
            this.mockVideojuegos.unshift(mockResponse);
          }

          return of(mockResponse);
        }

        throw error;
      })
    );
  }

  getTemas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/videojuegos/temas`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo temas:', error);
          return of(['Aventura', 'RPG', 'Acción', 'Estrategia', 'Deportes', 'Simulación', 'Rol', 'Carreras', 'Shooter', 'Terror']);
        })
      );
  }

  private getMockVideojuegos(params?: any): Observable<VideojuegosResponse> {
    let filteredGames = [...this.mockVideojuegos];

    if (params) {
      if (params.buscar) {
        const term = params.buscar.toLowerCase();
        filteredGames = filteredGames.filter(g =>
          g.nombre.toLowerCase().includes(term) ||
          g.descripcion.toLowerCase().includes(term)
        );
      }

      if (params.tema) {
        filteredGames = filteredGames.filter(g => g.tema === params.tema);
      }

      if (params.anioMin) {
        filteredGames = filteredGames.filter(g => g.anio >= params.anioMin);
      }

      if (params.anioMax) {
        filteredGames = filteredGames.filter(g => g.anio <= params.anioMax);
      }

      if (params.ratingMin) {
        filteredGames = filteredGames.filter(g => g.rating >= params.ratingMin);
      }
    }

    const sortField = params?.ordenarPor || 'rating';
    const sortOrder = params?.orden === 'asc' ? 1 : -1;

    filteredGames.sort((a, b) => {
      if ((a as any)[sortField] < (b as any)[sortField]) return -1 * sortOrder;
      if ((a as any)[sortField] > (b as any)[sortField]) return 1 * sortOrder;
      return 0;
    });

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = page * limit;

    return of({
      data: filteredGames.slice(start, end),
      meta: {
        total: filteredGames.length,
        page,
        limit,
        pages: Math.ceil(filteredGames.length / limit)
      }
    });
  }

  private getMockVideojuegoById(id: string): Observable<Videojuego> {
    const juego = this.mockVideojuegos.find(g => g._id === id);
    return of(juego || this.mockVideojuegos[0]);
  }

  deleteVideojuego(id: string): Observable<any> {

    return this.http.delete(`${this.apiUrl}/videojuegos/${id}`)
      .pipe(
        tap(response => console.log('Videojuego eliminado:', response)),
        catchError(error => {
          console.error('Error eliminando videojuego:', error);

          if (error.status === 401 || error.status === 403) {
            return throwError(() => new Error('No tienes permisos para eliminar este videojuego'));
          }

          return throwError(() => error);
        })
      );
  }
}
