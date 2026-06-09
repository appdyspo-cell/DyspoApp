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
    const appUserClone: Partial<AppUser> = { ...appUser };
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
    if (!uids || uids.length === 0) return [];
    const appUsers: AppUserWithEvents[] = [];
    const chunks = [];
    for (let i = 0; i < uids.length; i += 10) {
      chunks.push(uids.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
      const q = query(collection(this.firestore, 'users'), where('uid', 'in', chunk));
      const querySnapshots = await getDocs(q);
      querySnapshots.forEach((docSnap) => {
        const result = docSnap.data() as AppUserWithEvents;
        result.agendaEvents = [];
        appUsers.push(result);
      });
    }
    return appUsers;
  }

  public async getUserInfosExceptMe(
    uids: string[]
  ): Promise<AppUserWithEvents[]> {
    if (!uids || uids.length === 0) return [];
    
    const filteredUids = uids.filter(uid => uid !== this.userInfo?.uid);
    if (filteredUids.length === 0) return [];

    const appUsers: AppUserWithEvents[] = [];
    const chunks = [];
    for (let i = 0; i < filteredUids.length; i += 10) {
      chunks.push(filteredUids.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
      const q = query(collection(this.firestore, 'users'), where('uid', 'in', chunk));
      const querySnapshots = await getDocs(q);
      querySnapshots.forEach((docSnap) => {
        const result = docSnap.data() as AppUserWithEvents;
        result.agendaEvents = [];
        appUsers.push(result);
      });
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
    // BC-04: remplacement du full scan par une requête chunked sur les numéros de téléphone
    // Prépare les numéros au format stocké en DB (préfixe '0' + 9 derniers chiffres)
    const phoneNumbers = appContacts
      .filter(c => c.phone_number)
      .map(c => '0' + c.phone_number);

    if (phoneNumbers.length === 0) {
      this.logger.logDebug('hydrateAppContacts: aucun contact à hydrater');
      return;
    }

    const allUsers: AppUser[] = [];
    const collectionUserRef = collection(this.firestore, 'users');

    // Chunks de 10 (limite Firestore pour 'in')
    const chunks: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += 10) {
      chunks.push(phoneNumbers.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const q = query(collectionUserRef, where('phoneNumber', 'in', chunk));
      const snaps = await getDocs(q);
      snaps.forEach((snap) => {
        allUsers.push(snap.data() as AppUser);
      });
    }

    appContacts.forEach((appContact) => {
      const targetPhone = '0' + appContact.phone_number;
      const found = allUsers.find(user => user.phoneNumber === targetPhone);
      if (found) {
        appContact.uid = found.uid;
        appContact.avatar = found.avatarPath;
        appContact.is_member = true;
      } else {
        appContact.is_member = false;
      }
    });
    this.logger.logDebug('hydrateAppContacts: hydratation OK');
  }

  async getMartinContacts() {
    const docSnap = await getDoc(
      doc(this.firestore, `log_debug_data/`, 'data_1708441773275')
    );
    if (docSnap.exists()) {
      const contacts = docSnap.data();
      return contacts;
    } else return null;
  }
}
