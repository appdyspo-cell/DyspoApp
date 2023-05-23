import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { AppUser, Friend, FriendStatus } from '../models/models';
import { UtilsService } from './utils.service';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  public friends: Friend[] = [];
  //public friendsSuggested: Friend[] = [];
  public friendsSubject = new BehaviorSubject<Friend[]>([]);

  public friends$!: Observable<Friend[]>;
  public friendsSuggested$!: Observable<Friend[]>;

  constructor(
    private firestore: Firestore,
    private utils: UtilsService,
    private userSvc: UserService,
    private notificationSvc: NotificationService
  ) {
    this.friends$ = this.friendsSubject.asObservable();
  }

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
          friend_status: FriendStatus.FRIEND,
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
        where('friend_uid', '==', uid)
      );
      const docFriendSnap = await getDocs(queryFriend);
      if (!docFriendSnap.empty) {
        const target = docFriendSnap.docs[0];

        updateDoc(target.ref, {
          friend_status: FriendStatus.FRIEND,
          since: new Date().getTime(),
        }).then(() => {
          console.log('Finished update his friend list');
          resolve('OK');
        });
      }
    });
  }

  getFriendAndPush(friend: Friend) {
    return new Promise(async (resolve, reject) => {
      if (!friend.friend_uid) {
        reject('NO_UID');
      }
      const docRef = doc(this.firestore, `users`, friend.friend_uid!);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('Document data:', docSnap.data());
        const userData = docSnap.data() as AppUser;
        friend.userData = userData;
        friend.userData.uid = docSnap.id;
        this.friends.push(friend);
        resolve(friend);
      } else {
        // docSnap.data() will be undefined in this case
        console.log('No such document!');
        reject('USER_NOT_FOUND');
      }
    });
  }

  initService(uid: string) {
    console.log('Init Friend Service...');
    const that = this;
    this.friends = [];
    const friendsCollectionRef = collection(
      this.firestore,
      `friends/${uid}/friend_list`
    );

    onSnapshot(friendsCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const friendModified = change.doc.data() as Friend;

          const foundIndex = this.friends.findIndex(
            (elt) => elt.friend_uid === friendModified.friend_uid
          );
          if (foundIndex >= 0) {
            const userData = this.friends[foundIndex].userData;
            friendModified.userData = userData;
            this.friends[foundIndex] = friendModified;
            this.friendsSubject.next(this.friends);
          }
        }
        if (change.type === 'added') {
          const friendAdded = change.doc.data() as Friend;
          friendAdded.friend_uid = change.doc.id;
          const foundIndex = this.friends.findIndex(
            (elt) => elt.friend_uid === friendAdded.friend_uid
          );
          if (foundIndex >= 0) {
            //Do nothing
          } else {
            const friend = change.doc.data() as Friend;
            friend.friend_uid = change.doc.id;
            console.log(friend);
            this.getFriendAndPush(friend)
              .then((resPromise) => {
                console.log('Friend Hydrated ', resPromise);
                that.friendsSubject.next(that.friends);
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }
        if (change.type === 'removed') {
          const friendRemoved = change.doc.data() as Friend;
          friendRemoved.friend_uid = change.doc.id;
          const foundIndex = this.friends.findIndex(
            (elt) => elt.friend_uid === friendRemoved.friend_uid
          );
          if (foundIndex >= 0) {
            this.friends.splice(foundIndex, 1);
          }
          this.friendsSubject.next(this.friends);
        }
      });
    });
  }

  async invite(membre: AppUser) {
    const uid = this.userSvc.userInfo?.uid || 'unknown';
    console.log(membre);
    //Check if membre has been blocked
    //this.friendService
    this.utils.showLoader();

    const myInviteData = {
      friend_uid: membre.uid,
      friendLastname: membre.lastname,
      friendFirstname: membre.firstname,
      friend_status: FriendStatus.INVITED,
      requestDate: new Date().getTime(),
    };
    await setDoc(
      doc(this.firestore, `friends/${uid}/friend_list`, membre.uid),
      myInviteData,
      { merge: true }
    );

    const hisSuggestionData = {
      friend_uid: uid,
      friendLastname: this.userSvc.userInfo?.lastname,
      friendFirstname: this.userSvc.userInfo?.firstname,
      friend_status: FriendStatus.SUGGESTED,
      requestDate: new Date().getTime(),
    };
    await setDoc(
      doc(this.firestore, `friends/${membre.uid}/friend_list`, uid),
      hisSuggestionData,
      { merge: true }
    );

    this.utils.hideLoader();
    //this.notificationSvc.sendInviteFriendNotif(membre.uid);
  }

  async addFriend(friend: AppUser) {
    const uid = this.userSvc.userInfo?.uid || 'unknown';

    updateDoc(doc(this.firestore, `friends/${uid}/friend_list/${friend.uid}`), {
      friend_status: FriendStatus.FRIEND,
      since: new Date().getTime(),
    });

    updateDoc(doc(this.firestore, `friends/${friend.uid}/friend_list/${uid}`), {
      friend_status: FriendStatus.FRIEND,
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
      query(friendCollectionRef, where('friend_uid', '==', uid))
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

  // getFriendStatus(friend_uid: string) {
  //   console.log('Get friend status with uid:', friend_uid);
  //   const foundIndex = this.friends.findIndex(
  //     (elt) => elt.friend_uid === friend_uid
  //   );
  //   if (foundIndex >= 0) {
  //     return this.friends[foundIndex].status;
  //   } else {
  //     return 'NOTFRIEND';
  //   }
  // }
}
