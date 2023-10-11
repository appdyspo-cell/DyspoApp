import { Injectable } from '@angular/core';
import { AppUser, UserDyspoStatus, UserStatus } from '../models/models';
import {
  Firestore,
  collection,
  collectionSnapshots,
  doc,
  docData,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
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
  private _userInfoSubject = new BehaviorSubject<AppUser>(this.getEmptyUser());

  userInfoFirebaseObs$!: Observable<AppUser>;
  userInfoObs$!: Observable<AppUser>;
  userInfoSubscription: Subscription = new Subscription();

  constructor(
    private firestore: Firestore,
    private authSvc: AuthService,
    private logger: LoggerService
  ) {
    this.userInfoObs$ = this._userInfoSubject.asObservable();
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
        console.log('Unsubscribe previous user');
        this.userInfoSubscription.unsubscribe();
      }
      if (uid) {
        this.logger.logDebug('userSvc subscribe to ----- ', uid);
        const docRef = doc(this.firestore, 'users', uid);
        this.userInfoObs$ = docData(docRef) as Observable<AppUser>;
        this.userInfoSubscription = this.userInfoObs$.subscribe((appUser) => {
          if (!appUser) {
            reject('NOTFOUND');
          } else {
            appUser.uid = uid;
            this.userInfo = { ...appUser };
            this._userInfoSubject.next(this.userInfo);
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

  public getEmptyUser(): AppUser {
    return {
      email: '',
      uid: '',
      firstname: '',
      lastname: '',
      gender: 'M',
      phoneNumber: '',
      avatarPath: environment.DEFAULT_AVATAR,
      firstConnexion: true,
      last_connexion_ms: 0,
      status: UserStatus.ACTIVE,
      dyspoStatus: UserDyspoStatus.DYSPO,
      appSettings: {
        receiveEmail: false,
        receiveNotification: true,
        friendInvitation: true,
        actualiteDyspo: true,
        shareAgenda: true,
      },
      tagline: '',
    };
  }

  public getAllOtherUsers() {
    return new Promise<AppUser[]>(async (resolve, reject) => {
      const users: AppUser[] = [];
      const usersCollectionRef = collection(this.firestore, 'users');

      const querySnapshot = await getDocs(usersCollectionRef);
      querySnapshot.forEach((snap) => {
        const user = snap.data() as AppUser;

        if (
          user.status === UserStatus.ACTIVE &&
          snap.id !== this.userInfo!.uid
        ) {
          user.uid = snap.id;
          users.push(user);
        }
      });
      resolve(users);
    });
  }
}
