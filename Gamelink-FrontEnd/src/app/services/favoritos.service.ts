import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private apiUrl = environment.apiUrl;

  private favoritosSubject = new BehaviorSubject<string[]>([]);
  public favoritos = this.favoritosSubject.asObservable();

  private favoritosCache: {[key: string]: boolean} = {};


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('FavoritosService: Inicializando servicio');

    // Cargar favoritos inicialmente
    this.loadFavoritos();

    this.authService.token.subscribe(token => {
      if (token) {
        // Si hay un token nuevo, cargar favoritos
        this.loadFavoritos();
      } else {
        // Si no hay token (logout), limpiar favoritos
        this.favoritosSubject.next([]);
        this.favoritosCache = {};
      }
    });

    window.addEventListener('user-logged-in', ((event: CustomEvent) => {
      this.loadFavoritos();
    }) as EventListener);
  }


  loadFavoritos(): Observable<string[]> {
    if (!this.authService.isAuthenticated()) {
      this.favoritosSubject.next([]);
      this.favoritosCache = {};
      return of([]);
    }


    return this.http.get<any[]>(`${this.apiUrl}/favoritos`)
      .pipe(
        map(favoritos => {





          // Filtrar los favoritos que tienen videojuego_id válido
          const favoritosIds = favoritos
            .filter(f => f && f.videojuego && f.videojuego._id)
            .map(f => f.videojuego._id);



          // Actualizar el subject con los IDs
          this.favoritosSubject.next(favoritosIds);

          // Actualizar la caché
          this.updateCache(favoritosIds);

          return favoritosIds;
        }),
        catchError(error => {
          console.error('FavoritosService: Error cargando favoritos:', error);
          return of([]);
        }),
        tap(favoritosIds => {
        })
      );
  }

  getAllFavoritesSync(): string[] {
    return this.favoritosSubject.value;
  }

  clearCache(): void {
    console.log('FavoritosService: Limpiando caché de favoritos');
    this.favoritosSubject.next([]);
    this.favoritosCache = {};
    sessionStorage.removeItem('cached_favoritos');
  }

  // Actualizar cache local
  private updateCache(favoritosIds: string[]): void {
    // Resetear cache completamente
    this.favoritosCache = {};

    console.log('FavoritosService: Actualizando caché con', favoritosIds.length, 'favoritos');

    // Actualizar con nuevos valores
    favoritosIds.forEach(id => {
      if (id) {
        this.favoritosCache[id] = true;
      }
    });

    console.log('FavoritosService: Caché actualizada');
  }

  // Verificar si un videojuego está en favoritos
  isFavorite(videojuegoId: string): Observable<boolean> {
    if (!videojuegoId) {
      console.warn('FavoritosService: Se intentó verificar un ID de videojuego inválido');
      return of(false);
    }

    // Verificar en el subject actual (más confiable que la caché)
    const currentFavs = this.favoritosSubject.value;
    const isFav = currentFavs.includes(videojuegoId);

    // Actualizar caché si hay discrepancia
    if (this.favoritosCache[videojuegoId] !== isFav) {
      this.favoritosCache[videojuegoId] = isFav;
    }

    return of(isFav);
  }

  // Añadir a favoritos
  addToFavorites(videojuegoId: string): Observable<any> {
    console.log('FavoritosService: Añadiendo a favoritos ID:', videojuegoId);

    // Verificar que el ID no sea undefined o null
    if (!videojuegoId) {
      console.error('FavoritosService: ID de videojuego inválido:', videojuegoId);
      return of({ error: 'ID de videojuego inválido' });
    }

    // Actualizar cache local
    this.favoritosCache[videojuegoId] = true;
    const currentFavoritos = this.favoritosSubject.value;
    if (!currentFavoritos.includes(videojuegoId)) {
      this.favoritosSubject.next([...currentFavoritos, videojuegoId]);
    }

    // Crear el objeto de solicitud explícitamente
    const requestBody = { videojuego_id: videojuegoId };
    console.log('FavoritosService: Enviando datos:', requestBody);

    // Enviar al servidor
    return this.http.post(`${this.apiUrl}/favoritos`, requestBody)
      .pipe(
        tap(response => {
          console.log('FavoritosService: Respuesta de añadir favorito:', response);
        }),
        catchError(error => {
          console.error('FavoritosService: Error añadiendo a favoritos:', error);

          // Revertir cambios locales en caso de error
          this.favoritosCache[videojuegoId] = false;
          this.favoritosSubject.next(currentFavoritos);

          return of({ error: error.message || 'Error desconocido' });
        })
      );
  }

  // Obtener favoritos del usuario
  obtenerFavoritosUsuario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favoritos`);
  }

  // Obtener favoritos con datos completos
  getFavoritosConDatos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favoritos`).pipe(
      catchError(error => {
        console.error('Error obteniendo favoritos:', error);
        return of([]);
      })
    );
  }

  // Eliminar de favoritos
  removeFromFavorites(videojuegoId: string): Observable<any> {
    this.favoritosCache[videojuegoId] = false;
    const currentFavoritos = this.favoritosSubject.value;
    this.favoritosSubject.next(currentFavoritos.filter(id => id !== videojuegoId));

    // Enviar al servidor
    return this.http.delete(`${this.apiUrl}/favoritos/${videojuegoId}`).pipe(
      tap(response => {
        console.log('Eliminado de favoritos:', response);
      }),
      catchError(error => {
        console.error('Error eliminando de favoritos:', error);

        // Revertir cambios locales en caso de error
        this.favoritosCache[videojuegoId] = true;
        this.favoritosSubject.next([...this.favoritosSubject.value, videojuegoId]);

        return of({ error: error.message || 'Error desconocido' });
      })
    );
  }

  // Alternar favorito
  toggleFavorite(videojuegoId: string): Observable<any> {
    return this.isFavorite(videojuegoId).pipe(
      mergeMap(isFavorite => {
        // Si el videojuego ya está en favoritos, eliminarlo, si no, añadirlo
        return isFavorite ? this.removeFromFavorites(videojuegoId) : this.addToFavorites(videojuegoId);
      })
    );
  }

  // Obtener todos los favoritos del usuario
  getAllFavorites(): Observable<string[]> {
    return this.favoritos;
  }
}
