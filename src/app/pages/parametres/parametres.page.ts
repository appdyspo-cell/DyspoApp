import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AppSettings, AppUser, UserStatus } from 'src/app/models/models';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';
import { EmailComposer } from 'capacitor-email-composer';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.page.html',
  styleUrls: ['./parametres.page.scss'],
})
export class ParametresPage implements OnInit {
  darkmode: boolean = false;
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
    rangeDistance: 100,
  };
  settingsBackup: AppSettings | undefined;
  avatar: string | undefined = '';

  emptyUser: AppUser = {
    email: '',
    id: '',
    firstname: '',
    lastname: '',
    gender: 'M',
    phoneNumber: '',
    avatarPath: environment.DEFAULT_AVATAR,
    firstConnexion: true,
    last_connexion_ms: 0,
    status: UserStatus.ACTIVE,
    appSettings: {
      receiveEmail: false,
      receiveNotification: true,
      friendInvitation: true,
      actualiteDyspo: true,
      rangeDistance: 100,
    },
    tagline: '',
  };
  constructor(
    public route: Router,
    public alertController: AlertController,
    private common: UtilsService,
    private navCtrl: NavController,
    private authSvc: AuthService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    console.log('ngOnInit Parametres');
    if (!localStorage.getItem('darkmode')) {
      this.darkmode = false;
    } else {
      this.darkmode = true;
    }
    this.loadInfos();
  }

  toggleDarkMode(ev: any) {
    console.log('toggle');
    if (ev.detail.checked) {
      this.darkmode = true;
      document.body.classList.toggle('dark', true);
      localStorage.setItem('darkmode', 'true');
    } else {
      this.darkmode = false;
      document.body.classList.toggle('dark', false);
      localStorage.removeItem('darkmode');
    }
  }

  ionViewWillEnter() {
    this.loadInfos();
  }

  ngOnDestroy() {
    console.log('ngOnDestroy Parametres');
  }

  loadInfos() {
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
      if (this.userSvc.userInfo?.id) {
        this.userSvc.updateUser(
          this.userSvc.userInfo?.id,
          Object.assign({}, this.userInfo)
        );
      }

      if (
        this.settingsBackup?.rangeDistance !== this.appSettings?.rangeDistance
      ) {
        //this.gameSvc.onAppSettingsChanged(this.appSettings);
      }
    }
  }

  goToPage(page: string) {
    this.route.navigate([page]);
  }

  gotoFunctions() {}

  logout() {
    this.saveFilters = false;
    //Non car ça declenche updateMyFilters() et donc getMatchProfiles()

    this.authSvc.logout();
  }

  async deleteAccount() {
    console.log('del');
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
    await EmailComposer.open({ to: [environment.dyspo_email] });
  }

  openBlockedUsers() {
    //console.log('Open');
    this.navCtrl.navigateForward('banned-users');
  }
}
