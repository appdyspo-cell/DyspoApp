import { Injectable, NgZone } from '@angular/core';

import {
  AgendaEvent,
  AppUser,
  Chatroom,
  DiscussionType,
  NotifSubject,
} from '../models/models';
import { NavigationExtras, Router } from '@angular/router';
import { httpsCallable } from 'firebase/functions';
import { Functions } from '@angular/fire/functions';

import {
  Firestore,
  collection,
  doc,
  getDoc,
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
import { Device } from '@capacitor/device';
import { format, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AgendaEventInfoComponent } from '../components/agenda-event-info/agenda-event-info.component';
import { ModalController, NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

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
    private userSvc: UserService,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {}

  async initListeners() {
    console.log('NotificationService ---> initListeners');

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
          try {
            const data = actionPerformed.notification.data as any;
            console.log('data ' + JSON.stringify(data));

            const subject: NotifSubject = data['subject'];
            switch (subject) {
              case NotifSubject.AGENDA_EVENT:
                this.openEvent(data['info']);
                break;
              case NotifSubject.MESSAGE:
                this.goToChat(data['info']);
                break;
              case NotifSubject.INVITE:
                this.goToFriends();
                break;
            }
          } catch (err) {}
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
    Device.getInfo().then((res) => {
      if (res.platform !== 'web') {
        FirebaseMessaging.removeAllDeliveredNotifications();
      }
    });
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
          avatarPath = environment.DEFAULT_AVATAR_FB_PATH;
        }

        const message =
          this.userSvc.userInfo!.firstname +
          ' ' +
          this.userSvc.userInfo!.lastname +
          ' vous a demandé en ami';
        const f = httpsCallable(this.functions, 'test');

        f({
          message,
          subject: NotifSubject.INVITE,
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

  async sendInviteAgendaEvent(uids: string[], agendaEvent: AgendaEvent) {
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
        avatarPath = environment.DEFAULT_AVATAR_FB_PATH;
      }

      const message =
        this.userSvc.userInfo!.firstname +
        ' ' +
        this.userSvc.userInfo!.lastname +
        ' propose un événement ' +
        this.formatInvitMsg(agendaEvent);
      const f = httpsCallable(this.functions, 'test');

      f({
        message,
        subject: NotifSubject.AGENDA_EVENT,
        uids,
        tokens,
        info: agendaEvent.uid,
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
        avatarPath = environment.DEFAULT_AVATAR_FB_PATH;
      }

      const f = httpsCallable(this.functions, 'test');
      f({
        message,
        subject: NotifSubject.MESSAGE,
        uids,
        tokens,
        info: agendaEvent.uid,
        username: agendaEvent.title!,
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

  formatInvitMsg(agendaEvent: AgendaEvent): string {
    if (isSameDay(agendaEvent.start_date_ts, agendaEvent.end_date_ts)) {
      const display_date_1 =
        'le ' +
        format(parseISO(agendaEvent.startISO), 'iii dd MMM', {
          locale: fr,
        }) +
        ' à ' +
        format(parseISO(agendaEvent.startISO), 'HH:mm', {
          locale: fr,
        });
      return display_date_1;
    } else {
      const display_date_1 =
        'du ' +
        format(parseISO(agendaEvent.startISO), 'iii dd MMM HH:mm', {
          locale: fr,
        });
      const display_date_2 =
        'au ' +
        format(parseISO(agendaEvent.endISO), 'iii dd MMM HH:mm', {
          locale: fr,
        });
      return display_date_1 + ' ' + display_date_2;
    }
  }

  goToFriends() {
    const navigationExtras: NavigationExtras = {
      state: {
        isFromNotif: true,
      },
    };
    this.navCtrl.navigateForward('/friends', navigationExtras);
  }

  async goToChat(agendaEventUid: string) {
    const docSnap = await getDoc(
      doc(this.firestore, `agenda_events/`, agendaEventUid)
    );
    if (docSnap.exists()) {
      const eventFetched = docSnap.data() as AgendaEvent;
      const navigationExtras: NavigationExtras = {
        state: {
          agendaEvent: eventFetched,
          discussionType: DiscussionType.ACTIVE,
        },
      };
      this.navCtrl.navigateForward('/group-chatting', navigationExtras);
    }
  }

  async openEvent(agendaEventUid: any) {
    const docSnap = await getDoc(
      doc(this.firestore, `agenda_events/`, agendaEventUid)
    );
    if (docSnap.exists()) {
      const eventFetched = docSnap.data() as AgendaEvent;
      const modal = await this.modalCtrl.create({
        component: AgendaEventInfoComponent,
        componentProps: {
          agendaEvent: eventFetched,
          isInvitation: true,
          isMulti: eventFetched.is_multi,
        },
      });
      modal.present();

      const { data, role } = await modal.onWillDismiss();

      console.log(data);
      if (role === 'confirm') {
      }
    }
  }
}
