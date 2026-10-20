import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {AuthService, Usuario} from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  calendarOutline,
  personOutline,
  timeOutline,
  createOutline,
  logOutOutline,
  personCircleOutline,
  alertCircleOutline, informationCircleOutline
} from 'ionicons/icons';
import {EditarPerfilComponent} from "../editar-perfil/editar-perfil.component";

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink, EditarPerfilComponent]
})
export class PerfilPage implements OnInit {
  usuario: any = null;
  segmentActivo: string = 'info';
  cargando: boolean = true;
  error: string | null = null;
  mostrarFormularioEdicion: boolean = false;

  // Datos de actividad
  recentGames: any[] = [];
  recentRatings: any[] = [];
  recentComments: any[] = [];
  recentAchievements: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    addIcons({
      'mail-outline': mailOutline,
      'calendar-outline': calendarOutline,
      'person-outline': personOutline,
      'time-outline': timeOutline,
      'create-outline': createOutline,
      'log-out-outline': logOutOutline,
      'person-circle-outline': personCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'information-circle-outline': informationCircleOutline,
    });
  }

  ngOnInit() {
    this.cargarPerfil();
  }

  ionViewWillEnter() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.cargando = true;
    this.error = null;

    const usuarioBasico = this.authService.getCurrentUser();

    if (usuarioBasico && usuarioBasico.id) {
      const userId = usuarioBasico.id;

      this.http.get(`${environment.apiUrl}/usuarios/${userId}`).subscribe({
        next: (perfilCompleto: any) => {
          this.usuario = perfilCompleto;
          this.cargando = false;

        },
        error: (err) => {
          console.error('Error en perfil', err);
          this.error = 'No se pudo cargar el perfil';
          this.usuario = usuarioBasico;
          this.cargando = false;
        }
      });
    } else {
      this.usuario = null;
      this.cargando = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  getDefaultAvatar() {
    return 'assets/default-avatar.png';
  }

  cambiarSegmento(segmento: string) {
    this.segmentActivo = segmento;
  }

  obtenerGenero(sexo: any): string {
    if (!sexo) {
      return 'No disponible';
    }

    if (sexo === 'M' || sexo === 'm') {
      return 'Masculino';
    } else if (sexo === 'F' || sexo === 'f') {
      return 'Femenino';
    } else {
      return 'No especificado';
    }
  }

  formatFecha(fecha: any): string {
    if (!fecha) return 'No disponible';

    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha inválida';
    }
  }

  abrirEdicion() {
    this.mostrarFormularioEdicion = true;
  }

  cerrarEdicion() {
    this.mostrarFormularioEdicion = false;
  }

  actualizarPerfil(usuarioActualizado: Usuario) {
    this.usuario = usuarioActualizado;
    this.mostrarFormularioEdicion = false;

  }
}
