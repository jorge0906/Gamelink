import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from "@ionic/angular";

@Component({
  selector: 'app-registrarse',
  templateUrl: './registrarse.page.html',
  styleUrls: ['./registrarse.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterLink]
})
export class RegistrarsePage implements OnInit {
  registerForm: FormGroup;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.registerForm = this.formBuilder.group({
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContraseña: ['', Validators.required],
      nick: ['', [Validators.required, Validators.minLength(3)]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(13), Validators.max(120)]],
      sexo: ['', Validators.required],
      descripcion: [''],
      aceptarTerminos: [false, Validators.requiredTrue]
    }, {
      validator: this.mustMatch('contraseña', 'confirmarContraseña')
    });
  }

  ngOnInit() {}

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  async register() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando...'
    });
    await loading.present();

    // Obtener datos del formulario y preparar objeto para enviar
    const formData = this.registerForm.value;

    // Eliminar campos que no deben enviarse al backend
    delete formData.confirmarContraseña;
    delete formData.aceptarTerminos;

    // Añadir fecha de registro
    formData.fecha_registro = new Date();

    console.log('Datos de registro a enviar:', formData);

    this.authService.register(formData).subscribe({
      next: (response) => {
        loading.dismiss();
        console.log('Registro exitoso:', response);

        // Iniciar sesión automáticamente
        this.authService.login(formData.correo, formData.contraseña).subscribe({
          next: (loginResponse) => {
            console.log('Login automático exitoso');
            this.showToast('Registro exitoso');
            this.router.navigate(['/tabs/videojuegos']);
          },
          error: (loginError) => {
            console.error('Error en login automático:', loginError);
            this.showToast('Registro exitoso. Por favor, inicia sesión.');
            this.router.navigate(['/iniciar-sesion']);
          }
        });
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error en registro:', error);
        let errorMsg = 'Error al registrarse';

        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 400) {
          errorMsg = 'Datos inválidos o usuario ya existe';
        }

        this.showToast(errorMsg);
      }
    });
  }
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
