import { Injectable } from '@angular/core';
import { AppUser, UserStatus } from '../models/models';
import {
  Firestore,
  collection,
  collectionSnapshots,
  doc,
  docData,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _userInfo: AppUser | undefined;
  private _userInfoSubject = new BehaviorSubject<AppUser | undefined>(
    undefined
  );

  userInfoFirebaseObs$!: Observable<AppUser>;
  userInfoObs$!: Observable<AppUser>;
  userInfoSubscription: Subscription = new Subscription();

  constructor(
    private firestore: Firestore,
    private authSvc: AuthService,
    private logger: LoggerService
  ) {
    //this.userInfoObs$ = this._userInfoSubject.asObservable();
  }

  get userInfo(): AppUser | undefined {
    return this._userInfo;
  }
  set userInfo(val: AppUser | undefined) {
    this._userInfo = val;
  }

  public async subscribeUserInfo(uid: string) {
    return new Promise<AppUser>((resolve, reject) => {
      if (this.userInfoSubscription) {
        this.userInfoSubscription.unsubscribe();
      }
      if (uid) {
        const docRef = doc(this.firestore, 'users', uid);
        this.userInfoObs$ = docData(docRef) as Observable<AppUser>;
        this.userInfoSubscription = this.userInfoObs$.subscribe((appUser) => {
          if (!appUser) {
            reject('NOTFOUND');
          } else {
            this.logger.logDebug('user changed ----- ');
            this.logger.logDebug(appUser);
            appUser.uid = uid;
            this.userInfo = { ...appUser };
            //Si l'utilisateur a été effacé
            if (appUser.status === UserStatus.DELETED) {
              this.authSvc.logout();
            }
            resolve(this.userInfo!);
          }
        });
      } else {
        reject('NOUID');
      }
    });
  }

  public async unsubscribeUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.userInfoSubscription) {
        this.userInfoSubscription.unsubscribe();
      }
      this.userInfo = undefined;
    });
  }

  async updateUser(appUser: AppUser) {
    this.logger.logDebug('Update User');
    const appUserClone: any = { ...appUser };
    //delete appUserClone.id;
    const ref = doc(this.firestore, `users/${appUser.uid}`);
    updateDoc(ref, appUserClone);
  }
}
