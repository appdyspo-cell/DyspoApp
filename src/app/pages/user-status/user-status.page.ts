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
  todayFormatted = format(new Date(), 'iii dd MMM yyyy', { locale: fr });
  todayDyspo!: AgendaDyspoItem;
  agendaEventType = AgendaEventType;

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
      this.todayFormatted = format(new Date(), 'iii dd MMM yyyy', {
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
        console.log('User Status -> get Agenda Events', agendaEvents);

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
      }
    );

    this.friendsSubscrition = this.friends$.subscribe((friends) => {
      this.friendsSuggested = friends.filter(
        (elt) => elt.friend_status === FriendStatus.SUGGESTED
      );
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

  ngOnInit() {
    //this.loadInfos();
  }

  // loadInfos() {
  //   console.log('loadINFOS');

  //   this.userInfo = this.userSvc.userInfo;
  //   this.notifications = [
  //     {
  //       message: 'Demande en Ami',
  //       title: 'Ami',
  //       user_id: '',
  //       create_at_ISO: '',
  //       create_at_ms: 343434,
  //       status: 'dsf',
  //       subject: 'dfsdf',
  //     },
  //     {
  //       message: 'Paul vous invite à un évènement',
  //       title: 'Evt',
  //       user_id: '',
  //       create_at_ISO: '',
  //       create_at_ms: 343434,
  //       status: 'dsf',
  //       subject: 'dfsdf',
  //     },
  //   ];
  // }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    //this.modal.dismiss(this.name, 'confirm');
  }

  updateStatus(dyspoStatus: UserDyspoStatus) {
    this.modal.dismiss(dyspoStatus, 'confirm');
  }

  // TODO check why Agenda not updatae when changing Dyspo
  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      console.log('Update dyspo');
      this.todayDyspo.userDyspo = ev.detail.data as UserDyspoStatus;
      this.agendaSvc.updateOrCreateDyspo(this.todayDyspo);

      // if (ev.detail.data !== this.userInfo!.dyspoStatus) {
      //   //this.message = `Hello, ${ev.detail.data}!`;
      //   console.log(`Update status, ${ev.detail.data}!`);
      //   this.userInfo!.dyspoStatus = ev.detail.data as UserDyspoStatus;
      //   const userInfoClone = Object.assign({}, this.userInfo) as AppUser;
      //   this.userSvc
      //     .updateUser(userInfoClone)
      //     .then(() => {
      //       this.utils.showToastSuccess('Le status a été mis à jour');
      //     })
      //     .catch((err) => {
      //       this.utils.showToastError(err);
      //     });
      // }
    }
  }

  async openAgendaEventInfo(agendaEvent: AgendaEvent) {
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent,
        isInvitation: false,
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
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
      //this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!);
    }
  }

  async openCreateEvent() {
    const todayMorning = setHours(new Date(), 0);
    console.log();
    // if (isBefore(new Date(addHours(new Date().getTime(), 1)), todayMorning)) {
    //   this.utils.showAlert(
    //     'Vous ne pouvez pas creer un evenement dans le passé'
    //   );
    //   return;
    // }

    const buttons = [];
    buttons.push({
      text: 'Personnel',
      cssClass: 'dyspo-sheet-dyspo',
      data: {
        is_multi: false,
      },
    });

    buttons.push({
      text: 'Groupe',
      cssClass: 'dyspo-sheet-dyspo-with-kids',
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
}
