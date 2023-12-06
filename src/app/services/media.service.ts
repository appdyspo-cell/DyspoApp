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
                const result = await this.takePhoto(options);
                resolve(result);
              } catch (e: any) {
                this.utils.showAlert(e);
                console.error(e);
                reject(e);
              }
            },
          },
          {
            text: 'Annuler',
            role: 'cancel',
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

      const result = await Camera.getPhoto(options);
      const captureDataUrl = result.base64String;

      if (captureDataUrl) {
        if (opt.noUpload) {
          return { filepath: result.dataUrl };
        }
        const path = `${opt.firebasePath}${opt.filename}`;
        const fileRef = ref(this.storage, path);

        await uploadString(fileRef, captureDataUrl, StringFormat.BASE64);
        const fpath = await getDownloadURL(fileRef);

        return { filepath: fpath };
      } else {
        return { filepath: undefined };
      }
    } catch (error) {
      // Gérer les erreurs ici, vous pouvez soit les logger ou les gérer en conséquence
      console.error('Erreur lors de la capture de la photo :', error);
      this.utils.showToastError("Une erreur s'est produite");
      throw error; // Vous pouvez choisir de relancer l'erreur ou de la gérer différemment selon votre logique
    }
  }
}
