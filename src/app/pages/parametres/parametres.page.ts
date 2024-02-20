import { Component, OnInit, ViewChild } from '@angular/core';

import { Router } from '@angular/router';
import {
  AlertController,
  IonModal,
  ModalController,
  NavController,
} from '@ionic/angular';

import { Subscription } from 'rxjs';
import {
  AppSettings,
  AppUser,
  UserDyspoStatus,
  UserStatus,
} from 'src/app/models/models';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';
import { EmailComposer } from 'capacitor-email-composer';
import { LoggerService } from 'src/app/services/logger.service';

import { UserCredential } from '@angular/fire/auth';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.page.html',
  styleUrls: ['./parametres.page.scss'],
})
export class ParametresPage implements OnInit {
  dyspoStatus = UserDyspoStatus;

  presentingElement: any;

  ionRangeMin = 10;
  ionRangeMax = 1000;
  ionRangeStep = 10;

  clicked: boolean = false;
  rangeSingle = 10;
  rangeDualKnobs = { lower: 18, upper: 100 };
  click: any;
  pushMessage = false;
  pushNewMatch = false;
  pushNewsletter = false;
  emailNewMatch = false;
  incognito = false;
  email = '';
  saveFilters = true;
  subscribtionyouplus = false;
  credits = 0;
  userSubscription: Subscription | undefined;
  userFB: any;
  uid: string | undefined;
  settingsCollectionPath: string | undefined;
  settingsCollectionRef: any;
  afs: any;
  userInfo: any;

  appSettings: AppSettings | undefined = {
    receiveEmail: true,
    receiveNotification: true,
    friendInvitation: true,
    actualiteDyspo: true,
    eventInvitation: true,
    shareAgenda: true,
  };
  settingsBackup: AppSettings | undefined;
  avatar: string | undefined = '';

  emptyUser: AppUser = {
    email: '',
    uid: '',
    firstname: '',
    lastname: '',
    gender: 'M',
    phoneNumber: '',
    avatarPath: environment.DEFAULT_AVATAR,
    firstConnexion: true,
    last_connexion_ms: 0,
    status: UserStatus.ACTIVE,
    dyspoStatus: UserDyspoStatus.DYSPO,
    appSettings: {
      receiveEmail: false,
      receiveNotification: true,
      friendInvitation: true,
      actualiteDyspo: true,
      eventInvitation: true,
      shareAgenda: true,
    },
    tagline: '',
  };
  constructor(
    public route: Router,
    public alertController: AlertController,
    private common: UtilsService,
    private navCtrl: NavController,
    private authSvc: AuthService,
    private userSvc: UserService,
    private logger: LoggerService,
    private notificationsSvc: NotificationService,
    private modalCtrl: ModalController,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page');
    this.logger.logDebug('ngOnInit Parametres');

    this.loadInfos();
  }

  ionViewWillEnter() {
    this.loadInfos();
  }

  ngOnDestroy() {
    this.logger.logDebug('ngOnDestroy Parametres');
  }

  loadInfos() {
    console.log('loadINFOS');
    this.userInfo = Object.assign({}, this.userSvc.userInfo);
    //Real time appSettings changed
    this.appSettings = this.userSvc.userInfo?.appSettings;
    this.avatar = this.userSvc.userInfo?.avatarPath;
    this.settingsBackup = this.appSettings
      ? JSON.parse(JSON.stringify(this.appSettings))
      : undefined; //Clone event to check for modifications before leaving
  }

  goBack() {
    this.navCtrl.pop();
  }

  ionViewWillLeave() {
    if (
      JSON.stringify(this.appSettings) !== JSON.stringify(this.settingsBackup)
    ) {
      if (this.userSvc.userInfo?.uid) {
        this.userSvc.updateUser(Object.assign({}, this.userInfo));
      }
    }
  }

  goToPage(page: string) {
    this.route.navigate([page]);
  }

  gotoFunctions() {}

  logout() {
    this.saveFilters = false;
    this.notificationsSvc.deleteToken(this.userSvc.userInfo!.uid);
    this.authSvc.logout();
  }

  async deleteAccount() {
    this.logger.logDebug('del');
    this.saveFilters = false;
    const alert = await this.alertController.create({
      //cssClass: 'my-custom-class',
      header: 'Suppression',
      message: 'Voulez-vous vraiment supprimer votre compte ?',
      buttons: [
        {
          text: 'NON',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {},
        },
        {
          text: 'OUI',
          handler: () => {
            this.authSvc.removeAccount();
          },
        },
      ],
    });

    await alert.present();
  }

  async openMail() {
    const canOpen = await EmailComposer.hasAccount();
    if (canOpen.hasAccount) {
      await EmailComposer.open({ to: [environment.dyspo_email] });
    } else {
      this.utils.showToastError(
        'Vous devez configurer une messagerie sur cet appareil'
      );
    }
  }

  openBlockedUsers() {
    //this.logger.logDebug('Open');
    this.navCtrl.navigateForward('banned-users');
  }
}
