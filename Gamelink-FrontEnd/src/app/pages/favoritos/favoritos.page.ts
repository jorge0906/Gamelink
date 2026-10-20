import { Component, OnInit } from '@angular/core';
import { FavoritosService } from "../../services/favoritos.service";
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  LoadingController,
  ToastController
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { star, heart, heartOutline, gameControllerOutline, close, chevronForward } from "ionicons/icons";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonText,
    IonIcon,
    IonSpinner,
    RouterLink,
  ]
})
export class FavoritosPage implements OnInit {
  favoritosConDatos: any[] = [];
  isLoading = false;

  constructor(
    private favoritosService: FavoritosService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      'heart': heart,
      'heart-outline': heartOutline,
      'star': star,
      'game-controller-outline': gameControllerOutline,
      'chevron-forward': chevronForward,
      'close': close
    });
  }

  ngOnInit() {
    this.cargarFavoritos();
  }

  ionViewWillEnter() {
    console.log('Favoritos: ionViewWillEnter - Recargando favoritos');
    this.cargarFavoritos();
  }

  async cargarFavoritos() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Cargando favoritos...'
    });
    await loading.present();

    this.favoritosService.obtenerFavoritosUsuario().subscribe({
      next: (res) => {
        console.log('Favoritos cargados:', res);
        this.favoritosConDatos = res.filter(f => f.videojuego);
        this.isLoading = false;
        loading.dismiss();
      },
      error: (err) => {
        console.error('Error al obtener favoritos:', err);
        this.isLoading = false;
        loading.dismiss();
        this.presentToast('Error al cargar favoritos');
      }
    });
  }



  eliminarFavorito(videojuegoId: string) {
    // Mostrar alerta de confirmación
    this.alertController.create({
      header: '¿Eliminar de favoritos?',
      message: '¿Estás seguro de que quieres eliminar este videojuego de tus favoritos?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Eliminar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            // Llamar al servicio para eliminar el favorito
            this.favoritosService.removeFromFavorites(videojuegoId).subscribe({
              next: () => {
                console.log('Favorito eliminado:', videojuegoId);
                // Actualizar la lista local sin necesidad de recargar
                this.favoritosConDatos = this.favoritosConDatos.filter(
                  f => f.videojuego._id !== videojuegoId
                );

                // Verificar si ya no hay favoritos para mostrar estado vacío
                if (this.favoritosConDatos.length === 0) {
                  // Mostrar mensaje de no hay favoritos
                }

                this.presentToast('Videojuego eliminado de favoritos');
              },
              error: (err) => {
                console.error('Error al eliminar favorito:', err);
                this.presentToast('No se pudo eliminar de favoritos');
              }
            });
          }
        }
      ]
    }).then(alert => alert.present());
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      cssClass: 'custom-toast',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
