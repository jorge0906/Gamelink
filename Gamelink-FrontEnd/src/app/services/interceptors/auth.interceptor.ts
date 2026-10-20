import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del sessionStorage en lugar de localStorage
  const token = sessionStorage.getItem('auth_token');

  // Si hay un token, añadirlo a la solicitud
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq).pipe(
      catchError(error => {
        // Si hay un error 401 (Unauthorized), podría ser que el token expiró
        if (error.status === 401) {
          console.error('Error 401: Token posiblemente caducado o inválido');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('currentUser');
        }
        return throwError(() => error);
      })
    );
  }

  // Si no hay token, pasar la solicitud sin modificar
  return next(req);
};
