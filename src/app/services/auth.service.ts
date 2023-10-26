import { Injectable } from '@angular/core';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import {
  Firestore,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { AppUser, UserStatus } from '../models/models';
import Swal from 'sweetalert2';

import { getApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private BIOMETRIC_KEY = environment.BIOMETRIC_KEY;

  constructor(
    private afAuth: Auth,
    private firestore: Firestore,
    private utils: UtilsService
  ) {
    // Initialize Remote Config and get a reference to the service
    // const remoteConfig = getRemoteConfig(getApp());
    // console.log(remoteConfig);
    // fetchAndActivate(remoteConfig)
    //   .then(() => {
    //     this.BIOMETRIC_KEY = getValue(remoteConfig, 'BIOMETRIC_KEY').asString();
    //     console.log(this.BIOMETRIC_KEY);
    //   })
    //   .catch((err) => {
    //     // ...
    //   });
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.afAuth, email, password);
  }

  async register(
    userInfo: AppUser,
    password: string
  ): Promise<UserCredential | null> {
    try {
      const credentials = await createUserWithEmailAndPassword(
        this.afAuth,
        userInfo.email!,
        password
      );
      const ref = doc(this.firestore, `users/${credentials.user.uid}`);
      setDoc(ref, userInfo);
      return credentials;
    } catch (e) {
      this.utils.log(e);
      return null;
    }
  }

  logout() {
    return signOut(this.afAuth);
  }

  resetPw(email: string) {
    return sendPasswordResetEmail(this.afAuth, email);
  }

  removeAccount() {
    // Suppression de l'utilisateur courant
    const user = this.afAuth.currentUser;

    if (user) {
      const refUser = doc(this.firestore, 'users', user.uid);
      deleteUser(user)
        .then(() => {
          this.utils.log("L'utilisateur a été supprimé avec succès");
          updateDoc(refUser, { status: UserStatus.DELETED });
        })
        .catch((error) => {
          this.utils.showFirebaseError(error);
          this.utils.log(
            "Une erreur est survenue lors de la suppression de l'utilisateur : ",
            error
          );
        });
    } else {
      this.utils.log('Aucun utilisateur connecté');
    }

    //return new Promise(async (resolved, reject) => {
    // const uid = this.userInfo.id;
    // this.fns
    //   .httpsCallable('deleteUser')({
    //     uid
    //   })
    //   .subscribe(
    //     (res) => {
    //       console.log(res);
    //       if (res.success) {
    //         console.log('Suppression User OK');
    //         resolved('DELETED');
    //         //Remove me from all games
    //         //this.removeMeFromAllGames(uid);
    //         //Remove friends
    //         //this.removeMyFriends(uid);
    //         this.afs.collection('users').doc(uid).update({
    //           status: environment.userStatus.DELETED,
    //           email: '',
    //           phoneNumber: ''
    //         });
    //       } else {
    //         console.log('Impossible de supprimer le user ', res.error);
    //         reject(res.error);
    //       }
    //     },
    //     (err) => {
    //       let mess = err.message;
    //       if (environment.errors[err.code]) {
    //         mess = environment.errors[err.code];
    //       }
    //       reject(mess);
    //     }
    //   );
    // Then logout
    //this.logout();
    // });
  }
}
