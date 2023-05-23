import { Injectable, NgZone } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppUser, NotifSubjects } from '../models/models';
import { NavigationExtras, Router } from '@angular/router';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Functions } from '@angular/fire/functions';

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
} from '@capacitor/push-notifications';
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

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications: PushNotificationSchema[] = [];
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
    PushNotifications.addListener('registration', (data) => {
      // alert(JSON.stringify(data));
      console.log('Registration OK : Good token');
      console.log(data.value);
      this.registerToken(this.uid, data.value);
    });
    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      alert('Error on registration: ' + JSON.stringify(error));
    });
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('notification ' + JSON.stringify(notification));
        this.zone.run(() => {
          this.notifications.push(notification);
        });
      }
    );
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (actionPerformed: ActionPerformed) => {
        console.log(
          'data ' + JSON.stringify(actionPerformed.notification.data)
        );
        this.goToChat(actionPerformed.notification.data.friend_uid);
      }
    );
  }

  public initPermissions(uid: string) {
    this.uid = uid;
    this.initListeners();
    PushNotifications.requestPermissions().then((response) => {
      if (response.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register().then((res) => {
          console.log(res);
        });
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
    /*FCM.deleteInstance()
    .then(() => console.log(`Token deleted`))
    .catch((err) => console.log(err));*/
    PushNotifications.removeAllListeners()
      .then((res) => {
        console.log('PushNotifications.removeAllListeners()->', res);
      })
      .catch((err) => {
        console.log('Error PushNotifications.removeAllListeners()->', err);
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
    PushNotifications.removeAllDeliveredNotifications();
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
        friendUser.appSettings?.receiveNotification
      ) {
        if (this.userSvc.userInfo) {
          const avatarPath = this.userSvc.userInfo.avatarPath;

          const message =
            this.userSvc.userInfo.firstname +
            ' ' +
            this.userSvc.userInfo.lastname +
            ' vous a demandé en ami';
          const f = httpsCallable(this.functions, 'sendNotification');
          f({
            message,
            subject: NotifSubjects.INVITE,
            token: friendUser.notificationToken,
            username:
              this.userSvc.userInfo.firstname +
              ' ' +
              this.userSvc.userInfo.lastname,
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
  }
}
