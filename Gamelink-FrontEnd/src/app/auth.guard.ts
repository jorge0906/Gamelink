import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "./services/auth.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    if (this.authService.isAuthenticated()) {
      if (state.url === '/iniciar-sesion' || state.url === '/registrarse') {
        this.router.navigate(['/tabs/videojuegos']); // Redirigir a videojuegos si está autenticado
        return false;
      }
      return true;  // Si está autenticado, permite el acceso
    } else {
      // Si no está autenticado, redirigir a iniciar sesión
      this.router.navigate(['/iniciar-sesion']);
      return false;
    }
  }
}
