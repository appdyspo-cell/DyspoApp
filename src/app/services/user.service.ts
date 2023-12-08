import { Injectable } from '@angular/core';
import {
  AppUser,
  AppUserWithEvents,
  UserDyspoStatus,
  UserStatus,
} from '../models/models';
import {
  DocumentData,
  Firestore,
  collection,
  collectionSnapshots,
  doc,
  docData,
  getDoc,
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
  private _appUserInfo: AppUser | undefined;
  private _appUserInfoSubject = new BehaviorSubject<AppUser>(
    this.getEmptyUser()
  );

  private docDataObs$: Observable<any> | undefined;
  private docDataSubscribtion: Subscription = new Subscription();

  //userInfoFirebaseObs$!: Observable<AppUser>;
  appUserInfoObs$!: Observable<AppUser>;
  appUserInfoSubscription: Subscription = new Subscription();

  constructor(
    private firestore: Firestore,
    private authSvc: AuthService,
    private logger: LoggerService
  ) {
    this.appUserInfoObs$ = this._appUserInfoSubject.asObservable();
  }

  get userInfo(): AppUser | undefined {
    return this._appUserInfo;
  }
  set userInfo(val: AppUser | undefined) {
    this._appUserInfo = val;
  }

  public async subscribeUserInfo(uid: string) {
    return new Promise<AppUser>((resolve, reject) => {
      if (this.docDataSubscribtion) {
        console.log('Unsubscribe previous user');
        this.docDataSubscribtion.unsubscribe();
      }
      if (uid) {
        this.logger.logDebug('userSvc subscribe to ----- ', uid);
        const docRef = doc(this.firestore, 'users', uid);
        this.docDataSubscribtion = docData(docRef).subscribe(
          (firebaseUserDocData: any) => {
            if (!firebaseUserDocData) {
              console.error('User not found');
              reject('NOTFOUND');
            } else {
              firebaseUserDocData['uid'] = uid;
              this.userInfo = { ...firebaseUserDocData };
              this._appUserInfoSubject.next(this.userInfo!);
              //Si l'utilisateur a été effacé
              if (firebaseUserDocData.status === UserStatus.DELETED) {
                this.authSvc.logout();
              }
              resolve(this.userInfo!);
            }
          }
        );
      } else {
        reject('NOUID');
      }
    });
  }

  public async unsubscribeUserInfo() {
    if (this.docDataSubscribtion) {
      this.docDataSubscribtion.unsubscribe();
    }
    this.userInfo = undefined;
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

  public async getUserInfos(
    uids: string[],
    withEvents = false
  ): Promise<AppUserWithEvents[]> {
    const appUsers: AppUserWithEvents[] = [];
    for (let uid of uids) {
      const docRef = doc(this.firestore, `users`, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const result = docSnap.data() as AppUserWithEvents;
        result.agendaEvents = [];
        appUsers.push(result);
      }
    }
    return appUsers;
  }

  public async getUserInfosExceptMe(
    uids: string[]
  ): Promise<AppUserWithEvents[]> {
    const appUsers: AppUserWithEvents[] = [];
    for (let uid of uids) {
      if (uid !== this.userInfo?.uid) {
        const docRef = doc(this.firestore, `users`, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const result = docSnap.data() as AppUserWithEvents;
          result.agendaEvents = [];
          appUsers.push(result);
        }
      }
    }
    return appUsers;
  }
}
