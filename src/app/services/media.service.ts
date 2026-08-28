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
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface TakePhotoOptions {
  filename: string;
  source?: CameraSource;
  allowEditing?: boolean;
  firebasePath: string;
  noUpload?: boolean;
  /** Appelé avec un aperçu local (data URL) avant l'upload Firebase. Si la promesse résout `false`, l'upload est annulé. */
  confirmBeforeUpload?: (previewDataUrl: string) => Promise<boolean>;
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
        const dataUrl = `data:image/jpeg;base64,${captureDataUrl}`;

        if (opt.noUpload) {
          return { filepath: dataUrl };
        }

        if (opt.confirmBeforeUpload) {
          const confirmed = await opt.confirmBeforeUpload(dataUrl);
          if (!confirmed) {
            return { filepath: undefined };
          }
        }

        this.utils.showLoader();
        const path = `${opt.firebasePath}${opt.filename}`;
        const fileRef = ref(this.storage, path);

        // contentType explicite requis pour que la règle Storage (image/.*) passe
        await uploadString(fileRef, captureDataUrl, StringFormat.BASE64, {
          contentType: 'image/jpeg',
        });
        const fpath = await getDownloadURL(fileRef);
        this.utils.hideLoader();
        return { filepath: fpath };
      } else {
        return { filepath: undefined };
      }
    } catch (error) {
      console.error('Pas de photo :', error);
      this.utils.hideLoader();
      this.utils.showToastError("Impossible de charger l'image");
      return { filepath: undefined };
    }
  }

  async saveToGallery(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const filename = `dyspo_${Date.now()}.jpg`;
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Enregistrer la photo',
      files: [uri],
    });
  }

}
