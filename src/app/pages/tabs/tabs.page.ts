import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  isIos: boolean;

  constructor(public platform: Platform, private utils: UtilsService) {
    this.isIos = this.platform.is('ios');
    console.log('platform ios ?', this.isIos);
  }
}
