import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AppUser, UserStatus } from 'src/app/models/models';
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
})
export class RegisterPage implements OnInit {
  isTermsChecked = false;

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
    private translate: TranslateService,
    private authSvc: AuthService,
    private utils: UtilsService,
    private navCtrl: NavController,
    private userSvc: UserService,
    private router: Router
  ) {
    this.userInfo = this.userSvc.getEmptyUser();
  }

  ngOnInit() {}

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
    if (this.userInfo.phoneNumber !== '') {
      this.errors['phoneNumber'] = !this.utils.validatePhone(
        this.userInfo!.phoneNumber
      );
    } else {
      this.errors['phoneNumber'] = false;
    }
    let errorExists = false;
    for (const key in this.errors) {
      errorExists = errorExists || this.errors[key];
    }
    if (!errorExists) {
      this.register();
    }
  }

  async register() {
    this.utils.showLoader();

    const user = await this.authSvc.register(this.userInfo, this.password);
    console.log(
      '🚀 ~ file: login.page.ts:42 ~ LoginPage ~ register ~ user',
      user
    );
    //localStorage.setItem('isLoggedIn', 'true');
    this.utils.hideLoader();

    if (user) {
      // auth statechanged is intercepted and go to tabs automatically
    } else {
      this.utils.swalError(this.translate.instant('REGISTER_FAILED'));
    }
  }

  gotoLegal() {
    this.navCtrl.navigateForward('/cgu');
  }
}
