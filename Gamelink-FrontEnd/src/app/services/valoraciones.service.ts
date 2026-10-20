import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class ValoracionesService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener valoraciones con filtros
  getValoraciones(params?: any): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          const value = typeof params[key] === 'object' ? params[key].id || params[key]._id : params[key];
          httpParams = httpParams.set(key, value);
        }
      });
    }

    console.log('Enviando parámetros de búsqueda:',
      httpParams.keys().reduce((obj, key) => {
        obj[key] = httpParams.get(key);
        return obj;
      }, {} as Record<string, string | null>)
    );

    return this.http.get<any>(`${this.apiUrl}/valoraciones`, { params: httpParams }).pipe(
      tap(response => console.log('Valoraciones obtenidas:', response)),
      catchError(error => {
        console.error('Error obteniendo valoraciones:', error);
        // Devolver datos simulados en caso de error
        return of({ data: [], total: 0 });
      })
    );
  }


  createValoracion(valoracion: any): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      console.error('No hay autenticación al intentar crear valoración');
      return of({ error: 'No autenticado' });
    }

    return this.getMisValoraciones().pipe(
      switchMap(response => {
        const misValoraciones = response.data || [];
        const existingRating = misValoraciones.find(
          (v: any) => v.videojuego_id === valoracion.videojuego_id
        );

        if (existingRating) {
          console.log('Ya existe una valoración, actualizando:', existingRating._id);
          return this.updateValoracion(existingRating._id, {
            puntuacion: valoracion.puntuacion,
            comentario: valoracion.comentario
          });
        } else {
          console.log('No existe valoración previa (verificado con lista de valoraciones), creando nueva');
          return this.http.post<any>(`${this.apiUrl}/valoraciones`, valoracion).pipe(
            tap(response => console.log('Valoración creada:', response)),
            catchError(error => {
              console.error('Error creando valoración:', error);

              if (error.status === 409) {
                console.log('Detectado conflicto 409, buscando valoración existente por otra vía');
                return this.getValoraciones({
                  videojuego_id: valoracion.videojuego_id,
                  usuario_id: this.authService.getCurrentUser()?.id
                }).pipe(
                  switchMap(searchResult => {
                    if (searchResult.data && searchResult.data.length > 0) {
                      const found = searchResult.data[0];
                      console.log('Encontrada valoración existente vía búsqueda:', found._id);
                      return this.updateValoracion(found._id, {
                        puntuacion: valoracion.puntuacion,
                        comentario: valoracion.comentario
                      });
                    }

                    throw error;
                  })
                );
              }

              throw error;
            })
          );
        }
      }),
      catchError(error => {
        console.error('Error en el proceso de valoración:', error);
        throw error;
      })
    );
  }

  updateValoracion(id: string, valoracionData: any): Observable<any> {
    console.log(`Actualizando valoración ${id} con datos:`, valoracionData);

    return this.http.patch(`${this.apiUrl}/valoraciones/${id}`, valoracionData).pipe(
      tap(response => console.log('Valoración actualizada:', response)),
      catchError(error => {
        console.error('Error actualizando valoración:', error);
        throw error;
      })
    );
  }

  addLike(valoracionId: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, no se puede dar like');
      return of(null);
    }

    console.log('Añadiendo like para la valoración:', valoracionId);

    return this.http.post<any>(`${this.apiUrl}/valoraciones/${valoracionId}/like`, {}).pipe(
      tap(response => console.log('Respuesta de añadir like:', response)),
      catchError(error => {
        console.error('Error al dar like:', error);
        throw error;
      })
    );
  }

  removeLike(valoracionId: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, no se puede quitar like');
      return of(null);
    }

    console.log('Quitando like para la valoración:', valoracionId);

    return this.http.post<any>(`${this.apiUrl}/valoraciones/${valoracionId}/unlike`, {}).pipe(
      tap(response => console.log('Respuesta de quitar like:', response)),
      catchError(error => {
        console.error('Error al quitar like:', error);
        throw error;
      })
    );
  }

  // Eliminar una valoración
  deleteValoracion(id: string): Observable<any> {
    console.log('Eliminando valoración con ID:', id);
    return this.http.delete<any>(`${this.apiUrl}/valoraciones/${id}`).pipe(
      tap(response => console.log('Valoración eliminada:', response)),
      catchError(error => {
        console.error('Error eliminando valoración:', error);
        throw error;
      })
    );
  }

  // Obtener la valoración del usuario actual para un videojuego
  getUserValoracion(videojuegoId: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, no se puede obtener valoración');
      return of(null);
    }

    console.log('Consultando valoración del usuario para videojuego:', videojuegoId);

    return this.http.get<any>(`${this.apiUrl}/valoraciones/videojuego/${videojuegoId}/mi-valoracion`).pipe(
      tap(response => {
        if (response) {
          console.log('Valoración existente encontrada:', response._id);
        } else {
          console.log('No se encontró valoración previa');
        }
      }),
      catchError(error => {
        if (error.status === 404) {
          console.log('No existe valoración para este videojuego (404)');
          return of(null);
        }

        console.error('Error obteniendo valoración del usuario:', error);
        return of(null);
      })
    );
  }

  // Obtener las valoraciones del usuario actual
  getMisValoraciones(params?: any): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<any>(`${this.apiUrl}/valoraciones/mis-valoraciones`, { params: httpParams }).pipe(
      tap(response => console.log('Mis valoraciones:', response)),
      catchError(error => {
        console.error('Error obteniendo mis valoraciones:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  // Obtener el promedio de valoraciones de un videojuego
  getPromedioValoraciones(videojuegoId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/valoraciones/videojuego/${videojuegoId}/promedio`).pipe(
      catchError(error => {
        console.error('Error obteniendo promedio de valoraciones:', error);
        return of({ promedio: 0, total: 0 });
      })
    );
  }
}
