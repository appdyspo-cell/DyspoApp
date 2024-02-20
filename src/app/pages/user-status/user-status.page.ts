import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ActionSheetController,
  IonModal,
  ModalController,
  NavController,
} from '@ionic/angular';

import {
  AgendaDyspoItem,
  AgendaEvent,
  AgendaEventType,
  AppUser,
  Friend,
  FriendStatus,
  Notif,
  ShowHelper,
  UserDyspoStatus,
} from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';
import { OverlayEventDetail } from '@ionic/core/components';
import { UtilsService } from 'src/app/services/utils.service';
import { AgendaService } from 'src/app/services/agenda.service';
import { Observable, Subscription } from 'rxjs';
import {
  addHours,
  format,
  getDate,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  setHours,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { FriendsService } from 'src/app/services/friends.service';
import { App } from '@capacitor/app';
import { NavigationExtras } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { Preferences } from '@capacitor/preferences';
import { PictureComponent } from 'src/app/components/picture/picture.component';
import { HelperComponent } from 'src/app/components/helper/helper.component';

@Component({
  selector: 'app-user-status',
  templateUrl: './user-status.page.html',
  styleUrls: ['./user-status.page.scss'],
})
export class UserStatusPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  userInfo: AppUser | undefined;
  dyspoStatus = UserDyspoStatus;
  nextAgendaEvents: AgendaEvent[] = [];
  notifications: Notif[] = [];

  invitations: AgendaEvent[] = [];
  friendsSuggested: Friend[] = [];
  friends$!: Observable<Friend[]>;
  agendaEventsSubscription!: Subscription;
  agendaDysposSubscription!: Subscription;
  invitationsSubscription!: Subscription;
  friendsSubscrition!: Subscription;
  todayFormatted = format(new Date(), 'iiii dd MMMM yyyy', { locale: fr });
  todayDyspo!: AgendaDyspoItem;
  agendaEventType = AgendaEventType;
  showHelper = true;

  nb_notifications = 0;

  constructor(
    public userSvc: UserService,
    private modalCtrl: ModalController,
    private notificationsSvc: NotificationService,
    private agendaSvc: AgendaService,
    private friendService: FriendsService,
    public navCtrl: NavController,
    private actionSheetCtrl: ActionSheetController
  ) {
    this.fetchData();
    this.notificationsSvc.resetBadgeCount();
    // On Resume App
    App.addListener('resume', () => {
      if (this.agendaDysposSubscription)
        this.agendaDysposSubscription.unsubscribe();
      if (this.agendaDysposSubscription)
        this.agendaDysposSubscription.unsubscribe();
      this.todayFormatted = format(new Date(), 'iiii dd MMMM yyyy', {
        locale: fr,
      });

      this.notificationsSvc.resetBadgeCount();
      this.fetchData();
    });
  }

  fetchData() {
    this.friends$ = this.friendService.friends$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        this.nextAgendaEvents = agendaEvents.filter((agEvent) => {
          return isAfter(parseISO(agEvent.startISO), new Date());
        });

        this.nextAgendaEvents.sort((item1, item2) => {
          const date1 = parseISO(item1.startISO);
          const date2 = parseISO(item2.startISO);
          if (isBefore(date1, date2)) {
            return -1; // item1 doit être trié avant item2
          } else if (isAfter(date1, date2)) {
            return 1; // item1 doit être trié après item2
          } else {
            return 0; // les dates sont égales
          }
        });
        // console.log('Sort events', this.nextAgendaEvents);
      }
    );

    this.friendsSubscrition = this.friends$.subscribe((friends) => {
      this.friendsSuggested = friends.filter(
        (elt) => elt.friend_status === FriendStatus.SUGGESTED
      );
      this.friendsSuggested.forEach((friendSuggestion) => {
        console.log('Push notif ', friendSuggestion);
        const notif: Notif = {
          user_id: '',
          title: '',
          message: '',
          subject: '',
          create_at_ms: 0,
          create_at_ISO: '',
          status: '',
        };
        this.notifications.push(notif);
      });
    });

    this.invitationsSubscription =
      this.agendaSvc.agendaEventInvitations$.subscribe((invitations) => {
        this.invitations = invitations;
        this.invitations.sort((item1, item2) => {
          const date1 = parseISO(item1.startISO);
          const date2 = parseISO(item2.startISO);
          if (isBefore(date1, date2)) {
            return -1; // item1 doit être trié avant item2
          } else if (isAfter(date1, date2)) {
            return 1; // item1 doit être trié après item2
          } else {
            return 0; // les dates sont égales
          }
        });

        this.invitations = invitations.filter((ev) => {
          return isAfter(parseISO(ev.endISO), new Date().getTime());
        });

        this.invitations.forEach((invit) => {
          console.log('Push notif invit', invit);
          // this.notifications.push(notif);
        });

        this.nb_notifications = this.invitations.length;
      });

    this.agendaDysposSubscription = this.agendaSvc.agendaDyspos$.subscribe(
      (agendaDyspos) => {
        const today = new Date().getTime();

        const result = agendaDyspos.items.filter((item) => {
          return (
            item.day === getDate(today) &&
            item.month === getMonth(today) &&
            item.year === getYear(today)
          );
        });

        if (result?.length > 0) {
          this.todayDyspo = result[0];
        } else {
          this.todayDyspo = {
            time: today,
            userDyspo: UserDyspoStatus.UNDEFINED,
            month: getMonth(today),
            year: getYear(today),
            day: getDate(today),
          };
        }
      }
    );
  }

  async ngOnInit() {
    await Preferences.remove({
      key: ShowHelper.DASHBOARD,
    });
    const { value } = await Preferences.get({ key: ShowHelper.DASHBOARD });
    if (!value) {
      this.showHelper = true;
      const modal = await this.modalCtrl.create({
        component: HelperComponent,
        componentProps: {
          showHelper: ShowHelper.DASHBOARD,
        },
      });
      modal.present();

      await Preferences.set({
        key: ShowHelper.DASHBOARD,
        value: 'SHOWN',
      });
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    //this.modal.dismiss(this.name, 'confirm');
  }

  updateStatus(dyspoStatus: UserDyspoStatus) {
    this.modal.dismiss(dyspoStatus, 'confirm');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      console.log('Update dyspo');
      this.todayDyspo.userDyspo = ev.detail.data as UserDyspoStatus;
      this.agendaSvc.updateOrCreateDyspo(this.todayDyspo);
    }
  }

  async openAgendaEventInfo(agendaEvent: AgendaEvent) {
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent,
        isInvitation: false,
        isMulti: agendaEvent.is_multi,
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
    }
  }

  async openInvitation(agendaEvent: AgendaEvent) {
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent,
        isInvitation: true,
        isMulti: agendaEvent.is_multi,
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
      //this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!);
    }
  }

  async openCreateEventPerso() {
    const navigationExtras: NavigationExtras = {
      state: {
        tsDate: new Date().getTime(),
        is_multi: false,
      },
    };
    this.navCtrl.navigateForward(
      '/agenda/me/create-event/new',
      navigationExtras
    );
  }

  async openCreateEventDyspo() {
    const navigationExtras: NavigationExtras = {
      state: {
        tsDate: new Date().getTime(),
        is_multi: true,
        is_kids: false,
      },
    };
    this.navCtrl.navigateForward(
      '/agenda/me/create-event/new',
      navigationExtras
    );
  }

  async openCreateEventDyspoWithKids() {
    const navigationExtras: NavigationExtras = {
      state: {
        tsDate: new Date().getTime(),
        is_multi: true,
        is_kids: true,
      },
    };
    this.navCtrl.navigateForward(
      '/agenda/me/create-event/new',
      navigationExtras
    );
  }

  async openCreateEvent() {
    const buttons = [];
    buttons.push({
      text: 'Personnel',
      // cssClass: 'dyspo-sheet-dyspo',
      data: {
        is_multi: false,
      },
    });

    buttons.push({
      text: 'Groupe',
      //  cssClass: 'dyspo-sheet-dyspo-with-kids',
      data: {
        is_multi: true,
      },
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: "Saisissez le type de l' événement",
      cssClass: 'dyspo-sheet',
      buttons,
    });

    await actionSheet.present();

    let result = await actionSheet.onDidDismiss();
    if (result.data) {
      const navigationExtras: NavigationExtras = {
        state: {
          tsDate: new Date().getTime(),
          is_multi: result.data.is_multi,
        },
      };
      this.navCtrl.navigateForward(
        '/agenda/me/create-event/new',
        navigationExtras
      );
    }
  }

  openNotifications() {
    const navigationExtras: NavigationExtras = {
      state: {
        invitations: this.invitations,
      },
    };
    this.navCtrl.navigateForward('/notifications-list', navigationExtras);
  }
}
