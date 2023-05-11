import { Injectable } from '@angular/core';
import {
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular';

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
        return null;
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
}
