import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ChatMessage } from 'src/app/models/models';
import {
  PanZoomConfig,
  PanZoomAPI,
  PanZoomModel,
  PanZoomConfigOptions,
} from 'ngx-panzoom';

@Component({
  selector: 'app-dyspo-viewer',
  templateUrl: './dyspo-viewer.component.html',
  styleUrls: ['./dyspo-viewer.component.scss'],
})
export class DyspoViewerComponent implements OnInit {
  image!: string;
  url: any;
  panZoomConfig: PanZoomConfig;

  constructor(private modalCtrl: ModalController) {
    this.panZoomConfig = new PanZoomConfig({
      keepInBounds: true,
      scalePerZoomLevel: 3,
      zoomLevels: 5,
      zoomOnDoubleClick: true,
    });
  }

  ngOnInit() {
    this.url = this.image;
  }

  close() {
    console.log('close');
    this.modalCtrl.dismiss();
  }
}
