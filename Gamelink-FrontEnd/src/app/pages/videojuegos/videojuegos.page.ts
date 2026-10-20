import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  LoadingController,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';

import { Videojuego, VideojuegosService } from '../../services/videojuegos.service';
import { FavoritosService } from '../../services/favoritos.service';
import { ValoracionesService } from '../../services/valoraciones.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  searchOutline, filterOutline, starOutline, star,
  heartOutline, heart, ellipsisVertical, close, add, trashOutline
} from 'ionicons/icons';

import { AgregarVideojuegoComponent } from '../../agregar-videojuego/agregar-videojuego.component';
import {IonicModule} from "@ionic/angular";

@Component({
  selector: 'app-videojuegos',
  templateUrl: './videojuegos.page.html',
  styleUrls: ['./videojuegos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class VideojuegosPage implements OnInit {
  videojuegos: Videojuego[] = [];
  allVideojuegos: Videojuego[] = [];
  temas: string[] = [];

  isLoading = false;
  noResults = false;
  isFirstLoad = true;

  currentPage = 1;
  totalPages = 0;
  limit = 10;

  searchTerm = '';
  selectedTema = '';
  selectedRating = 0;
  showFilters = false;

  favorites: Record<string, boolean> = {};

  constructor(
    private videojuegosService: VideojuegosService,
    private favoritosService: FavoritosService,
    private valoracionesService: ValoracionesService,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'search-outline': searchOutline,
      'filter-outline': filterOutline,
      'star-outline': starOutline,
      'star': star,
      'heart-outline': heartOutline,
      'heart': heart,
      'ellipsis-vertical': ellipsisVertical,
      'close': close,
      'add': add,
      'trash-outline': trashOutline
    });
  }

  ngOnInit() {
    this.loadTemas();
  }

  ionViewWillEnter() {
    if (this.authService.isAuthenticated()) {
      this.favoritosService.clearCache();
      this.favoritosService.loadFavoritos().subscribe({
        next: () => this.loadVideojuegos(true),
        error: () => this.loadVideojuegos(true)
      });
    } else {
      this.loadVideojuegos(true);
    }
  }

  async loadVideojuegos(reset = false) {
    if (reset) {
      this.currentPage = 1;
      this.videojuegos = [];
      this.allVideojuegos = [];
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Cargando videojuegos...'
    });
    await loading.present();

    const params = {
      page: this.currentPage,
      limit: this.limit,
      ordenarPor: 'rating',
      orden: 'desc'
    };

    this.videojuegosService.getVideojuegos(params).subscribe({
      next: async (response) => {
        await loading.dismiss();
        this.isLoading = false;

        this.allVideojuegos = [...this.allVideojuegos, ...response.data];
        this.totalPages = response.meta.pages;

        this.filtrarVideojuegos();

        if (this.authService.isAuthenticated()) {
          this.favoritosService.loadFavoritos().subscribe({
            next: favoritos => this.updateFavoritesDisplay(favoritos),
            error: error => console.error('videojuegos: Error cargando favoritos tras videojuegos:', error)
          });
        }
      },
      error: async (error) => {
        await loading.dismiss();
        this.isLoading = false;
        console.error('videojuegos: Error cargando videojuegos:', error);
        this.showToast('Error al cargar videojuegos');
      }
    });
  }

  private updateFavoritesDisplay(favoritos: string[]) {
    const newFavorites: Record<string, boolean> = {};

    this.videojuegos.forEach(videojuego => {
      const gameId = videojuego._id;
      const isFavorite = favoritos.includes(gameId);
      newFavorites[gameId] = isFavorite;
    });

    this.favorites = newFavorites;
    this.cdr.detectChanges();
    this.filtrarVideojuegos();
  }

  isFavorite(gameId: string): boolean {
    return !!this.favorites[gameId];
  }

  toggleFavorite(videojuego: Videojuego, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }

    const gameId = videojuego._id;
    const currentlyFavorite = this.isFavorite(gameId);

    // Actualiza la UI de forma optimista
    this.favorites[gameId] = !currentlyFavorite;
    this.cdr.detectChanges();

    const onError = () => {
      // Revierte el cambio en la UI si falla
      this.favorites[gameId] = currentlyFavorite;
      this.cdr.detectChanges();
    };

    if (currentlyFavorite) {
      this.favoritosService.removeFromFavorites(gameId).subscribe({
        next: () => this.showToast('Eliminado de favoritos'),
        error: error => {
          console.error('Error removing from favorites:', error);
          this.showToast('Error al eliminar de favoritos');
          onError();
        }
      });
    } else {
      this.favoritosService.addToFavorites(gameId).subscribe({
        next: () => this.showToast('Añadido a favoritos'),
        error: error => {
          console.error('Error adding to favorites:', error);
          this.showToast('Error al añadir a favoritos');
          onError();
        }
      });
    }
  }

  async openAddGameModal() {
    const modal = await this.modalController.create({
      component: AgregarVideojuegoComponent,
      cssClass: 'add-game-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.added) {
      this.loadVideojuegos(true);
      this.showToast('Videojuego añadido correctamente');
    }
  }

  loadTemas() {
    this.videojuegosService.getTemas().subscribe({
      next: temas => this.temas = temas,
      error: error => console.error('Error loading categories:', error)
    });
  }

  loadMore(event: any) {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVideojuegos(false);
    }

    setTimeout(() => {
      (event as InfiniteScrollCustomEvent).target.complete();
      if (this.currentPage >= this.totalPages) {
        (event as InfiniteScrollCustomEvent).target.disabled = true;
      }
    }, 500);
  }

  private searchTimeout: any;

  searchGames() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => this.filtrarVideojuegos(), 200);
  }

  filtrarVideojuegos() {
    const searchTerm = this.searchTerm.trim().toLowerCase();
    this.videojuegos = this.allVideojuegos.filter(videojuego => {
      const matchesSearch = !searchTerm || videojuego.nombre?.toLowerCase().includes(searchTerm) ||
        videojuego.descripcion?.toLowerCase().includes(searchTerm) ||
        videojuego.tema?.toLowerCase().includes(searchTerm);
      const matchesTema = !this.selectedTema || videojuego.tema === this.selectedTema;
      return matchesSearch && matchesTema;
    });
    this.noResults = this.videojuegos.length === 0;
  }

  applyFilters() {
    this.showFilters = false;
    this.filtrarVideojuegos();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filtrarVideojuegos();
  }

  clearFilters() {
    this.selectedTema = '';
    this.filtrarVideojuegos();
  }

  isGameOwner(videojuego: Videojuego): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    let gameOwnerId: string | undefined;

    if (videojuego.usuario_id) {
      if (typeof videojuego.usuario_id === 'object') {
        gameOwnerId = (videojuego.usuario_id as any)._id || (videojuego.usuario_id as any).id;
      } else {
        gameOwnerId = videojuego.usuario_id as string;
      }
    } else if (videojuego.usuario) {
      gameOwnerId = (videojuego.usuario as any)._id || (videojuego.usuario as any).id;
    }

    console.log('Current user ID:', currentUser.id);
    console.log('Game owner ID:', gameOwnerId);

    return currentUser.id === gameOwnerId;
  }


  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private async showLoginPrompt() {
    const alert = await this.alertController.create({
      header: 'Inicia sesión',
      message: 'Necesitas iniciar sesión para realizar esta acción',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Iniciar sesión',
          handler: () => this.router.navigate(['/iniciar-sesion'])
        }
      ]
    });
    await alert.present();
  }

  async deleteGame(videojuego: Videojuego, event: Event) {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar "${videojuego.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.videojuegosService.deleteVideojuego(videojuego._id).subscribe({
              next: () => {
                this.videojuegos = this.videojuegos.filter(g => g._id !== videojuego._id);
                this.allVideojuegos = this.allVideojuegos.filter(g => g._id !== videojuego._id);
                this.showToast('Videojuego eliminado correctamente');
              },
              error: error => {
                console.error('Error al eliminar videojuego:', error);
                this.showToast('Error al eliminar videojuego: ' + (error.message || 'Error desconocido'));
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  getUserNick(videojuego: Videojuego): string {
    if (videojuego.usuario_id && typeof videojuego.usuario_id === 'object') {
      return (videojuego.usuario_id as any).nick || 'Usuario';
    }
    if (videojuego.usuario) {
      return videojuego.usuario.nick || 'Usuario';
    }
    return 'Usuario';
  }
}
