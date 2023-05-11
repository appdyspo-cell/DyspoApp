import { Injectable } from '@angular/core';
import {
  Auth,
  UserCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: Auth) {}

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.afAuth, email, password);
  }

  logout() {
    return signOut(this.afAuth);
  }

  resetPw(email: string) {
    return sendPasswordResetEmail(this.afAuth, email);
  }

  removeAccount() {
    return new Promise(async (resolved, reject) => {
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
    });
  }
}
