import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginRedirectService {
  constructor(private router: Router, private authService: AuthService) {}

  onLoginSuccess() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/juegos']);
    }
  }
}
