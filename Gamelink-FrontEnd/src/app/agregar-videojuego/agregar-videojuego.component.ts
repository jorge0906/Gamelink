import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  ModalController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { IonicModule } from "@ionic/angular";
import { VideojuegosService } from "../services/videojuegos.service";
import { AuthService } from "../services/auth.service";
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-agregar-videojuego',
  templateUrl: './agregar-videojuego.component.html',
  styleUrls: ['./agregar-videojuego.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class AgregarVideojuegoComponent implements OnInit {
  videojuegoForm!: FormGroup;
  temas: string[] = [
    'Aventura', 'RPG', 'Acción', 'Estrategia',
    'Deportes', 'Simulación', 'Shooter', 'Rol', 'Carreras', 'Terror'
  ];
  plataformas: string[] = [
    'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S',
    'Xbox One', 'Nintendo Switch', 'Mobile'
  ];
  isSubmitting = false;
  currentYear = new Date().getFullYear();
  isAuthenticated = false;

  constructor(
    private formBuilder: FormBuilder,
    private videojuegosService: VideojuegosService,
    private modalController: ModalController,
    private toastController: ToastController,
    private authService: AuthService,
    private loadingController: LoadingController
  ) {
    addIcons({
      'close-outline': closeOutline
    });
  }

  async ngOnInit() {
    // Inicializar el formulario
    this.initForm();


  }

  initForm() {
    // Crear el FormArray para las plataformas como checkboxes
    const plataformasControls = this.plataformas.map(() => this.formBuilder.control(false));

    this.videojuegoForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tema: ['', Validators.required],
      anio: [this.currentYear, [
        Validators.required,
        Validators.min(1950),
        Validators.max(this.currentYear + 5)
      ]],
      edad_minima: [12, [
        Validators.required,
        Validators.min(0),
        Validators.max(18)
      ]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      imagen: [''],
      plataformasArray: this.formBuilder.array(plataformasControls)
    });

    console.log('Formulario inicializado con valores:', this.videojuegoForm.value);
  }

  getSelectedPlataformas(): string[] {
    const result: string[] = [];
    const plataformasArray = this.videojuegoForm.get('plataformasArray') as FormArray;

    plataformasArray.controls.forEach((control, index) => {
      if (control.value === true) {
        result.push(this.plataformas[index]);
      }
    });

    return result;
  }




  async onSubmit() {
    if (this.videojuegoForm.invalid) {
      Object.keys(this.videojuegoForm.controls).forEach(key => {
        const control = this.videojuegoForm.get(key);
        control?.markAsTouched();
      });

      this.showToast('Por favor, corrige los errores en el formulario', 'danger');
      return;
    }

    this.isSubmitting = true;



    const formValues = { ...this.videojuegoForm.value };
    const selectedPlataformas = this.getSelectedPlataformas();

    const videojuegoData = {
      nombre: formValues.nombre,
      tema: formValues.tema,
      anio: formValues.anio,
      edad_minima: formValues.edad_minima,
      descripcion: formValues.descripcion,
      imagen: formValues.imagen,
      plataformas: selectedPlataformas
    };

    console.log('Datos del formulario a enviar:', videojuegoData);

    const token = localStorage.getItem('auth_token');
    console.log('Token antes de enviar:', token ? 'Disponible' : 'No disponible');

    this.videojuegosService.addVideojuego(videojuegoData).subscribe({
      next: (result) => {
        console.log('Videojuego añadido correctamente:', result);

        this.showToast('Videojuego añadido correctamente', 'success');

        // Cerrar el modal y enviar datos actualizados
        this.modalController.dismiss({
          added: true,
          videojuego: result
        });
      },
      error: (error) => {
        console.error('Error al añadir videojuego:', error);

        this.showToast('Error al añadir el videojuego: ' +
          (error.error?.message ?
            (Array.isArray(error.error.message) ?
              error.error.message.join(', ') :
              error.error.message) :
            'No autorizado'),
          'danger');

        this.isSubmitting = false;
      }
    });
  }

  cancel() {
    this.modalController.dismiss({
      added: false
    });
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });

    await toast.present();
  }

  // Getters para el formulario
  get nombreControl() {
    return this.videojuegoForm.get('nombre');
  }
  get temaControl() {
    return this.videojuegoForm.get('tema');
  }
  get anioControl() {
    return this.videojuegoForm.get('anio');
  }
  get edadMinimaControl() {
    return this.videojuegoForm.get('edad_minima');
  }
  get descripcionControl() {
    return this.videojuegoForm.get('descripcion');
  }
  get plataformasArray() {
    return this.videojuegoForm.get('plataformasArray') as FormArray;
  }
}
