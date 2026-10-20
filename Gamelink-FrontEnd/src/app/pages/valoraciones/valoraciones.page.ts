import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {
  IonicModule,
  LoadingController,
  ToastController,
  AlertController,
  InfiniteScrollCustomEvent
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  starOutline,
  star,
  chatbubbleOutline,
  personOutline,
  timeOutline,
  createOutline,
  trashOutline,
  arrowBack,
  closeOutline,
  addOutline,
  heartOutline,
  heart
} from 'ionicons/icons';
import { ValoracionesService } from '../../services/valoraciones.service';
import { Videojuego, VideojuegosService } from '../../services/videojuegos.service';
import { AuthService } from '../../services/auth.service';
import { environment } from "../../../environments/environment";

interface Valoracion {
  _id: string;
  comentario: string;
  puntuacion: number;
  videojuego_id: string;
  usuario_id?: any;
  likes: Array<string | { _id: string }>;
  fecha_valoracion?: Date | string;

  // Propiedades adicionales para la UI
  usuarioHaDadoLike?: boolean;
  likesCount?: number;
  likeEnProceso?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-valoraciones',
  templateUrl: './valoraciones.page.html',
  styleUrls: ['./valoraciones.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})

export class ValoracionesPage implements OnInit {
  // Listado de valoraciones
  valoraciones: any[] = [];

  // Estados
  isLoading = false;
  noResults = false;

  // Paginación
  currentPage = 1;
  totalPages = 0;
  limit = 10;

  // Filtros
  selectedVideojuego: string | null = null;
  selectedUser: string | null = null;

  nuevaValoracion = {
    videojuego_id: '' as string | undefined,
    puntuacion: 5,
    comentario: ''
  };

  // Estado para mostrar/ocultar el formulario de crear valoración
  showNewRatingForm = false;

  // Videojuegos disponibles (para selector)
  videojuegos: any[] = [];

  // Valoración del usuario actual para el videojuego seleccionado
  userRating: any = null;

  // Acción a realizar desde la URL (si se viene de otra página)
  actionFromUrl: string | null = null;

  constructor(
    private valoracionesService: ValoracionesService,
    private videojuegosService: VideojuegosService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    addIcons({
      'star-outline': starOutline,
      'star': star,
      'chatbubble-outline': chatbubbleOutline,
      'person-outline': personOutline,
      'time-outline': timeOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'arrow-back': arrowBack,
      'close-outline': closeOutline,
      'add-outline': addOutline,
      'heart-outline': heartOutline,
      'heart': heart
    });
  }

  ngOnInit() {
    // Verificar si hay parámetros en la URL
    this.route.queryParams.subscribe(params => {
      if (params['videojuegoId']) {
        this.selectedVideojuego = params['videojuegoId'];
        this.nuevaValoracion.videojuego_id = params['videojuegoId'];
      }

      if (params['action'] && params['action'] === 'rate') {
        this.actionFromUrl = 'rate';
        this.showNewRatingForm = true;
      }

      // Cargar datos iniciales
      this.loadVideojuegos();
    });
  }

  ionViewWillEnter() {
    // Asegura que tengamos la información más actualizada
    this.resetPagination();

    // Recargar valoraciones (sólo si los videojuegos ya fueron cargados)
    if (this.videojuegos.length > 0) {
      this.loadValoraciones();
    }
  }

  resetPagination() {
    this.currentPage = 1;
    this.valoraciones = [];
  }

  async loadVideojuegos() {
    const loading = await this.loadingController.create({
      message: 'Cargando videojuegos...',
      duration: 2000
    });
    await loading.present();

    this.videojuegosService.getVideojuegos().subscribe({
      next: (response) => {
        this.videojuegos = response.data;
        loading.dismiss();

        // Una vez cargados los videojuegos, cargamos las valoraciones
        this.loadValoraciones();

        // Si hay un videojuego seleccionado, cargar la valoración del usuario
        if (this.selectedVideojuego) {
          this.checkUserRating(this.selectedVideojuego);
        }
      },
      error: (error) => {
        console.error('Error cargando videojuegos:', error);
        loading.dismiss();
        this.showToast('Error cargando videojuegos');
      }
    });
  }



  async loadValoraciones() {
    this.isLoading = true;
    this.valoraciones = []; // Limpiar valoraciones anteriores al cargar nuevas

    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };

    if (this.selectedVideojuego) {
      params.videojuego_id = this.selectedVideojuego;
    }

    if (this.selectedUser) {
      params.usuario_id = this.selectedUser;
    }

    console.log('Cargando valoraciones con parámetros:', params);

    const loading = await this.loadingController.create({
      message: 'Cargando valoraciones...'
    });
    await loading.present();

    this.valoracionesService.getValoraciones(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        loading.dismiss();

        const userId = this.authService.getCurrentUser()?.id;
        console.log('ID del usuario actual:', userId);

        // Marcar si el usuario actual ha dado like
        this.valoraciones = (response.data || []).map((valoracion: Valoracion) => {
          const likes = Array.isArray(valoracion.likes) ? valoracion.likes : [];

          const usuarioHaDadoLike = userId ?
            likes.some((likeId: string | { _id: string }) =>
              likeId === userId ||
              (typeof likeId === 'object' && likeId?._id === userId) ||
              likeId?.toString() === userId
            ) :
            false;

          console.log(`Valoración ${valoracion._id} - Usuario ha dado like: ${usuarioHaDadoLike}`, {
            likesArray: likes,
            userId: userId
          });

          return {
            ...valoracion,
            usuarioHaDadoLike,
            likesCount: likes.length
          };
        });

        this.totalPages = Math.ceil(response.total / this.limit);
        this.noResults = this.valoraciones.length === 0;

        console.log('Valoraciones cargadas:', this.valoraciones.length);
      },
      error: (error) => {
        this.isLoading = false;
        loading.dismiss();
        console.error('Error cargando valoraciones:', error);
        this.showToast('Error cargando valoraciones');
      }
    });
  }

  checkUserRating(videojuegoId: string) {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    console.log('Verificando valoración del usuario para videojuego:', videojuegoId);

    this.valoracionesService.getUserValoracion(videojuegoId).subscribe({
      next: (valoracion) => {
        this.userRating = valoracion;
        console.log('Valoración del usuario encontrada:', valoracion ? 'Sí' : 'No');

        // Si existe una valoración, prellenar el formulario
        if (this.userRating) {
          this.nuevaValoracion.puntuacion = this.userRating.puntuacion;
          this.nuevaValoracion.comentario = this.userRating.comentario;
          console.log('Formulario prellenado con valoración existente');
        } else {
          // Si no existe, reiniciar el formulario con valores predeterminados
          this.nuevaValoracion.puntuacion = 5;
          this.nuevaValoracion.comentario = '';
        }
      },
      error: (error) => {
        console.error('Error verificando valoración del usuario:', error);
      }
    });
  }

  videojuegoSelectionChange() {
    console.log('Cambio en selección de videojuego:', this.nuevaValoracion.videojuego_id);

    // Reiniciar el formulario
    this.nuevaValoracion.puntuacion = 5;
    this.nuevaValoracion.comentario = '';
    this.userRating = null;

    if (this.nuevaValoracion.videojuego_id) {
      // Verificar que el ID es válido
      if (!/^[a-fA-F0-9]{24}$/.test(this.nuevaValoracion.videojuego_id)) {
        this.showToast('ID de videojuego no válido');
        return;
      }

      // Verificar si el usuario ya valoró este juego
      this.checkUserRating(this.nuevaValoracion.videojuego_id);

      // Actualizar el selectedVideojuego para los filtros
      this.selectedVideojuego = this.nuevaValoracion.videojuego_id;
    }

    // Resetear paginación y cargar valoraciones con el nuevo filtro
    this.resetPagination();
    this.loadValoraciones();
  }

  resetForm() {
    this.nuevaValoracion = {
      videojuego_id: '',
      puntuacion: 5,
      comentario: ''
    };
    this.showNewRatingForm = false;
    this.userRating = null;
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  async deleteValoracion(valoracionId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta valoración?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.valoracionesService.deleteValoracion(valoracionId).subscribe({
              next: () => {
                this.showToast('Valoración eliminada correctamente');

                // Si la valoración eliminada era la del usuario actual, actualizar estado
                if (this.userRating && this.userRating._id === valoracionId) {
                  this.userRating = null;
                }

                // Recargar valoraciones
                this.loadValoraciones();
              },
              error: (error) => {
                console.error('Error eliminando valoración:', error);
                this.showToast('Error al eliminar la valoración');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  loadMore(event: any) {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;

      const params: any = {
        page: this.currentPage,
        limit: this.limit
      };

      if (this.selectedVideojuego) {
        params.videojuego_id = this.selectedVideojuego;
      }

      if (this.selectedUser) {
        params.usuario_id = this.selectedUser;
      }

      this.valoracionesService.getValoraciones(params).subscribe({
        next: (response) => {
          const userId = this.authService.getCurrentUser()?.id;

          // Procesar los nuevos resultados
          const nuevasValoraciones = (response.data as Valoracion[]).map((valoracion) => ({
            ...valoracion,
            usuarioHaDadoLike: Array.isArray(valoracion.likes) && userId
              ? valoracion.likes.includes(userId)
              : false,
            likesCount: valoracion.likes?.length || 0
          }));

          // Añadir a la lista existente
          this.valoraciones = [...this.valoraciones, ...nuevasValoraciones];

          (event as InfiniteScrollCustomEvent).target.complete();

          // Deshabilitar infinite scroll si ya no hay más páginas
          if (this.currentPage >= this.totalPages) {
            (event as InfiniteScrollCustomEvent).target.disabled = true;
          }
        },
        error: (error) => {
          console.error('Error cargando más valoraciones:', error);
          (event as InfiniteScrollCustomEvent).target.complete();
        }
      });
    } else {
      (event as InfiniteScrollCustomEvent).target.complete();
      (event as InfiniteScrollCustomEvent).target.disabled = true;
    }
  }

  toggleNewRatingForm() {
    this.showNewRatingForm = !this.showNewRatingForm;

    // Si se muestra el formulario y hay un videojuego seleccionado, verificar valoración del usuario
    if (this.showNewRatingForm && this.nuevaValoracion.videojuego_id) {
      this.checkUserRating(this.nuevaValoracion.videojuego_id);
    } else if (!this.showNewRatingForm) {
      // Si se está cerrando el formulario, reiniciar el estado
      this.resetForm();
    }
  }

  canUserDeleteValoracion(valoracion: any): boolean {
    // Si no hay usuario autenticado, no puede eliminar
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Si no hay valoración o usuario_id, no puede eliminar
    if (!valoracion || !valoracion.usuario_id) {
      return false;
    }

    // Verificar si el usuario es el propietario de la valoración
    const valoracionUserId = typeof valoracion.usuario_id === 'object'
      ? valoracion.usuario_id?._id  // Acceso seguro con operador opcional
      : valoracion.usuario_id;

    return currentUser.id === valoracionUserId;
  }

  getVideojuegoNombre(videojuegoId: string): string {
    if (!videojuegoId) return 'Videojuego';

    const videojuego = this.videojuegos.find(v => v._id === videojuegoId);
    return videojuego ? videojuego.nombre : 'Videojuego';
  }

  getUserNick(valoracion: any): string {
    if (!valoracion || valoracion.usuario_id === null) {
      return 'Usuario anónimo';
    }

    if (valoracion.usuario_id && typeof valoracion.usuario_id === 'object') {
      return (valoracion.usuario_id as any).nick || 'Usuario';
    }

    if (valoracion.usuario) {
      return valoracion.usuario.nick || 'Usuario';
    }

    return 'Usuario';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private async showLoginPrompt() {
    const alert = await this.alertController.create({
      header: 'Inicia sesión',
      message: 'Necesitas iniciar sesión para valorar videojuegos',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Iniciar sesión',
          handler: () => {
            window.location.href = '/iniciar-sesion';
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  editValoracion(valoracion: any) {
    console.log('Editando valoración:', valoracion);

    this.userRating = valoracion;

    this.nuevaValoracion = {
      videojuego_id: valoracion.videojuego_id,
      puntuacion: valoracion.puntuacion,
      comentario: valoracion.comentario
    };



    this.showNewRatingForm = true;
  }


  submitValoracion() {
    if (!this.authService.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }

    const valoracionData = {
      ...(this.userRating ? {} : { videojuego_id: this.nuevaValoracion.videojuego_id }),
      puntuacion: this.nuevaValoracion.puntuacion,
      comentario: this.nuevaValoracion.comentario
    };

    console.log('Enviando valoración:', {
      datos: valoracionData,
      userRatingExists: !!this.userRating,
      userRatingId: this.userRating?._id,
      modo: this.userRating ? 'actualización' : 'creación'
    });

    const filtroActual = this.selectedVideojuego;

    if (this.userRating) {
      this.valoracionesService.updateValoracion(this.userRating._id, valoracionData)
        .subscribe({
          next: (updated) => {
            console.log('Valoración actualizada:', updated);
            this.mostrarToast('Valoración actualizada con éxito');

            this.resetForm();

            this.resetPagination();
            this.loadValoraciones();
          },
          error: (err) => {
            console.error('Error actualizando valoración:', err);
            this.mostrarToast('Error al actualizar valoración');
          }
        });
    } else {
      // Crear nueva valoración
      this.valoracionesService.createValoracion(valoracionData)
        .subscribe({
          next: (created) => {
            console.log('Valoración creada:', created);
            this.mostrarToast('Valoración creada con éxito');

            // Resetear el formulario y limpiar el filtro
            this.resetForm();
            this.selectedVideojuego = null;

            // Recargar todas las valoraciones sin filtro
            this.resetPagination();
            this.loadValoraciones();
          },
          error: (err) => {
            console.error('Error creando valoración:', err);
            this.mostrarToast('Error al crear valoración');
          }
        });
    }
  }



  toggleLike(valoracion: Valoracion) {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.showLoginPrompt();
      return;
    }

    if (valoracion.likeEnProceso) {
      console.log('Procesando like anterior, ignorando clic');
      return;
    }
    valoracion.likeEnProceso = true;

    const estadoActual = {
      usuarioHaDadoLike: valoracion.usuarioHaDadoLike,
      likesCount: valoracion.likesCount || 0
    };

    console.log('Estado actual antes de toggle:', estadoActual);

    valoracion.usuarioHaDadoLike = !estadoActual.usuarioHaDadoLike;
    valoracion.likesCount = estadoActual.usuarioHaDadoLike
      ? Math.max(0, estadoActual.likesCount - 1) // Quitar like
      : estadoActual.likesCount + 1;             // Añadir like

    const endpoint = estadoActual.usuarioHaDadoLike ? 'unlike' : 'like';

    console.log(`Usando endpoint: /valoraciones/${valoracion._id}/${endpoint}`);

    this.http.post(`${environment.apiUrl}/valoraciones/${valoracion._id}/${endpoint}`, {})
      .subscribe({
        next: (response: any) => {
          valoracion.likeEnProceso = false;
          console.log(`Respuesta del servidor (${endpoint}):`, response);

          if (response && Array.isArray(response.likes)) {
            valoracion.likes = response.likes;
            valoracion.likesCount = response.likes.length;

            const userIdString = userId.toString();
            const tieneUserLike = response.likes.some((like: any) => {
              if (typeof like === 'object' && like._id) {
                return like._id.toString() === userIdString;
              }
              return like.toString() === userIdString;
            });

            valoracion.usuarioHaDadoLike = tieneUserLike;

            console.log('Estado final confirmado por el servidor:', {
              usuarioHaDadoLike: valoracion.usuarioHaDadoLike,
              likesCount: valoracion.likesCount
            });
          }
        },
        error: (err) => {
          valoracion.likeEnProceso = false;
          console.error(`Error al ${estadoActual.usuarioHaDadoLike ? 'quitar' : 'añadir'} like:`, err);

          valoracion.usuarioHaDadoLike = estadoActual.usuarioHaDadoLike;
          valoracion.likesCount = estadoActual.likesCount;

          this.showToast('Error al actualizar like');
        }
      });
  }
}
