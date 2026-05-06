import { Component, OnInit } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { NavController } from '@ionic/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { AppUser } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';

declare interface RegisterErrors {
  firstname: boolean;
  lastname: boolean;
  email: boolean;
  password: boolean;
  phoneNumber: boolean;

  cgu: boolean;
}

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    standalone: false
})
export class RegisterPage implements OnInit {
  isTermsChecked = false;
  isPrivacyChecked = false;
  academies = '';

  readonly weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  custodyDays: boolean[] = new Array(14).fill(false);
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

  errors: { [key: string]: boolean } = {
    firstname: false,
    lastname: false,
    email: false,
    password: false,
    phoneNumber: false,
    cgu: false,
  };
  userInfo: AppUser;
  password = '';

  constructor(
    private authSvc: AuthService,
    private utils: UtilsService,
    private navCtrl: NavController,
    private userSvc: UserService,
    private agendaSvc: AgendaService
  ) {
    this.userInfo = this.userSvc.getEmptyUser();
    this.getAcademies();
  }

  ngOnInit() {}

  getAcademies() {
    switch (this.userInfo.geo_zone) {
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

  checkBeforeRegister() {
    if (this.userInfo?.lastname && this.userInfo?.lastname?.length < 3) {
      return;
    }

    this.errors['lastname'] =
      this.userInfo.lastname! === '' || this.userInfo.lastname!.length < 3;
    this.errors['firstname'] =
      this.userInfo.firstname! === '' || this.userInfo.firstname!.length < 3;
    this.errors['email'] = !this.utils.validateEmail(this.userInfo.email!);
    this.errors['password'] = this.password === '' || this.password.length < 6;
    this.errors['cgu'] = !this.isTermsChecked;
    this.errors['privacy'] = !this.isPrivacyChecked;
    //if (this.userInfo.phoneNumber !== '') {
    this.errors['phoneNumber'] = !this.utils.validatePhone(
      this.userInfo!.phoneNumber
    );
    // }
    // else {
    //   this.errors['phoneNumber'] = false;
    // }
    let errorExists = false;
    for (const key in this.errors) {
      errorExists = errorExists || this.errors[key];
    }
    if (!errorExists) {
      console.log('will register user');
      this.register();
    }
  }

  toggleCustodyDay(index: number) {
    this.custodyDays[index] = !this.custodyDays[index];
  }

  async register() {
    this.utils.showLoader();

    const chiffresTrouves = this.userInfo.phoneNumber?.match(/[0-9]/g);
    if (chiffresTrouves) {
      this.userInfo.phoneNumber = chiffresTrouves.join('');
      if (this.userInfo.with_kids) {
        this.userInfo.custody_schedule = [...this.custodyDays];
      }
      const credentials = await this.authSvc.register(this.userInfo, this.password);
      if (credentials && this.userInfo.with_kids) {
        await this.agendaSvc.applyCustodySchedule(
          credentials.user.uid,
          this.custodyDays
        );
      }
      this.utils.hideLoader();
    } else {
      this.utils.hideLoader();
      this.utils.showToastError('Téléphone invalide');
    }
  }

  _gotoLegal() {
    this.navCtrl.navigateForward('/cgu');
  }

  async gotoLegal() {
    await Browser.open({
      url: environment.cgu_url,
    });
  }

  async gotoPrivacy() {
    await Browser.open({
      url: environment.privacy_url,
    });
  }
}
