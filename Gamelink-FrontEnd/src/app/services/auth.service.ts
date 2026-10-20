import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: string;
  correo: string;
  nick: string;
  nombre: string;
  apellido: string;
  edad: number;
  sexo: string;
  foto_perfil?: string;
  descripcion?: string;
  fecha_registro: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar token guardado al iniciar
    this.checkSavedToken();
  }



  login(correo: string, contraseña: string): Observable<any> {
    console.log(`Intentando login con: ${correo}`);

    return this.http.post<any>(`${this.apiUrl}/auth/login`, { correo, contraseña })
      .pipe(
        tap(response => {
          console.log('Respuesta completa de login:', response);

          if (response && response.token) {
            console.log('Token recibido:', response.token);

            console.log('Guardando token en sessionStorage');
            sessionStorage.setItem('auth_token', response.token);
            this.tokenSubject.next(response.token);

            if (response.usuario) {
              console.log('Usuario recibido:', response.usuario);
              this.currentUserSubject.next(response.usuario);
              sessionStorage.setItem('currentUser', JSON.stringify(response.usuario));

              setTimeout(() => {
                console.log('Login completo, notificando a otros servicios...');


                if (window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('user-logged-in', {
                    detail: { userId: response.usuario.id }
                  }));
                }
              }, 200);
            }
          } else {
            console.warn('Respuesta sin token:', response);
          }
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          console.log('Registro exitoso:', response);

          if (response && response.access_token) {
            sessionStorage.setItem('auth_token', response.access_token);
            this.tokenSubject.next(response.access_token);

            // Si también devuelve el usuario, guardarlo
            if (response.usuario) {
              this.currentUserSubject.next(response.usuario);
              sessionStorage.setItem('currentUser', JSON.stringify(response.usuario));
            }
          }
        }),
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  getUserProfile(): Observable<Usuario> {
    const token = this.getToken();

    if (!token) {
      console.warn('No hay token para obtener perfil');
      return throwError(() => new Error('No autenticado'));
    }

    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      tap(user => {
        console.log('Perfil recibido:', user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Error obteniendo perfil:', error);
        if (error.status === 401) {
          console.warn('Token inválido, cerrando sesión');
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }





  actualizarUsuario(userData: Partial<Usuario>): Observable<Usuario> {
    const token = this.getToken();

    if (!token) {
      console.warn('No hay token para actualizar usuario');
      return throwError(() => new Error('No autenticado'));
    }

    const datosActualizados = { ...userData };

    if ('nick' in datosActualizados) {
      delete datosActualizados.nick;
    }

    console.log('Datos que se enviarán al servidor:', datosActualizados);

    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/profile`, datosActualizados, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      tap(usuarioActualizado => {
        console.log('Usuario actualizado:', usuarioActualizado);

        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          // Combinar el usuario actual con los datos actualizados
          const updatedUser = { ...currentUser, ...usuarioActualizado };
          this.currentUserSubject.next(updatedUser);

          // Actualizar también en sessionStorage en lugar de localStorage
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } else {
          this.currentUserSubject.next(usuarioActualizado);
          sessionStorage.setItem('currentUser', JSON.stringify(usuarioActualizado));
        }
      }),
      catchError(error => {
        console.error('Error actualizando usuario:', error);
        return throwError(() => error);
      })
    );
  }



  logout(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('currentUser');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/portada']);
  }

  getToken(): string | null {
    return this.tokenSubject.value || sessionStorage.getItem('auth_token');
  }

  getCurrentUser(): Usuario | null {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private checkSavedToken() {
    const savedToken = sessionStorage.getItem('auth_token'); // Cambiado de localStorage a sessionStorage
    console.log('Token guardado:', savedToken ? 'Sí' : 'No');

    if (savedToken) {
      this.tokenSubject.next(savedToken);
      // Cargar el perfil
      this.getUserProfile().subscribe({
        next: user => {
          console.log('Perfil cargado automáticamente:', user);
          this.currentUserSubject.next(user);
        },
        error: error => {
          console.error('Error cargando perfil inicial:', error);
          if (error.status === 401) {
            console.warn('Token inválido, limpiando almacenamiento');
            this.logout();
          }
        }
      });
    }
  }


}
