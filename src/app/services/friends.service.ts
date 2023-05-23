import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { AppUser, Friend, FriendStatus } from '../models/models';
import { UtilsService } from './utils.service';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  friends$!: Observable<Friend[]>;
  friendsSuggested$!: Observable<Friend[]>;

  constructor(
    private firestore: Firestore,
    private utils: UtilsService,
    private userSvc: UserService,
    private notificationSvc: NotificationService
  ) {}

  async unblockFriend(friend: Friend) {
    return new Promise(async (resolve, reject) => {
      // Update my list of friends
      const uid = this.userSvc.userInfo?.uid;
      const docRef = doc(
        this.firestore,
        `friends/${uid}/friend_list/${friend.uid}`
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        updateDoc(docSnap.ref, {
          status: FriendStatus.FRIEND,
          since: new Date().getTime(),
        }).then(() => {
          console.log('Finished update my friend list');
        });
      }

      // Update his list of friends
      const collectionFriendRef = collection(
        this.firestore,
        `friends/${friend.userData?.uid}/friend_list`
      );
      const queryFriend = query(
        collectionFriendRef,
        where('friendUid', '==', uid)
      );
      const docFriendSnap = await getDocs(queryFriend);
      if (!docFriendSnap.empty) {
        const target = docFriendSnap.docs[0];

        updateDoc(target.ref, {
          status: FriendStatus.FRIEND,
          since: new Date().getTime(),
        }).then(() => {
          console.log('Finished update his friend list');
          resolve('OK');
        });
      }
    });
  }

  getFriendByUid(friend: Friend) {
    return new Promise(async (resolve, reject) => {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('uid', '==', friend.friendUid));
      const result = await getDocs(q);
      if (!result.empty) {
        const userData = result.docs[0].data() as AppUser;
        friend.userData = userData;
        friend.userData.uid = result.docs[0].id;
        resolve(friend);
      } else {
        reject('NOT FOUND');
      }
    });
  }

  initService(uid: string) {
    console.log('Init Friend Service...');
    const that = this;

    const friendsCollectionRef = collection(
      this.firestore,
      `friends/${uid}/friend_list`
    );
    const qFriends = query(
      friendsCollectionRef,
      where('friend_status', '==', FriendStatus.FRIEND)
    );
    const qFriendsSuggested = query(
      friendsCollectionRef,
      where('friend_status', '==', FriendStatus.SUGGESTED)
    );

    this.friends$ = collectionData(qFriends) as Observable<Friend[]>;
    this.friendsSuggested$ = collectionData(qFriendsSuggested) as Observable<
      Friend[]
    >;
  }

  public get friends() {
    return this.friends$;
  }

  async invite(membre: AppUser) {
    const uid = this.userSvc.userInfo?.uid || 'unknown';
    console.log(membre);
    //Check if membre has been blocked
    //this.friendService
    this.utils.showLoader();

    const myInviteData = {
      friendUid: membre.uid,
      friendLastname: membre.lastname,
      friendFirstname: membre.firstname,
      status: FriendStatus.INVITED,
      requestDate: new Date().getTime(),
    };
    await setDoc(
      doc(this.firestore, `friends/${uid}/friend_list`, membre.uid),
      myInviteData,
      { merge: true }
    );

    const hisSuggestionData = {
      friendUid: uid,
      friendDocId: this.userSvc.userInfo?.uid,
      friendLastname: this.userSvc.userInfo?.lastname,
      friendFirstname: this.userSvc.userInfo?.firstname,
      status: FriendStatus.SUGGESTED,
      requestDate: new Date().getTime(),
    };
    await setDoc(
      doc(this.firestore, `friends/${uid}/friend_list`, uid),
      hisSuggestionData,
      { merge: true }
    );

    this.notificationSvc.sendInviteFriendNotif(membre.uid);
  }

  async addFriend(friend: AppUser) {
    const uid = this.userSvc.userInfo?.uid || 'unknown';

    updateDoc(doc(this.firestore, `friends/${uid}/friend_list/${friend.uid}`), {
      status: FriendStatus.FRIEND,
      since: new Date().getTime(),
    });

    updateDoc(doc(this.firestore, `friends/${friend.uid}/friend_list/${uid}`), {
      status: FriendStatus.FRIEND,
      since: new Date().getTime(),
    });

    // Send notif ?
    // this.notification-service.sendConfirmFriend()
  }

  async deleteFriend(friend: AppUser, listElement: any) {
    const uid = this.userSvc.userInfo?.uid;
    await deleteDoc(
      doc(this.firestore, `friends/${uid}/friend_list/${friend.uid}`)
    );
    const friendCollectionRef = collection(
      this.firestore,
      `friends/${uid}/friend_list`
    );
    const querySnapshot = await getDocs(
      query(friendCollectionRef, where('friendUid', '==', uid))
    );
    if (!querySnapshot.empty) {
      deleteDoc(querySnapshot.docs[0].ref);
    }
  }

  unsubscribeAllAfterLogoutEvent() {
    // if (this.friendsObservable) {
    //   this.friendsObservable.unsubscribe();
    // }
    // this.friends = [];
  }

  // getFriendStatus(friendUid: string) {
  //   console.log('Get friend status with uid:', friendUid);
  //   const foundIndex = this.friends.findIndex(
  //     (elt) => elt.friendUid === friendUid
  //   );
  //   if (foundIndex >= 0) {
  //     return this.friends[foundIndex].status;
  //   } else {
  //     return 'NOTFRIEND';
  //   }
  // }
}
