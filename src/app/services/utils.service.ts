import { Injectable } from '@angular/core';
import {
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular';
import { environment } from 'src/environments/environment';

import { LoggerService } from './logger.service';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  loader: HTMLIonLoadingElement | undefined;

  constructor(
    private toast: ToastController,
    private alertCtrl: AlertController,
    private loadCtrl: LoadingController,
    private logger: LoggerService
  ) {}

  // Wrapper of this.logger.logDebug()
  log(message?: any, ...optionalParams: any[]) {
    if (environment.debug) {
      this.logger.logDebug(message, optionalParams);
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
      case 'auth/invalid-login-credentials':
        return 'Mauvais identifiant / mot de passe incorrect';
        break;
      case 'auth/invalid-credential':
        return 'Mauvais identifiant / mot de passe incorrect';
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
      case 'auth/operation-not-allowed':
        return "Impossible d'effectuer cette opération";
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

  showToastSuccessBottom(message: string) {
    this.toast
      .create({
        message,
        duration: 3500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-done-circle-outline',
      })
      .then((res) => res.present());
  }

  showAlert(message: any) {
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
        this.logger.logDebug('Hide Loader');

        this.loader.dismiss();
        this.loader = undefined;
      }
    }, 450);
  }

  validateEmail(email: string) {
    this.logger.logDebug('Validate ', email);
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  validatePhone(phone: string | undefined) {
    if (!phone) return false;
    const cleaned = String(phone).trim().toLowerCase();
    // Numéro français (avec ou sans indicatif +33 / 0033)
    const frRegex =
      /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/;
    if (frRegex.test(cleaned)) return true;
    // Repli international (E.164) : + suivi de l'indicatif pays et du numéro
    const intlRegex = /^\+[1-9]\d{7,14}$/;
    return intlRegex.test(cleaned.replace(/[\s.-]/g, ''));
  }

  createUID() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  showAlertError(message: string) {
    this.alertCtrl
      .create({
        header: 'Erreur',
        message,
        buttons: ['OK'],
      })
      .then((alert) => alert.present());
  }

  showAlertSuccess(title: string, message: string) {
    this.alertCtrl
      .create({
        header: title,
        message,
        buttons: ['OK'],
      })
      .then((alert) => alert.present());
  }

  // Confirmation Oui/Non (remplace les anciens Swal.fire showDenyButton/showCancelButton)
  confirmAction(opts: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.alertCtrl
        .create({
          header: opts.title,
          message: opts.message,
          cssClass: 'dyspo-alert-confirm',
          buttons: [
            {
              text: opts.cancelText || 'Annuler',
              role: 'cancel',
              handler: () => resolve(false),
            },
            {
              text: opts.confirmText || 'Confirmer',
              role: opts.destructive ? 'destructive' : undefined,
              handler: () => resolve(true),
            },
          ],
        })
        .then((alert) => alert.present());
    });
  }

  // Saisie d'un email avec validation (remplace les anciens Swal.fire input: 'email')
  promptEmail(opts: { title: string; placeholder?: string }): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      this.alertCtrl
        .create({
          header: opts.title,
          inputs: [
            {
              name: 'email',
              type: 'email',
              placeholder: opts.placeholder || 'Entrez votre email',
            },
          ],
          buttons: [
            { text: 'Annuler', role: 'cancel', handler: () => resolve(undefined) },
            {
              text: 'Envoyer',
              handler: (data) => {
                const email = (data.email || '').trim();
                if (!this.validateEmail(email)) {
                  this.showToastError("L'adresse email n'est pas valide.");
                  return false;
                }
                resolve(email);
                return true;
              },
            },
          ],
        })
        .then((alert) => alert.present());
    });
  }

  // Saisie libre multi-ligne (remplace les anciens Swal.fire input: 'textarea')
  promptTextarea(opts: {
    title?: string;
    placeholder?: string;
    confirmText?: string;
  }): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      this.alertCtrl
        .create({
          header: opts.title,
          inputs: [
            {
              name: 'text',
              type: 'textarea',
              placeholder: opts.placeholder,
            },
          ],
          buttons: [
            { text: 'Annuler', role: 'cancel', handler: () => resolve(undefined) },
            {
              text: opts.confirmText || 'Envoyer',
              handler: (data) => resolve((data.text || '').trim() || undefined),
            },
          ],
        })
        .then((alert) => alert.present());
    });
  }

  formatISODate(dateISO: string) {
    return format(parseISO(dateISO), 'iii dd MMM yyyy', { locale: fr });
  }

  formatDate(dateMs: number) {
    return format(new Date(dateMs), 'iii dd MMM yyyy', { locale: fr });
  }

  formatTime(dateISO: string) {
    return format(parseISO(dateISO), 'HH:mm');
  }

  formatMonth(dateMs: number) {
    const month = format(new Date(dateMs), 'MMMM', { locale: fr });
    return month.charAt(0).toUpperCase() + month.slice(1);
  }
}
