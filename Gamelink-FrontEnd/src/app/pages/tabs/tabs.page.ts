import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  gameControllerOutline,
  starOutline,
  heartOutline,
  personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    RouterModule
  ]
})
export class TabsPage {
  constructor() {
    addIcons({
      'game-controller-outline': gameControllerOutline,
      'star-outline': starOutline,
      'heart-outline': heartOutline,
      'person-outline': personOutline
    });
  }
}
