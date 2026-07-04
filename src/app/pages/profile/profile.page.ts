import { Component, OnInit } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { AppUser, ShowHelper } from 'src/app/models/models';
import { AuthService } from 'src/app/services/auth.service';
import { HelperComponent } from 'src/app/components/helper/helper.component';
import { environment } from 'src/environments/environment';

import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
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
import { Subscription } from 'rxjs';
import { MediaService } from 'src/app/services/media.service';
import { NotificationService } from 'src/app/services/notification.service';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: false
})
export class ProfilePage implements OnInit {
  originalEmail: string | undefined;
  academies = '';
  user!: AppUser;
  avatarPath = '';
  avatarChangedURL = '';
  defaultAvatar = environment.DEFAULT_AVATAR;
  userSubscription: Subscription | undefined;
  readonly weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  custodyDays: boolean[] = new Array(14).fill(false);
  pendingAvatarPreview: string | undefined;
  private avatarConfirmResolver?: (confirmed: boolean) => void;

  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) =>
    (el as HTMLIonInputElement).getInputElement();
  readonly phoneMask: MaskitoOptions = {
    mask: [
      /\d/,
      /\d/,
      ' ',
      /\d/,
      /\d/,
      ' ',
      /\d/,
      /\d/,
      ' ',
      /\d/,
      /\d/,
      ' ',
      /\d/,
      /\d/,
    ],
  };

  constructor(
    public actionSheetController: ActionSheetController,
    public storage: Storage,
    private authSvc: AuthService,
    public router: Router,
    public userSvc: UserService,
    private utils: UtilsService,
    private logger: LoggerService,
    private mediaSvc: MediaService,
    private notificationsSvc: NotificationService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    this.user = this.userSvc.getEmptyUser();
    this.userSubscription = this.userSvc.appUserInfoObs$.subscribe((user) => {
      this.user = user;
      this.getAcademies();
      this.originalEmail = this.user.email;
      if (user.custody_schedule?.length === 14) {
        this.custodyDays = [...user.custody_schedule];
      }
      console.log('user subscription profile page', user);
    });
    //this.user! = Object.assign({}, this.userSvc.userInfo);

    if (this.userSvc.userInfo?.firstConnexion) {
      const { value } = await Preferences.get({ key: ShowHelper.PROFILE });
      if (!value) {
        const modal = await this.modalCtrl.create({
          component: HelperComponent,
          componentProps: { showHelper: ShowHelper.PROFILE },
        });
        modal.present();
        await Preferences.set({ key: ShowHelper.PROFILE, value: 'SHOWN' });
      }
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }

  async resetPw() {
    const email = await this.utils.promptEmail({
      title: 'Entrez votre email',
      placeholder: 'Entrez votre email',
    });
    if (email) {
      this.authSvc
        .resetPw(email)
        .then(() => {
          console.log('Un email');
          this.utils.showToastSuccess(
            'Un email vous a été envoyé pour réinitialiser votre mot de passe'
          );
        })
        .catch((err: any) => {
          this.utils.showFirebaseError(err);
        });
    }
  }

  toggleCustodyDay(index: number) {
    this.custodyDays[index] = !this.custodyDays[index];
  }

  async save() {
    this.logger.logDebug('save');
    const userFirstName = this.user.firstname || '';
    const userLasttName = this.user.lastname || '';
    if (userFirstName.length < 2 || userLasttName.length < 2) {
      this.utils.showToastError('Nom et prénom sont requis');
      return;
    }
    if (this.user.phoneNumber !== '') {
      if (!this.utils.validatePhone(this.user.phoneNumber)) {
        this.utils.showToastError(`Le téléphone est incorrect`);
        return;
      }

      let chiffresTrouves = this.user.phoneNumber?.match(/[0-9]/g);
      if (chiffresTrouves) {
        let chaineChiffres = chiffresTrouves.join('');
        this.user.phoneNumber = chaineChiffres;
      } else {
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

    console.log('Update email');
    if (this.user.email !== this.originalEmail) {
      if (!this.utils.validateEmail(this.user.email!)) {
        this.utils.showToastError("L'email n'est pas correct");
      } else {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        const newEmail = this.user!.email!.trim();
        console.log('Update email');
        if (firebaseUser) {
          updateEmail(firebaseUser, newEmail)
            .then(async (res) => {
              this.userSvc
                .updateUser(Object.assign({}, this.user))
                .then(() => {
                  this.utils.showToastSuccess(
                    'Les données ont été sauvegardées'
                  );
                })
                .catch((err) => {
                  this.user.email = this.originalEmail;
                  this.utils.showToastError(err);
                });
            })
            .catch((err: any) => {
              this.user.email = this.originalEmail;
              this.utils.showFirebaseError(err);
            });
        }
      }
    } else {
      if (this.user.with_kids) {
        this.user.custody_schedule = [...this.custodyDays];
      }
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
    const user_id = this.user.uid;
    const filename = 'avatar_' + user_id + '.jpg';
    const { filepath } = await this.mediaSvc.takePhoto({
      firebasePath: environment.firebase_avatar_storage_path,
      filename,
      source: CameraSource.Photos,
      allowEditing: false,
      confirmBeforeUpload: (previewDataUrl) =>
        this.confirmAvatarPreview(previewDataUrl),
    });

    if (filepath) {
      this.user.avatarPath = filepath;
      this.userSvc.updateUser(Object.assign({}, this.user));
      this.avatarPath = filepath;
    }
  }

  private confirmAvatarPreview(previewDataUrl: string): Promise<boolean> {
    this.pendingAvatarPreview = previewDataUrl;
    return new Promise<boolean>((resolve) => {
      this.avatarConfirmResolver = resolve;
    });
  }

  validateAvatarPreview() {
    this.pendingAvatarPreview = undefined;
    this.avatarConfirmResolver?.(true);
  }

  cancelAvatarPreview() {
    this.pendingAvatarPreview = undefined;
    this.avatarConfirmResolver?.(false);
  }

  logout() {
    this.notificationsSvc.deleteToken(this.userSvc.userInfo!.uid);
    this.authSvc.logout();
  }

  getAcademies() {
    switch (this.user?.geo_zone) {
      case 'zone_A':
        this.academies =
          'Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon et Poitiers.';
        break;
      case 'zone_B':
        this.academies =
          'Aix-Marseille, Amiens, Caen, Lille, Nancy-Metz, Nantes, Nice, Orléans-Tours, Reims, Rennes, Rouen et Strasbourg.';
        break;
      case 'zone_C':
        this.academies = 'Créteil, Montpellier, Paris, Toulouse et Versailles.';
        break;
    }
  }
}
