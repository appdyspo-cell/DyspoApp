import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, NavController } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { LoggerService } from 'src/app/services/logger.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  userInfo: any = { email: '', password: '123456' };

  langArr = [];
  lang = 'en';
  settings: any = {};
  disablePage = false;
  showBiometricLogin = true;

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private utils: UtilsService,
    public translate: TranslateService,
    private auth: Auth,
    private navController: NavController,
    private logger: LoggerService,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  ionViewDidEnter() {
    this.menuCtrl.enable(false);
  }

  signup() {
    this.router.navigateByUrl('/register');
  }

  submitLoginForm() {
    if (this.userInfo.email && this.userInfo.password) {
      const email = this.userInfo.email.toLowerCase().trim();
      this.login(email, this.userInfo.password, false);
    } else {
      this.utils.showToastError('Veuillez entrer vos identifiants');
    }
  }

  async login(email: string, password: string, fromBiometric = false) {
    this.utils.showLoader();
    this.logger.logDebug('Login with ', email);
    this.logger.logDebug('Login with ', password);

    try {
      const credentials = await this.authService.login(email, password);
      // if (!fromBiometric && Capacitor.getPlatform() !== 'web') {
      //   NativeBiometric.deleteCredentials({
      //     server: environment.BIOMETRIC_KEY,
      //   });
      //   // Save user's credentials
      //   NativeBiometric.setCredentials({
      //     username: email,
      //     password: password,
      //     server: environment.BIOMETRIC_KEY,
      //   }).then(() => {
      //     console.log('Credentials set');
      //   });
      // }

      this.logger.logDebug('user logged');
      this.utils.hideLoader();
      this.navController.navigateRoot('/tabs');
      this.logger.logDebug(credentials);
      this.utils.hideLoader();
      return credentials;
    } catch (error: any) {
      this.utils.hideLoader();
      console.log('Error login');
      this.utils.showFirebaseError(error);
      return null;
    }

    return null;
  }

  async forgotPassword() {
    const { value: email } = await Swal.fire({
      title: 'Mot de passe oublié',
      input: 'email',
      heightAuto: false,
      validationMessage: "L'adresse email n'est pas valide.",
      inputLabel: 'Votre adresse email',
      inputPlaceholder: 'Entrez votre email',
    });
    if (email) {
      this.authService.resetPw(email);
    }
  }

  // async biometricLogin() {
  //   const result = await NativeBiometric.isAvailable();

  //   if (!result.isAvailable) return;

  //   const isFaceID = result.biometryType == BiometryType.FACE_ID;

  //   const verified = await NativeBiometric.verifyIdentity({
  //     reason: 'Empreinte digitale / Reconnaissance faciale',
  //     title: 'Authentification',
  //     negativeButtonText: 'Annuler',
  //   })
  //     .then(() => true)
  //     .catch(() => false);

  //   const credentials = await NativeBiometric.getCredentials({
  //     server: environment.BIOMETRIC_KEY,
  //   });
  //   if (credentials) {
  //     this.login(credentials.username, credentials.password, true);
  //   }
  // }
}
