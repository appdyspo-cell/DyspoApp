import { Injectable } from '@angular/core';
import {
  AppDeviceContact,
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
              reject({ msg: 'Utilisateur non trouvé', error: true });
            } else {
              //Si l'utilisateur a été effacé ou banni
              if (
                firebaseUserDocData.status === UserStatus.DELETED ||
                firebaseUserDocData.status === UserStatus.BANNED
              ) {
                this.authSvc.logout();
                reject({ msg: 'Utilisateur banni', error: true });
              } else {
                firebaseUserDocData['uid'] = uid;
                this.userInfo = { ...firebaseUserDocData };
                this._appUserInfoSubject.next(this.userInfo!);
                resolve(this.userInfo!);
              }
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
        eventInvitation: true,
        actualiteDyspo: true,
        shareAgenda: true,
      },
      tagline: '',
      geo_zone: 'zone_A',
      with_kids: false,
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

  async getUserInfosByPhone(number: string): Promise<AppUser | null> {
    const collectionUserRef = collection(this.firestore, `users`);
    const q = query(collectionUserRef, where('phoneNumber', '==', number));
    const docFriendSnap = await getDocs(q);
    if (!docFriendSnap.empty) {
      const target = docFriendSnap.docs[0];
      return target.data() as AppUser;
    } else {
      return null;
    }
  }

  async hydrateAppContacts(appContacts: AppDeviceContact[]) {
    const collectionUserRef = collection(this.firestore, `users`);
    //const q = query(collectionUserRef, where('phoneNumber', '==', number));
    const docFriendSnaps = await getDocs(collectionUserRef);
    const allPhones: string[] = [];
    const allUsers: AppUser[] = [];
    docFriendSnaps.forEach((snap) => {
      const user = snap.data() as AppUser;
      if (user.phoneNumber) {
        allUsers.push(user);
      }
    });
    // docFriendSnaps.forEach((snap) => {
    //   const user = snap.data() as AppUser;
    //   if (user.phoneNumber) {
    //     allPhones.push(user.phoneNumber);
    //   }
    // });
    //  appContacts.map(appContact => {
    //   return appContact.is_member = true
    // })
    appContacts.forEach((appContact) => {
      const foundIndex = allUsers.findIndex((user) => {
        return user.phoneNumber === '0' + appContact.phone_number;
      });
      if (foundIndex >= 0) {
        appContact.uid = allUsers[foundIndex].uid;
        appContact.avatar = allUsers[foundIndex].avatarPath;
        appContact.is_member = true;
      } else {
        appContact.is_member = false;
      }
    });
  }
}
