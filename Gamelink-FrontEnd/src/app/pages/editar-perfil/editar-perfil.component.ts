import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class EditarPerfilComponent implements OnInit {
  @Input() usuario!: Usuario;
  @Output() cerrar = new EventEmitter<boolean>();
  @Output() actualizado = new EventEmitter<Usuario>();

  profileForm!: FormGroup;
  cargando: boolean = false;
  error: string | null = null;
  formErrors: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    addIcons({
      'alert-circle-outline': alertCircleOutline
    });
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.profileForm = this.fb.group({
      nombre: [this.usuario?.nombre || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: [this.usuario?.apellido || '', [Validators.maxLength(50)]],
      nick: [this.usuario?.nick || '', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      edad: [this.usuario?.edad || null, [Validators.min(10), Validators.max(120)]],
      sexo: [this.usuario?.sexo || ''],
      descripcion: [this.usuario?.descripcion || '', [Validators.maxLength(500)]]
    });
  }

  validateForm() {
    this.formErrors = {};
    const controls = this.profileForm.controls;

    if (controls['nombre'].invalid && controls['nombre'].touched) {
      if (controls['nombre'].errors?.['required']) {
        this.formErrors.nombre = 'El nombre es obligatorio';
      } else if (controls['nombre'].errors?.['minlength']) {
        this.formErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
      } else if (controls['nombre'].errors?.['maxlength']) {
        this.formErrors.nombre = 'El nombre no puede tener más de 50 caracteres';
      }
    }

    if (controls['nick'].invalid && controls['nick'].touched) {
      if (controls['nick'].errors?.['required']) {
        this.formErrors.nick = 'El nickname es obligatorio';
      } else if (controls['nick'].errors?.['minlength']) {
        this.formErrors.nick = 'El nickname debe tener al menos 3 caracteres';
      } else if (controls['nick'].errors?.['maxlength']) {
        this.formErrors.nick = 'El nickname no puede tener más de 20 caracteres';
      }
    }

    return Object.keys(this.formErrors).length === 0;
  }

  guardarCambios() {
    if (!this.validateForm()) {
      return;
    }

    this.cargando = true;
    this.error = null;

    const datosActualizados = this.profileForm.value;

    this.authService.actualizarUsuario(datosActualizados)
      .subscribe({
        next: (usuarioActualizado) => {
          this.cargando = false;
          this.actualizado.emit(usuarioActualizado);
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al actualizar perfil', err);

          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else if (err.status === 409) {
            this.error = 'El nickname ya está en uso';
          } else {
            this.error = 'No se pudieron guardar los cambios. Intenta nuevamente.';
          }
        }
      });
  }

  cancelar() {
    this.cerrar.emit(true);
  }
}
