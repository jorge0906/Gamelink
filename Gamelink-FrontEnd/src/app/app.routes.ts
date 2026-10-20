import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'portada',
    pathMatch: 'full',
  },
  {
    path: 'portada',
    loadComponent: () => import('./pages/portada/portada.page').then(m => m.PortadaPage)
  },
  {
    path: 'iniciar-sesion',
    loadComponent: () => import('./pages/iniciar-sesion/iniciar-sesion.page').then(m => m.IniciarSesionPage)
  },
  {
    path: 'registrarse',
    loadComponent: () => import('./pages/registrarse/registrarse.page').then(m => m.RegistrarsePage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'videojuegos',
        loadComponent: () => import('./pages/videojuegos/videojuegos.page').then(m => m.VideojuegosPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'valoraciones',
        loadComponent: () => import('./pages/valoraciones/valoraciones.page').then(m => m.ValoracionesPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./pages/favoritos/favoritos.page').then(m => m.FavoritosPage),
        canActivate: [AuthGuard]
      },

      {
        path: '',
        redirectTo: '/tabs/videojuegos',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'portada'
  },

];
