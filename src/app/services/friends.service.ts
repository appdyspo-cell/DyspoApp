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
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import {
  AppDeviceContact,
  AppUser,
  Friend,
  FriendGroup,
  FriendStatus,
  UserStatus,
} from '../models/models';
import { UtilsService } from './utils.service';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Database } from '@angular/fire/database';
import { LoggerService } from './logger.service';
import { ContactPayload, Contacts } from '@capacitor-community/contacts';
import { environment } from 'src/environments/environment';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  public friends: Friend[] = [];
  public friendGroups: FriendGroup[] = [];
  //public friendsSuggested: Friend[] = [];
  public friendsSubject = new BehaviorSubject<Friend[]>([]);
  public friendGroupsSubject = new BehaviorSubject<FriendGroup[]>([]);

  public friends$!: Observable<Friend[]>;
  public friendGroups$!: Observable<FriendGroup[]>;
  public friendsSuggested$!: Observable<Friend[]>;
  onSnapshotFriendGroupsCancel!: import('@angular/fire/firestore').Unsubscribe;
  onSnapshotFriendsCancel!: import('@angular/fire/firestore').Unsubscribe;

  //Contacts
  public contacts: ContactPayload[] = [];
  public appContacts: AppDeviceContact[] = [];
  public appContactsGrouped: {
    letter: string;
    contacts: AppDeviceContact[];
  }[] = [];

  constructor(
    private firestore: Firestore,
    private utils: UtilsService,
    private userSvc: UserService,
    private logger: LoggerService,
    private notificationSvc: NotificationService
  ) {
    this.friends$ = this.friendsSubject.asObservable();
    this.friendGroups$ = this.friendGroupsSubject.asObservable();

    App.addListener('resume', () => {
      if (this.userSvc.userInfo?.uid) {
        this.unsubscribeAllAfterLogoutEvent();
        this.initService(this.userSvc.userInfo?.uid);
        this.initContacts();
      }
    });
  }

  async unblockFriend(friend: Friend) {
    return new Promise(async (resolve, reject) => {
      // Update my list of friends
      const uid = this.userSvc.userInfo?.uid;
      const docRef = doc(
        this.firestore,
        `friends/${uid}/friend_list/${friend.friend_uid}`
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
        // console.log('Document data:', docSnap.data());
        const userData = docSnap.data() as AppUser;
        friend.userData = userData;
        friend.userData.uid = docSnap.id;
        this.friends.push(friend);
        resolve(friend);
      } else {
        // docSnap.data() will be undefined in this case !
        console.log('No such document!');
        reject('USER_NOT_FOUND');
      }
    });
  }

  initService(uid: string) {
    console.log('Init Friend Service...');
    const that = this;
    this.friends = [];
    this.friendGroups = [];
    const friendsCollectionRef = collection(
      this.firestore,
      `friends/${uid}/friend_list`
    );
    const friendGroupsCollectionRef = collection(
      this.firestore,
      `friend_groups/${uid}/friend_group_list`
    );
    // Pas pour ici, mais pour les discussion par ex
    //const queryFriendGroups = query(friendGroupsCollectionRef, where("members_uid", "array-contains", uid));

    this.onSnapshotFriendsCancel = onSnapshot(
      friendsCollectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log('Friend has modifsied', change);
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

              this.getFriendAndPush(friend)
                .then((resPromise) => {
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
      }
    );

    // Friend Groups
    this.onSnapshotFriendGroupsCancel = onSnapshot(
      friendGroupsCollectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const friendGroupFetched = change.doc.data() as FriendGroup;
          let foundIndex = this.friendGroups.findIndex((elt) => {
            return elt.uid === friendGroupFetched.uid;
          });
          if (change.type === 'modified' && foundIndex > -1) {
            this.friendGroups[foundIndex] = friendGroupFetched;
            this.friendGroupsSubject.next(this.friendGroups);
          }
          if (change.type === 'added' && foundIndex < 0) {
            this.friendGroups.push(friendGroupFetched);
            this.friendGroupsSubject.next(this.friendGroups);
          }
          if (change.type === 'removed') {
            const foundIndex = this.friendGroups.findIndex(
              (elt) => elt.uid === friendGroupFetched.uid
            );
            if (foundIndex >= 0) {
              this.friendGroups.splice(foundIndex, 1);
            }
            this.friendGroupsSubject.next(this.friendGroups);
          }
        });
      }
    );
  }

  isMyFriend(uid: string): boolean {
    const my_uid = this.userSvc.userInfo?.uid || 'unknown';
    const myFriendsUids = this.friends.map((friend) => friend.friend_uid);
    if (my_uid !== uid) {
      return myFriendsUids.includes(uid);
    } else {
      return true;
    }
  }

  getFriendStatus(uid: string): FriendStatus {
    const foundIndex = this.friends.findIndex((f) => {
      return f.friend_uid === uid;
    });
    if (foundIndex > -1) {
      return this.friends[foundIndex].friend_status!;
    } else {
      return FriendStatus.NOFRIEND;
    }
  }

  async getUserStatus(uid: string): Promise<UserStatus | undefined> {
    const docRef = doc(this.firestore, `users`, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const user = docSnap.data() as AppUser;
      return user.status;
    }
    return undefined;
  }

  async invite(membre: AppUser, showToast = false): Promise<boolean> {
    try {
      const uid = this.userSvc.userInfo?.uid || 'unknown';
      //Check if membre has been blocked or deleted

      const userSatus = await this.getUserStatus(membre.uid);
      if (userSatus === UserStatus.DELETED) {
        this.utils.showToastError('Ce compte a été supprimé');
        return false;
      }
      if (userSatus === UserStatus.BANNED) {
        this.utils.showToastError('Ce compte a été suspendu');
        return false;
      }
      if (!userSatus) {
        this.utils.showToastError("Ce compte n'existe pas");
        return false;
      }
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

      //this.utils.hideLoader();
      if (showToast) this.utils.showToastSuccess('Invitation envoyée');
      this.notificationSvc.sendInviteFriendNotif(membre.uid);
      return true;
    } catch (err: any) {
      //this.utils.hideLoader();
      this.utils.showToastError('Erreur');
      return false;
    }
  }

  async inviteFromDeviceContact(contact: AppDeviceContact, showToast = false) {
    try {
      const uid = this.userSvc.userInfo?.uid || 'unknown';
      console.log(contact);
      //Check if membre has been blocked
      //this.friendService
      //this.utils.showLoader();

      const myInviteData = {
        friend_uid: contact.uid,
        friendLastname: contact.display,
        friendFirstname: contact.initials,
        friend_status: FriendStatus.INVITED,
        requestDate: new Date().getTime(),
      };
      await setDoc(
        doc(this.firestore, `friends/${uid}/friend_list`, contact.uid!),
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
        doc(this.firestore, `friends/${contact.uid}/friend_list`, uid),
        hisSuggestionData,
        { merge: true }
      );

      //this.utils.hideLoader();
      if (showToast) this.utils.showToastSuccess('Invitation envoyée');
      this.notificationSvc.sendInviteFriendNotif(contact.uid!);
      return true;
    } catch (err: any) {
      //this.utils.hideLoader();
      this.utils.showToastError('Erreur');
      return false;
    }
  }

  async addFriend(friend: Friend) {
    console.log('Add friend');
    const uid = this.userSvc.userInfo?.uid || 'unknown';

    updateDoc(
      doc(this.firestore, `friends/${uid}/friend_list/${friend.friend_uid}`),
      {
        friend_status: FriendStatus.FRIEND,
        since: new Date().getTime(),
      }
    );

    updateDoc(
      doc(this.firestore, `friends/${friend.friend_uid}/friend_list/${uid}`),
      {
        friend_status: FriendStatus.FRIEND,
        since: new Date().getTime(),
      }
    );

    // Send notif ?
    // this.notification-service.sendConfirmFriend()
  }

  async saveFriendGroup(friendGroup: FriendGroup) {
    const uid = this.userSvc.userInfo?.uid || 'unknown';
    // Check each member is my friend
    const members: string[] = [];
    friendGroup.members_uid.forEach((member) => {
      if (this.isMyFriend(member)) {
        members.push(member);
      } else {
        this.utils.showToastError("Une erreur s'est produite");
        this.logger.sendLog(
          member +
            ' is not a friend of mine. Can not attach to group ' +
            friendGroup.label,
          'saveFriendGroup',
          this.userSvc.userInfo?.uid || 'unknown'
        );
      }
    });

    if (members.length === 0) {
      this.utils.showToastError(
        "Une erreur s'est produite. Votre liste ne peut pas être vide"
      );
    } else {
      friendGroup.members_uid = members;
      setDoc(
        doc(
          this.firestore,
          `friend_groups/${uid}/friend_group_list`,
          friendGroup.uid!
        ),
        friendGroup
      );
    }
  }

  async updateFriendGroup(friendGroup: FriendGroup) {
    const uid = this.userSvc.userInfo?.uid || 'unknown';
    const friendGroupClone: any = { ...friendGroup };
    //delete appUserClone.id;
    const ref = doc(
      this.firestore,
      `friend_groups/${uid}/friend_group_list/${friendGroupClone.uid}`
    );
    return updateDoc(ref, friendGroupClone);
  }

  async deleteFriend(friend: Friend, listElement: any) {
    console.log('delete friend');
    const uid = this.userSvc.userInfo?.uid;
    const batch = writeBatch(this.firestore);
    // Remove invitation in my collection
    batch.delete(
      doc(this.firestore, `friends/${uid}/friend_list/${friend.friend_uid}`)
    );
    // Remove invitation in his collection
    batch.delete(
      doc(this.firestore, `friends/${friend.friend_uid}/friend_list/${uid}`)
    );

    batch.commit();

    await runTransaction(this.firestore, async (transaction) => {
      const mygroups_snapshots = await getDocs(
        query(
          collection(this.firestore, `friend_groups/${uid}/friend_group_list`),
          where('members_uid', 'array-contains', friend.friend_uid)
        )
      );
      const hisgroups_snapshots = await getDocs(
        query(
          collection(
            this.firestore,
            `friend_groups/${friend.friend_uid}/friend_group_list`
          ),
          where('members_uid', 'array-contains', uid)
        )
      );

      // Remove friend from my groups
      mygroups_snapshots.forEach((snap) => {
        const group = snap.data() as FriendGroup;
        const updateMembers = group.members_uid.splice(
          group.members_uid.indexOf(friend.friend_uid!),
          1
        );

        transaction.update(snap.ref, { members_uid: group.members_uid });
      });

      // Remove friend from his groups
      hisgroups_snapshots.forEach((snap) => {
        const group = snap.data() as FriendGroup;
        const updateMembers = group.members_uid.splice(
          group.members_uid.indexOf(uid!),
          1
        );

        transaction.update(snap.ref, { members_uid: group.members_uid });
      });
    });
  }

  async deleteFriendGroup(friendGroup: FriendGroup, listElement: any) {
    const uid = this.userSvc.userInfo?.uid;
    await deleteDoc(
      doc(
        this.firestore,
        `friend_groups/${uid}/friend_group_list/${friendGroup.uid}`
      )
    );
  }

  unsubscribeAllAfterLogoutEvent() {
    try {
      this.onSnapshotFriendsCancel();
      this.onSnapshotFriendGroupsCancel();
      this.friends = [];
      this.friendGroups = [];
      this.friendGroupsSubject.next(this.friendGroups);
      this.friendsSubject.next(this.friends);
      this.appContactsGrouped = [];
      this.contacts = [];
      this.appContacts = [];
    } catch (err) {
      //console.log('Can not unsubscribe ', err);
    }
  }

  groupContactsByAlphabet(contacts: AppDeviceContact[]) {
    const groups: any = {};
    contacts.forEach((contact) => {
      const letter = contact.display.charAt(0).toUpperCase();
      groups[letter] = groups[letter] || [];
      groups[letter].push(contact);
    });
    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        contacts: groups[letter].sort(
          (a: AppDeviceContact, b: AppDeviceContact) =>
            a.display.localeCompare(b.display)
        ),
      }));
  }

  async initContacts() {
    const result = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
      },
    });

    // const res = (await this.userSvc.getMartinContacts()) as any;
    // const martinContacts = [];

    // for (let contact of res.data.contacts) {
    //   contact = JSON.parse(contact);
    //   martinContacts.push(contact);
    // }

    // console.log(martinContacts);

    for (const contact of result.contacts) {
      //for (const contact of this.dbContacts) {
      try {
        if (!contact.name?.display?.startsWith('.')) {
          let canAdd = false;
          let appContact: AppDeviceContact = {
            uid: undefined,
            phone_number: '',
            is_member: undefined,
            is_my_friend: undefined,
            display: 'unknown',
            initials: '',
            avatar: undefined,
            contactId: contact.contactId,
          };

          if (contact.name?.display) {
            if (contact.name.display.length === 0) {
              canAdd = false;
            } else if (contact.name.display.length === 1) {
              canAdd = true;
              appContact.display = contact.name?.display;
              appContact.initials = contact.name.display.toUpperCase();
            } else if (contact.name.display.length > 1) {
              canAdd = true;
              appContact.display = contact.name.display;
              appContact.initials =
                contact.name?.display[0]?.toUpperCase() +
                contact.name?.display[1]?.toUpperCase();
            }
          } else {
            canAdd = false;
          }

          let number = contact.phones?.[0]?.number;
          if (number && canAdd) {
            //Initials
            if (
              contact.name?.family &&
              contact.name.given &&
              contact.name.given.length > 0 &&
              contact.name.family.length > 0
            ) {
              appContact.initials =
                contact.name?.given[0].toUpperCase() +
                contact.name?.family[0].toUpperCase();
            }

            let chiffresTrouves = number.match(/[0-9]/g);
            if (chiffresTrouves) {
              number = chiffresTrouves.join('');
              if (number.trim().length >= 9) {
                number = number.trim().slice(-9);
                appContact.phone_number = number;

                this.appContacts.push(appContact);
              }
            }
          }
        } else {
          console.log('Skip contact ', contact);
        }
      } catch (err: any) {
        console.error(err);
        this.logger.sendError(
          err,
          'fetchContactsData',
          this.userSvc.userInfo?.uid!
        );
      }
    }
    console.log('appContacts', this.appContacts);
    this.appContactsGrouped = this.groupContactsByAlphabet(this.appContacts);

    console.log('My Contacts Grouped ', this.appContactsGrouped);

    //Send debug data
    if (environment.sendDebugData) {
      const debug_data = [];
      for (const contact of result.contacts) {
        debug_data.push(JSON.stringify(contact));
      }
      this.logger.sendDebugData({
        msg: 'Contacts for ' + this.userSvc.userInfo?.uid,
        data: {
          contacts: JSON.stringify(result.contacts),
          contactsGrouped: JSON.stringify(this.appContactsGrouped),
        },
        //dataString: JSON.stringify(debug_data),
        user_id: this.userSvc.userInfo?.uid,
      });
    }
  }
}
