import { Injectable } from '@angular/core';
import {
  Storage,
  StringFormat,
  getDownloadURL,
  ref,
  uploadString,
} from '@angular/fire/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UtilsService } from './utils.service';
import { ActionSheetController } from '@ionic/angular';
import { Media, MediaSaveOptions } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';
import { throwError } from 'rxjs';

export interface TakePhotoOptions {
  filename: string;
  source?: CameraSource;
  allowEditing?: boolean;
  firebasePath: string;
  noUpload?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  constructor(
    private storage: Storage,
    private utils: UtilsService,
    private actionSheetController: ActionSheetController
  ) {}

  MEDIA_ALBUM = 'Dyspo!';

  async takePhotoPrompt(
    options: TakePhotoOptions
  ): Promise<{ filepath: string | undefined }> {
    return new Promise(async (resolve, reject) => {
      const actionSheet = await this.actionSheetController.create({
        header: "Sélectionner la source de l'image",
        buttons: [
          {
            text: 'Galerie',
            handler: async () => {
              try {
                options.source = CameraSource.Photos;
                actionSheet.dismiss();
                const result = await this.takePhoto(options);

                resolve(result);
              } catch (e) {
                this.utils.showAlert(e);
                console.error(e);
                reject(e);
              }
            },
          },
          {
            text: 'Prendre une photo',
            handler: async () => {
              try {
                options.source = CameraSource.Camera;
                actionSheet.dismiss();
                const result = await this.takePhoto(options);
                resolve(result);
              } catch (e: any) {
                this.utils.showAlert(e);
                console.error(e);
                reject(e);
              }
            },
          },
        ],
      });
      await actionSheet.present();
    });
  }

  async takePhoto(
    opt: TakePhotoOptions
  ): Promise<{ filepath: string | undefined }> {
    try {
      const options = {
        quality: 50,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: opt.source,
        correctOrientation: true,
      };

      if (opt.allowEditing === false) {
        options.allowEditing = false;
      }

      const result = await Camera.getPhoto(options);
      const captureDataUrl = result.base64String;

      if (captureDataUrl) {
        if (opt.noUpload) {
          return { filepath: result.dataUrl };
        }
        this.utils.showLoader();
        const path = `${opt.firebasePath}${opt.filename}`;
        const fileRef = ref(this.storage, path);

        await uploadString(fileRef, captureDataUrl, StringFormat.BASE64);
        const fpath = await getDownloadURL(fileRef);
        this.utils.hideLoader();
        return { filepath: fpath };
      } else {
        return { filepath: undefined };
      }
    } catch (error) {
      // Gérer les erreurs ici, vous pouvez soit les logger ou les gérer en conséquence
      console.error('Pas de photo :', error);
      return { filepath: undefined };
    }
  }

  /*Gets the path where album folders and their corresponding photos are stored on the Android filesystem. 
  This can be used to identify your album by more than just its name on Android, in case there are multiple albums with the same name,
  which is possible on Android.
  Just compare the albums path to the start of the album identifier when getting albums.
  */
  ensureDyspoAlbum = async () => {
    let dyspoAlbum = await this.findDyspoAlbum();
    if (!dyspoAlbum) {
      console.log('Album not found... Create it...');
      await Media.createAlbum({ name: this.MEDIA_ALBUM });
      console.log('Album created');
      dyspoAlbum = await this.findDyspoAlbum();
      if (!dyspoAlbum) {
        throw new Error('CAN_NOT_CREATE_ALBUM');
      } else {
        console.log('Album found ', dyspoAlbum.identifier);
        return dyspoAlbum.identifier;
      }
    } else {
      console.log('Album found ', dyspoAlbum.identifier);
      return dyspoAlbum.identifier;
    }
  };

  async findDyspoAlbum() {
    const { albums } = await Media.getAlbums();

    let dyspoAlbum = undefined;
    if (Capacitor.getPlatform() === 'android') {
      const albumsPath = (await Media.getAlbumsPath()).path;
      dyspoAlbum = albums.find(
        (a) =>
          a.name === this.MEDIA_ALBUM && a.identifier.startsWith(albumsPath)
      );
    } else {
      dyspoAlbum = albums.find((a) => a.name === this.MEDIA_ALBUM);
    }

    return dyspoAlbum;
  }

  async saveToGallery(url: string) {
    let opts: MediaSaveOptions = {
      path: url,
      albumIdentifier: await this.ensureDyspoAlbum(),
    };
    console.log('Save To Media Album');

    await Media.savePhoto(opts);
  }
}
