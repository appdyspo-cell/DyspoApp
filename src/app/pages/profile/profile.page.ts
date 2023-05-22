import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { AppUser } from 'src/app/models/models';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import Swal from 'sweetalert2';
import { UtilsService } from 'src/app/services/utils.service';
import {
  Auth,
  User,
  authState,
  getAuth,
  updateEmail,
  user,
} from '@angular/fire/auth';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  Storage,
  StringFormat,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  uploadString,
} from '@angular/fire/storage';
import { LoggerService } from 'src/app/services/logger.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user!: AppUser;
  avatarPath = '';
  avatarChangedURL = '';
  defaultAvatar = environment.DEFAULT_AVATAR;

  constructor(
    public actionSheetController: ActionSheetController,
    public storage: Storage,
    private authSvc: AuthService,
    public router: Router,
    public userSvc: UserService,
    private utils: UtilsService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.user! = Object.assign({}, this.userSvc.userInfo);
    this.logger.logDebug(this.user);
  }

  async resetPw() {
    const { value: email } = await Swal.fire({
      title: 'Entrez votre email',
      input: 'email',
      heightAuto: false,
      validationMessage: "L'adresse email n'est pas valide.",
      inputLabel: 'Votre adresse email',
      inputPlaceholder: 'Entrez votre email',
    });
    if (email) {
      this.authSvc
        .resetPw(email)
        .then(() => {
          Swal.fire({
            text: 'Un email vous a été envoyé pour réinitialiser votre mot de passe',
            heightAuto: false,
          });
        })
        .catch((err: any) => {
          this.utils.showFirebaseError(err);
        });
    }
  }

  async save() {
    this.logger.logDebug('save');
    const userFirstName = this.user.firstname || '';
    const userLasttName = this.user.firstname || '';
    if (userFirstName.length < 2 || userLasttName.length < 2) {
      this.utils.showToastError('Nom et prénom sont requis');
      return;
    }
    if (this.user.phoneNumber !== '') {
      if (!this.utils.validatePhone(this.user.phoneNumber)) {
        this.utils.showToastError(`Le téléphone est incorrect`);
        return;
      }
    }

    //Changement de nom, prenom, avatar ? Si oui, on doit mettre a jour les chatrooms
    if (
      this.avatarChangedURL !== '' ||
      this.user.firstname !== this.userSvc.userInfo!.firstname ||
      this.user.lastname !== this.userSvc.userInfo!.lastname
    ) {
      const payload: any = {
        friendUsername:
          this.user.firstname + ' ' + this.user!.lastname!.toUpperCase(),
      };
      if (this.avatarChangedURL !== '') {
        payload.friendAvatar = this.avatarChangedURL;
      }
      //Update dependency wher user data hardcoded
      //this.chatroomSvc.updateChatroomsUserData(payload);
    }

    //Changement de mail?
    if (this.user.email !== this.userSvc.userInfo?.email) {
      if (!this.utils.validateEmail(this.user.email!)) {
        this.utils.showToastError("L'email n'est pas correct");
      } else {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          updateEmail(firebaseUser, this.user!.email!.trim())
            .then(async (res) => {
              this.userSvc
                .updateUser(Object.assign({}, this.user))
                .then(() => {
                  this.utils.showToastSuccess(
                    'Les données ont été sauvegardées'
                  );
                })
                .catch((err) => {
                  this.utils.showToastError(err);
                });
            })
            .catch((err: any) => {
              this.utils.showFirebaseError(err);
            });
        }
      }
    } else {
      this.userSvc
        .updateUser(Object.assign({}, this.user))
        .then(() => {
          this.utils.showToastSuccess('Les données ont été sauvegardées');
        })
        .catch((err) => {
          this.utils.showToastError(err);
        });
    }
  }

  async changeAvatar() {
    const actionSheet = await this.actionSheetController.create({
      header: "Sélectionner la source de l'image",
      buttons: [
        {
          text: 'Galerie',
          handler: async () => {
            try {
              this.takePhotoAvatar(CameraSource.Photos);
            } catch (e) {
              this.utils.showAlert(e);
              console.error(e);
            }
          },
        },
        {
          text: 'Prendre une photo',
          handler: async () => {
            try {
              this.takePhotoAvatar(CameraSource.Camera);
            } catch (e: any) {
              this.utils.showAlert(e);
              console.error(e);
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
  }

  async takePhotoAvatar(source: any) {
    const options = {
      quality: 50,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      //destinationType: Camera.DestinationType.DATA_URL,
      //encodingType: this.camera.EncodingType.JPEG,
      //mediaType: this.camera.MediaType.PICTURE,
      source,
      correctOrientation: true,
    };

    const result = await Camera.getPhoto(options);
    //const captureDataUrl = 'data:image/jpeg;base64,' + result.base64String;
    const captureDataUrl = result.base64String;
    this.logger.logDebug('Photo Transformed in base64 data');
    if (captureDataUrl) this.uploadAvatar(captureDataUrl);
  }

  uploadAvatar(captureAvatarUrl: string) {
    this.logger.logDebug('uploadAvatar');
    const user_id = this.user.uid;
    const fileName = 'avatar_' + user_id + '.jpg';
    const path = `avatarsStorage/${fileName}`;
    const fileRef = ref(this.storage, path);

    uploadString(fileRef, captureAvatarUrl, StringFormat.BASE64).then(() => {
      getDownloadURL(fileRef).then((fpath: any) => {
        this.user.avatarPath = fpath;
        this.userSvc.updateUser(Object.assign({}, this.user));
        this.avatarPath = fpath;
      });
    });
  }

  logout() {
    this.authSvc.logout();
  }
}
