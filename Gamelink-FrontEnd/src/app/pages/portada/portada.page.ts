import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonButton, IonContent, IonIcon} from '@ionic/angular/standalone';
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-portada',
  templateUrl: './portada.page.html',
  styleUrls: ['./portada.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon, IonButton, RouterLink]
})
export class PortadaPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  goToLogin() {
    this.router.navigate(['/iniciar-sesion']);
  }

  goToRegister() {
    this.router.navigate(['/registrarse']);
  }
}
