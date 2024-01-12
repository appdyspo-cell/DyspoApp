import { Injectable, NgZone } from '@angular/core';

import {
  AgendaEvent,
  AppUser,
  Chatroom,
  NotifSubjects,
} from '../models/models';
import { NavigationExtras, Router } from '@angular/router';
import { httpsCallable } from 'firebase/functions';
import { Functions } from '@angular/fire/functions';

import {
  Firestore,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { UserService } from './user.service';
import {
  FirebaseMessaging,
  GetTokenOptions,
  NotificationActionPerformedEvent,
  NotificationReceivedEvent,
  Notification,
} from '@capacitor-firebase/messaging';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications: Notification[] = [];
  uid: any;
  constructor(
    private firestore: Firestore,
    private router: Router,
    private zone: NgZone,
    private functions: Functions,
    private utils: UtilsService,
    private userSvc: UserService
  ) {}

  async initListeners() {
    console.log('NotificationService ---> initListeners');
    // FirebaseMessaging.addListener('registration', (data) => {
    //   // alert(JSON.stringify(data));
    //   console.log('Registration OK : Good token');
    //   console.log(data.value);
    //   this.registerToken(this.uid, data.value);
    // });

    const { token } = await FirebaseMessaging.getToken();

    if (!token) {
      console.log('ERR NotificationService ---> getToken() null');
    } else {
      this.registerToken(this.uid, token);
      FirebaseMessaging.addListener(
        'notificationReceived',
        (event: NotificationReceivedEvent) => {
          console.log('notification ' + JSON.stringify(event.notification));
          this.zone.run(() => {
            this.notifications.push(event.notification);
          });
        }
      );
      FirebaseMessaging.addListener(
        'notificationActionPerformed',
        (actionPerformed: NotificationActionPerformedEvent) => {
          console.log(
            'data ' + JSON.stringify(actionPerformed.notification.data)
          );
          //this.goToChat(actionPerformed.notification.data.friend_uid);
        }
      );
    }
  }

  public initService(uid: string) {
    this.uid = uid;
    this.initListeners();
    FirebaseMessaging.requestPermissions().then((response) => {
      if (response.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        // PushNotifications.register().then((res) => {
        //   console.log(res);
        // });
      } else {
        // Show some error
        alert('err');
      }
    });
  }

  public async registerToken(uid: string, token: string) {
    const userCollectionRef = collection(this.firestore, 'users');
    const q = query(userCollectionRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const ref = querySnapshot.docs[0].ref;
      updateDoc(ref, { notificationToken: token });
    }
  }

  public async deleteToken(uid: string) {
    // Remove FCM instance
    FirebaseMessaging.removeAllListeners()
      .then((res) => {
        console.log('FirebaseMessaging.removeAllListeners()->', res);
      })
      .catch((err) => {
        console.log('Error FirebaseMessaging.removeAllListeners()->', err);
      });

    const userCollectionRef = collection(this.firestore, 'users');

    // Create a query against the collection.
    const q = query(userCollectionRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const ref = querySnapshot.docs[0].ref;
      updateDoc(ref, { notificationToken: '' });
    }
    //const user = querySnapshot.docs[0].data;
    //const uid = querySnapshot.docs[0].id;

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, ' => ', doc.data());
    });
  }

  resetBadgeCount() {
    FirebaseMessaging.removeAllDeliveredNotifications();
  }

  goToChat(friend_uid: string) {
    console.log('goToChat', friend_uid);
    const navigationExtras: NavigationExtras = {
      state: {
        friend_uid,
      },
    };
    this.router.navigate(['chatroom'], navigationExtras);
  }

  async sendInviteFriendNotif(friend_uid: string) {
    if (!this.userSvc.userInfo) return;
    // Send notification
    console.log('Check to send notif or not');

    const q = query(
      collection(this.firestore, 'users'),
      where('uid', '==', friend_uid)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const ref = querySnapshot.docs[0].ref;
      const friendUser = querySnapshot.docs[0].data() as AppUser;
      if (
        friendUser.notificationToken &&
        friendUser.appSettings?.friendInvitation
      ) {
        let avatarPath = this.userSvc.userInfo!.avatarPath;

        if (!avatarPath?.startsWith('http')) {
          avatarPath =
            'https://firebasestorage.googleapis.com/v0/b/dyspo-stg.appspot.com/o/avatarsStorage%2Fuser.png?alt=media&token=048bd715-8f53-4fbf-866a-84335b158a89';
        }

        const message =
          this.userSvc.userInfo!.firstname +
          ' ' +
          this.userSvc.userInfo!.lastname +
          ' vous a demandé en ami';
        const f = httpsCallable(this.functions, 'test');

        f({
          message,
          subject: NotifSubjects.INVITE,
          tokens: [friendUser.notificationToken],
          uids: [friend_uid],
          username:
            this.userSvc.userInfo!.firstname +
            ' ' +
            this.userSvc.userInfo!.lastname,
          avatarPath,
        })
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  }

  async sendInviteAgendaEvent(uids: string[]) {
    if (!this.userSvc.userInfo) return;
    // Send notification
    console.log('Check to send notif or not');
    uids = uids.filter((uid) => {
      return uid !== this.userSvc.userInfo!.uid;
    });
    const q = query(
      collection(this.firestore, 'users'),
      where('uid', 'in', uids)
    );
    const querySnapshots = await getDocs(q);
    if (!querySnapshots.empty) {
      const tokens: string[] = [];
      querySnapshots.forEach((snapshot) => {
        const user = snapshot.data() as AppUser;
        if (user.appSettings?.eventInvitation && user.notificationToken) {
          tokens.push(user.notificationToken);
        }
      });

      if (tokens.length === 0) return;

      let avatarPath = this.userSvc.userInfo!.avatarPath;
      if (!avatarPath?.startsWith('http')) {
        avatarPath =
          'https://firebasestorage.googleapis.com/v0/b/dyspo-stg.appspot.com/o/avatarsStorage%2Fuser.png?alt=media&token=048bd715-8f53-4fbf-866a-84335b158a89';
      }
      const message =
        this.userSvc.userInfo!.firstname +
        ' ' +
        this.userSvc.userInfo!.lastname +
        ' propose un évenement';
      const f = httpsCallable(this.functions, 'test');
      f({
        message,
        subject: NotifSubjects.AGENDA_EVENT,
        uids,
        tokens,
        username:
          this.userSvc.userInfo!.firstname +
          ' ' +
          this.userSvc.userInfo!.lastname,
        avatarPath,
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  async sendMessageInGroup(event_uid: string, message: string) {
    if (!this.userSvc.userInfo) return;
    // Send notification
    console.log('Check to send notif or not');

    //Get event for real time infos
    const q1 = query(
      collection(this.firestore, 'agenda_events'),
      where('uid', '==', event_uid)
    );
    const snaps = await getDocs(q1);
    if (snaps.empty) {
      return;
    }
    const agendaEvent: AgendaEvent = snaps.docs[0].data() as AgendaEvent;
    let uids = agendaEvent.members_uid;

    uids = uids.filter((member_uid) => {
      const isOtherId = member_uid !== this.userSvc.userInfo!.uid;
      let isActiveNotifications = false;

      if (member_uid !== this.uid) {
        if (agendaEvent['user_' + member_uid]) {
          const chatroom = agendaEvent['user_' + member_uid] as Chatroom;
          isActiveNotifications = chatroom.isNotifications;
        }
      }

      return isOtherId && isActiveNotifications;
    });

    if (uids.length === 0) {
      console.log('No notif to send');
      return;
    }
    const q = query(
      collection(this.firestore, 'users'),
      where('uid', 'in', uids)
    );
    const querySnapshots = await getDocs(q);
    if (!querySnapshots.empty) {
      const tokens: string[] = [];
      querySnapshots.forEach((snapshot) => {
        const user = snapshot.data() as AppUser;
        if (user.appSettings?.receiveNotification && user.notificationToken) {
          console.log('Send notif to', user.firstname);
          tokens.push(user.notificationToken);
        }
      });

      if (tokens.length === 0) return;

      let avatarPath = this.userSvc.userInfo!.avatarPath;
      if (!avatarPath?.startsWith('http')) {
        avatarPath =
          'https://firebasestorage.googleapis.com/v0/b/dyspo-stg.appspot.com/o/avatarsStorage%2Fuser.png?alt=media&token=048bd715-8f53-4fbf-866a-84335b158a89';
      }

      const f = httpsCallable(this.functions, 'test');
      f({
        message,
        subject: NotifSubjects.MESSAGE,
        uids,
        tokens,
        info: '{agendaEvent : }' + agendaEvent.uid,
        username:
          this.userSvc.userInfo!.firstname +
          ' ' +
          this.userSvc.userInfo!.lastname,
        avatarPath,
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
}
