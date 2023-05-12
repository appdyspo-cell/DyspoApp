import { Injectable } from '@angular/core';
import {
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular';
import { environment } from 'src/environments/environment';

import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  loader: HTMLIonLoadingElement | undefined;

  constructor(
    private toast: ToastController,
    private alertCtrl: AlertController,
    private loadCtrl: LoadingController
  ) {}

  // Wrapper of console.log()
  log(message?: any, ...optionalParams: any[]) {
    if (environment.debug) {
      console.log(message, optionalParams);
    }
  }

  showFirebaseError(error: any) {
    let errMsg = 'Erreur inconnue';
    if (error['code']) {
      errMsg = this.getFirebaseError(error['code']);
    } else if (error.message) {
      errMsg = error.message;
    }
    this.showToastError(errMsg);
  }

  getFirebaseError(code: string) {
    switch (code) {
      case 'auth/user-not-found':
        return "L'utilisateur n'existe pas";
        break;
      case 'auth/invalid-email':
        return "L'email n'est pas valide";
        break;
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir 6 caractères minimum';
        break;
      case 'auth/email-already-in-use':
        return "L'email est déjà utilisé par un autre compte";
        break;
      case 'auth/wrong-password':
        return 'Le mot de passe est incorrect';
        break;
      case 'auth/requires-recent-login':
        return "Cette opération nécessite une connexion récente. Veuillez vous reconnecter à l'application";
        break;
      case 'auth/too-many-requests':
        return "L'accès à ce compte a été temporairement désactivé en raison de nombreuses tentatives de connexion infructueuses. Vous pouvez le restaurer immédiatement en réinitialisant votre mot de passe ou vous pouvez réessayer plus tard";
        break;
      default:
        return 'Erreur inconnue';
    }
  }

  showToast(message: string) {
    this.toast
      .create({ message, duration: 3500, position: 'top' })
      .then((res) => res.present());
  }

  showToastError(message: string) {
    this.toast
      .create({
        message,
        duration: 3500,
        position: 'top',
        color: 'danger',
        icon: 'alert-circle-outline',
      })
      .then((res) => res.present());
  }

  showToastSuccess(message: string) {
    this.toast
      .create({
        message,
        duration: 3500,
        position: 'top',
        color: 'success',
        icon: 'checkmark-done-circle-outline',
      })
      .then((res) => res.present());
  }

  showAlert(message: string) {
    this.alertCtrl
      .create({
        message,
        buttons: ['ok'],
      })
      .then((res) => res.present());
  }

  showLoader() {
    if (this.loader == null) {
      this.loadCtrl
        .create({ spinner: 'circles', duration: 60000 })
        .then((res) => {
          this.loader = res;
          this.loader.present();
        });
    }
  }

  hideLoader() {
    setTimeout(() => {
      if (this.loader != null) {
        console.log('Hide Loader');

        this.loader.dismiss();
        this.loader = undefined;
      }
    }, 450);
  }

  validateEmail(email: string) {
    console.log('Validate ', email);
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  validatePhone(phone: string | undefined) {
    if (!phone) return;
    // eslint-disable-next-line no-useless-escape
    //const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    const re =
      /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/;
    return re.test(String(phone).toLowerCase());
  }

  createUID() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  //Sweet alerts
  swalError(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
      //footer: '<a href>Why do I have this issue?</a>',
      heightAuto: false,
    });
  }

  swalWarning(message: string) {
    Swal.fire({
      icon: 'warning',
      //title: 'Erreur',
      text: message,
      //footer: '<a href>Why do I have this issue?</a>',
      heightAuto: false,
    });
  }

  swalSuccess(title: string, message: string) {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      heightAuto: false,
    });
  }
}
