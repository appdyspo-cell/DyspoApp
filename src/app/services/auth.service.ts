import { Injectable } from '@angular/core';
import {
  Auth,
  UserCredential,
  createUserWithEmailAndPassword,
  deleteUser,
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { UtilsService } from './utils.service';
import { AppUser, UserStatus } from '../models/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: Auth,
    private firestore: Firestore,
    private utils: UtilsService
  ) {}

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
      userInfo.uid = credentials.user.uid;
      await setDoc(ref, userInfo); // BC-01: await ajouté — profil garanti avant navigation
      return credentials;
    } catch (e) {
      this.utils.log(e);
      this.utils.showFirebaseError(e);
      return null;
    }
  }

  async logout() {
    // Déconnecte aussi le SDK natif (Google/Apple/Facebook), sinon le prochain
    // signInWithGoogle() ré-utilise silencieusement le compte précédent.
    try {
      await FirebaseAuthentication.signOut();
    } catch (e) {
      this.utils.log(e);
    }
    return signOut(this.afAuth);
  }

  async signInWithGoogle(): Promise<UserCredential | null> {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (!result.credential?.idToken) return null;
      const credential = GoogleAuthProvider.credential(
        result.credential.idToken,
        result.credential.accessToken
      );
      return await signInWithCredential(this.afAuth, credential);
    } catch (e) {
      this.utils.log(e);
      this.utils.showFirebaseError(e);
      return null;
    }
  }

  async signInWithApple(): Promise<UserCredential | null> {
    try {
      const result = await FirebaseAuthentication.signInWithApple();
      if (!result.credential?.idToken) return null;
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: result.credential.idToken,
        rawNonce: result.credential.nonce,
      });
      return await signInWithCredential(this.afAuth, credential);
    } catch (e) {
      this.utils.log(e);
      this.utils.showFirebaseError(e);
      return null;
    }
  }

  async signInWithFacebook(): Promise<UserCredential | null> {
    try {
      const result = await FirebaseAuthentication.signInWithFacebook();
      if (!result.credential?.accessToken) return null;
      const credential = FacebookAuthProvider.credential(
        result.credential.accessToken
      );
      return await signInWithCredential(this.afAuth, credential);
    } catch (e) {
      this.utils.log(e);
      this.utils.showFirebaseError(e);
      return null;
    }
  }

  resetPw(email: string): Promise<void> {
    return sendPasswordResetEmail(this.afAuth, email);
  }

  async removeAccount() {
    const user = this.afAuth.currentUser;
    if (!user) {
      this.utils.log('Aucun utilisateur connecté');
      return;
    }
    const refUser = doc(this.firestore, 'users', user.uid);
    try {
      // Anonymiser Firestore EN PREMIER pendant que le token est encore valide
      await updateDoc(refUser, {
        status: UserStatus.DELETED,
        firstname: 'Compte effacé',
        lastname: 'Compte effacé',
        avatarPath: environment.DEFAULT_AVATAR,
        email: '',
      });
      await deleteUser(user);
      this.utils.log("L'utilisateur a été supprimé avec succès");
    } catch (error: any) {
      this.utils.showFirebaseError(error);
      this.utils.log("Erreur lors de la suppression :", error);
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
