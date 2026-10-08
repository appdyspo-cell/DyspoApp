import { Injectable } from '@angular/core';
import {
  AppDeviceContact,
  AppUser,
  AppUserWithEvents,
  UserDyspoStatus,
  UserStatus,
} from '../models/models';
import {
  Firestore,
  collection,
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
        this.docDataSubscribtion = docData(docRef).subscribe({
          next: (firebaseUserDocData: any) => {
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
          },
          error: (err) => {
            // Erreur Firestore (permission denied, réseau, etc.) :
            // sans ce handler, la Promise ne résout jamais → SplashScreen bloqué.
            this.logger.logDebug('ERR subscribeUserInfo Firestore error', err);
            reject({ msg: 'Erreur de connexion au serveur', error: true });
          }
        });
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
    const ref = doc(this.firestore, `users/${appUser.uid}`);
    await updateDoc(ref, appUserClone);
  }

  /**
   * Marque la fin de la toute première connexion de l'utilisateur — appelé quand
   * l'application passe en arrière-plan pour la première fois après sa création
   * de compte. Sert de garde globale pour les popups tutoriel (ShowHelper).
   */
  async endFirstConnexion(): Promise<void> {
    if (!this.userInfo?.uid || this.userInfo.firstConnexion === false) return;
    this.userInfo.firstConnexion = false;
    const ref = doc(this.firestore, `users/${this.userInfo.uid}`);
    await updateDoc(ref, { firstConnexion: false });
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

  /**
   * Provisionne le document Firestore d'un utilisateur lors de sa toute première
   * connexion via un provider social (Google/Apple/Facebook) — ces comptes n'ont
   * pas suivi le formulaire d'inscription classique.
   */
  public async createMinimalUserDoc(firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<void> {
    const [firstname, ...rest] = (firebaseUser.displayName ?? '')
      .trim()
      .split(' ')
      .filter((part) => part !== '');

    const newUser: AppUser = {
      ...this.getEmptyUser(),
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      firstname: firstname || '',
      lastname: rest.join(' ') || '',
      avatarPath: firebaseUser.photoURL ?? environment.DEFAULT_AVATAR,
    };

    const ref = doc(this.firestore, `users/${firebaseUser.uid}`);
    await setDoc(ref, newUser);
  }

  public async getAllOtherUsers(): Promise<AppUser[]> {
    const q = query(
      collection(this.firestore, 'users'),
      where('status', '==', UserStatus.ACTIVE)
    );
    const querySnapshot = await getDocs(q);
    const users: AppUser[] = [];
    querySnapshot.forEach((snap) => {
      if (snap.id !== this.userInfo!.uid) {
        const user = snap.data() as AppUser;
        user.uid = snap.id;
        users.push(user);
      }
    });
    return users;
  }

  public async getUserInfos(uids: string[]): Promise<AppUserWithEvents[]> {
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

  /**
   * Indique pour chaque contact du téléphone s'il est membre Dyspo.
   * Requêtes par lots de 30 numéros (limite Firestore pour 'in'), plusieurs lots
   * en parallèle. `onProgress` est appelé après chaque lot pour que l'écran
   * affiche les logos Dyspo au fur et à mesure.
   */
  async hydrateAppContacts(appContacts: AppDeviceContact[], onProgress?: () => void) {
    // Contacts regroupés par numéro au format stocké en DB ('0' + 9 derniers chiffres)
    const contactsByPhone = new Map<string, AppDeviceContact[]>();
    appContacts
      .filter(c => c.phone_number)
      .forEach(c => {
        const phone = '0' + c.phone_number;
        const list = contactsByPhone.get(phone) ?? [];
        list.push(c);
        contactsByPhone.set(phone, list);
      });

    const phoneNumbers = [...contactsByPhone.keys()];
    if (phoneNumbers.length === 0) {
      this.logger.logDebug('hydrateAppContacts: aucun contact à hydrater');
      return;
    }

    const CHUNK_SIZE = 30;
    const PARALLEL_QUERIES = 4;
    const chunks: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += CHUNK_SIZE) {
      chunks.push(phoneNumbers.slice(i, i + CHUNK_SIZE));
    }

    const collectionUserRef = collection(this.firestore, 'users');
    const hydrateChunk = async (chunk: string[]) => {
      const snaps = await getDocs(query(collectionUserRef, where('phoneNumber', 'in', chunk)));
      const members = new Map<string, AppUser>();
      snaps.forEach((snap) => {
        const user = snap.data() as AppUser;
        members.set(user.phoneNumber!, user);
      });
      chunk.forEach((phone) => {
        const found = members.get(phone);
        contactsByPhone.get(phone)?.forEach((appContact) => {
          if (found) {
            appContact.uid = found.uid;
            appContact.avatar = found.avatarPath;
            appContact.is_member = true;
          } else {
            appContact.is_member = false;
          }
        });
      });
      onProgress?.();
    };

    // Plusieurs lots en vol en même temps, sans tout lancer d'un coup
    let next = 0;
    const worker = async () => {
      while (next < chunks.length) {
        await hydrateChunk(chunks[next++]);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL_QUERIES, chunks.length) }, worker));
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
