import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LoadingController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from "@ionic/angular";

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.page.html',
  styleUrls: ['./iniciar-sesion.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterLink]
})
export class IniciarSesionPage implements OnInit {
  loginForm: FormGroup;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tabs/perfil']);
    }
  }



  async login() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'circles'
    });
    await loading.present();

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    console.log('Intentando login con:', {
      correo: email,
      contraseñaLength: password?.length || 0
    });

    this.authService.login(email, password).subscribe({
      next: (response) => {
        loading.dismiss();
        console.log('Login exitoso:', response);

        const token = sessionStorage.getItem('auth_token');
        console.log('Token guardado después de login:', token ? 'Sí' : 'No');

        // Redirigir a videojuegos en lugar de perfil
        this.router.navigate(['/tabs/videojuegos']);
      },
      error: (error) => {
        console.error('Error en login real:', error);

        // Mostrar mensaje de error más descriptivo
        let errorMessage = 'Error al iniciar sesión';

        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        loading.dismiss();
        this.showToast(errorMessage);
      }
    });


  }



  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }




}
