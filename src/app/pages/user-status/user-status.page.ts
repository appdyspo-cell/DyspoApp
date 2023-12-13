import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, ModalController } from '@ionic/angular';
import { UserStatusComponent } from 'src/app/components/user-status/user-status.component';
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
  format,
  getDate,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { FriendsService } from 'src/app/services/friends.service';

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
  friends$: Observable<Friend[]>;
  agendaEventsSubscription: Subscription;
  agendaDysposSubscription: Subscription;
  invitationsSubscription: Subscription;
  friendsSubscrition: Subscription;
  todayFormatted = format(new Date(), 'iii dd MMM yyyy', { locale: fr });
  todayDyspo!: AgendaDyspoItem;
  agendaEventType = AgendaEventType;

  constructor(
    public userSvc: UserService,
    private modalCtrl: ModalController,
    private utils: UtilsService,
    private agendaSvc: AgendaService,
    private friendService: FriendsService
  ) {
    this.friends$ = this.friendService.friends$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        console.log('User Status -> get Agenda Events', agendaEvents);

        this.nextAgendaEvents = agendaEvents.filter((agEvent) => {
          return isAfter(parseISO(agEvent.startISO), new Date());
        });

        //this.tagCalendarUserDyspoData();
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

  openStatus() {
    this.modalCtrl
      .create({
        component: UserStatusComponent,
        cssClass: 'transparent-modal',
      })
      .then((modal) => {
        modal.present();
      });
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
}
