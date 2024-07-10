import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ChatMessage } from 'src/app/models/models';
import {
  Media,
  MediaAlbum,
  MediaSaveOptions,
} from '@capacitor-community/media';
import {
  PanZoomConfig,
  PanZoomAPI,
  PanZoomModel,
  PanZoomConfigOptions,
} from 'ngx-panzoom';
import { Capacitor } from '@capacitor/core';
import { UtilsService } from 'src/app/services/utils.service';
import { LoggerService } from 'src/app/services/logger.service';
import { UserService } from 'src/app/services/user.service';
import { MediaService } from 'src/app/services/media.service';

@Component({
  selector: 'app-dyspo-viewer',
  templateUrl: './dyspo-viewer.component.html',
  styleUrls: ['./dyspo-viewer.component.scss'],
})
export class DyspoViewerComponent implements OnInit {
  image!: string;
  url: any;
  panZoomConfig: PanZoomConfig;

  constructor(
    private modalCtrl: ModalController,
    private utils: UtilsService,
    private logger: LoggerService,
    private userSvc: UserService,
    private mediaSvc: MediaService
  ) {
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

  async saveToGallery() {
    try {
      this.utils.showLoader();
      await this.mediaSvc.saveToGallery(this.image);
      this.utils.hideLoader();
      this.utils.showToastSuccessBottom("L'image a été sauvegardée");
    } catch (err: any) {
      console.log(err);
      this.logger.sendError(err, 'saveToGallery', this.userSvc.userInfo?.uid!);
      this.utils.showToastError("Une erreur s'est produite");
    }
  }
}
