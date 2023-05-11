import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, NavController } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { signInWithEmailAndPassword, Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

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
  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private utils: UtilsService,
    public translate: TranslateService,
    private auth: Auth,
    private navController: NavController,
    private firestore: Firestore
  ) {
    // if (Capacitor.isNativePlatform) {
    //   const app = initializeApp(environment.firebase);
    //   initializeAuth(app, {
    //     persistence: indexedDBLocalPersistence
    //   });
    // }
  }

  ngOnInit() {}

  ionViewDidEnter() {
    this.menuCtrl.enable(false);
  }

  signup() {
    this.router.navigateByUrl('/register');
  }
  async login() {
    if (this.userInfo.email && this.userInfo.password) {
      const email = this.userInfo.email.toLowerCase().trim();
      this.utils.showLoader();
      console.log('Login with ', email);
      console.log('Login with ', this.userInfo.password);

      try {
        const credentials = await signInWithEmailAndPassword(
          this.auth,
          email,
          this.userInfo.password
        ).then((user) => {
          console.log('user logged');
          console.log(user);
          this.utils.hideLoader();
          this.navController.navigateRoot('/tabs');
        });
        console.log(credentials);
        this.utils.hideLoader();
        return credentials;
      } catch (error: any) {
        this.utils.hideLoader();
        let firebaseError = this.utils.getFirebaseError(error['code']);
        let mess = firebaseError ? firebaseError : error.message;
        this.utils.showToastError(mess);
        this.utils.hideLoader();
        return null;
      }

      // this.afAuth
      //   .signInWithEmailAndPassword(email, this.userInfo.password)
      //   .then(
      //     () => {
      //       this.utils.hideLoader();
      //       //localStorage.setItem('isLoggedIn', 'true');
      //     },
      //     (error) => {
      //       let mess = error.message;
      //       if (environment.errors[error.code]) {
      //         mess = environment.errors[error.code];
      //       }
      //       this.utils.showToastError(mess);
      //       this.utils.hideLoader();
      //     }
      //   );
    } else {
      //this.common.hideLoader();
      this.utils.showToastError('Veuillez entrer vos identifiants');
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
      // this.authServ.forgotPassoword(email);
    }
  }
}
