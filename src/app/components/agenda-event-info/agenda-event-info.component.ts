import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NavigationExtras } from '@angular/router';
import {
  AlertController,
  ModalController,
  NavController,
} from '@ionic/angular';
import { format, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AgendaEvent,
  AgendaEventType,
  AppUser,
  AppUserWithEvents,
  FriendStatus,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agenda-event-info',
  templateUrl: './agenda-event-info.component.html',
  styleUrls: ['./agenda-event-info.component.scss'],
})
export class AgendaEventInfoComponent implements OnInit {
  @Output() outevt = new EventEmitter<string>();
  @Input() agendaEvent!: AgendaEvent;
  @Input() isInvitation!: boolean;
  @ViewChild('popovermenu') popoverMenu: any;
  @ViewChild('popoverUserEvents') popoverUserEvents: any;

  UserDyspoStatus = UserDyspoStatus;
  FriendStatus = FriendStatus;
  agendaEventType = AgendaEventType;
  members_presence_confirmed: AppUserWithEvents[] = [];
  members_presence_not_confirmed: AppUserWithEvents[] = [];
  new_admin_candidates: AppUser[] = [];
  admin: AppUser | undefined;
  modalNewAdminOpened = false;
  isPopoverOpen = false;
  isPopoverUserEventsOpen = false;
  allowEdit = false;
  isSoloEvent!: boolean;
  selectedUserEvents: AgendaEvent[] | undefined;
  defaultImage = 'assets/logo.svg';
  members_loaded: boolean;
  eventTypeLabel = '';
  my_dyspoStatus: UserDyspoStatus | undefined;
  my_agendaEvents: AgendaEvent[] = [];
  my_agendaEvents_label = '';
  my_dyspoStatus_label = '';
  display_date_1: string | undefined;
  display_date_2: string | undefined;
  selectedUser: AppUserWithEvents | undefined;
  selectedUserFriendStatus: FriendStatus | undefined;
  selectedUserFriendStatusLabel = '';

  constructor(
    private modalCtrl: ModalController,
    private agendaSvc: AgendaService,
    public userSvc: UserService,
    private alertCtrl: AlertController,
    private utils: UtilsService,
    private navCtrl: NavController,
    private friendsSvc: FriendsService,
    private ngZone: NgZone
  ) {
    this.members_loaded = false;
  }

  async ngOnInit() {
    console.log(this.agendaEvent);
    switch (this.agendaEvent.type) {
      case AgendaEventType.KIDS:
        this.eventTypeLabel = 'Kid(s)';
        break;
      case AgendaEventType.NOKIDS:
        this.eventTypeLabel = 'NoKid(s)';
        break;
      case AgendaEventType.FREE:
        this.eventTypeLabel = 'Kid(s) ou NoKid(s)';
        break;
    }
    this.members_loaded = false;
    this.allowEdit =
      this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid ||
      this.agendaEvent.all_can_edit;

    this.isSoloEvent =
      this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid &&
      this.agendaEvent.members_invited_uid.length === 0 &&
      this.agendaEvent.members_uid.length === 1;

    //Display dates
    if (
      isSameDay(this.agendaEvent.start_date_ts, this.agendaEvent.end_date_ts)
    ) {
      this.display_date_1 =
        'Le ' +
        format(parseISO(this.agendaEvent.startISO), 'iii dd MMM', {
          locale: fr,
        }) +
        ' à ' +
        format(parseISO(this.agendaEvent.startISO), 'HH:mm', {
          locale: fr,
        });
    } else {
      this.display_date_1 =
        'Du ' +
        format(parseISO(this.agendaEvent.startISO), 'iii dd MMM HH:mm', {
          locale: fr,
        });
      this.display_date_2 =
        'Au ' +
        format(parseISO(this.agendaEvent.endISO), 'iii dd MMM HH:mm', {
          locale: fr,
        });
    }
    // Get members info
    console.log('agenda ev', this.agendaEvent);
    this.members_presence_not_confirmed = await this.userSvc.getUserInfos(
      this.agendaEvent!.members_invited_uid
    );

    this.members_presence_confirmed = await this.userSvc.getUserInfos(
      this.agendaEvent!.members_uid
    );

    //setTimeout(() => {
    this.members_loaded = true;
    //}, 500);

    // New Admin candidates
    if (this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid) {
      this.admin = this.userSvc.userInfo;
      this.new_admin_candidates = this.members_presence_confirmed.filter(
        (m) => {
          return m.uid !== this.userSvc.userInfo?.uid;
        }
      );
    } else {
      this.admin = this.members_presence_confirmed.filter(
        (member) => member.uid === this.agendaEvent.admin_uid
      )[0];
    }

    // Get dyspos
    const allMembers = this.members_presence_confirmed.concat(
      this.members_presence_not_confirmed
    );
    for (let member of allMembers) {
      // Is he my friend ?
      member.is_my_friend = this.friendsSvc.isMyFriend(member.uid);

      // Dyspos
      const dyspo = (
        await this.agendaSvc.getDyspos([member.uid], this.agendaEvent)
      )[0];
      const dyspoStatus = dyspo.friend_dyspo;
      // Hydrate AppUser with dyspo status
      member.dyspoStatus = dyspoStatus;

      // Fetch events of members
      const events = await this.agendaSvc.getUserAgendaEvents(
        member.uid,
        this.agendaEvent
      );

      member.agendaEvents = events.agendaEvents;

      // My Info
      if (member.uid === this.userSvc.userInfo?.uid) {
        member.firstname = 'Vous';
        this.my_dyspoStatus = dyspo.friend_dyspo;
        this.my_dyspoStatus_label = '';
        this.my_agendaEvents = events.agendaEvents;
        this.my_agendaEvents_label = '';

        if (this.my_agendaEvents.length === 1) {
          this.my_agendaEvents_label = 'Vous avez un événement ce jour là';
        }

        if (this.my_agendaEvents.length > 1) {
          this.my_agendaEvents_label =
            'Vous avez plusieurs événements ce jour là';
        }

        if (this.my_agendaEvents.length === 0) {
          this.my_agendaEvents_label = "Vous n'avez rien de prévu à cette date";
        }

        switch (this.my_dyspoStatus) {
          case UserDyspoStatus.DYSPO:
            this.my_dyspoStatus_label = 'Vous êtes disponible à cette date';
            break;
          case UserDyspoStatus.NODYSPO:
            this.my_dyspoStatus_label =
              "Vous n'êtes pas disponible à cette date";
            break;
          case UserDyspoStatus.DYSPOWITHKIDS:
            this.my_dyspoStatus_label = 'Vous avez vos enfants à cette date';
            break;
          case UserDyspoStatus.UNDEFINED:
            this.my_dyspoStatus_label =
              'Vous n’avez pas indiqué si vous êtes disponible à cette date';
            break;
        }
      }
    }
  }

  openPopoverMenu(e: Event) {
    this.popoverMenu.event = e;
    this.isPopoverOpen = true;
  }

  onSelectUser(user: AppUserWithEvents, e: Event) {
    if (
      user.uid === this.userSvc.userInfo?.uid &&
      user.agendaEvents?.length === 0
    )
      return;
    this.selectedUserEvents = user.agendaEvents;
    this.selectedUser = user;
    console.log('get friend status');
    this.selectedUserFriendStatus = this.friendsSvc.getFriendStatus(user.uid);
    this.selectedUserFriendStatusLabel = this.getSelectedFriendStatusLabel(
      this.selectedUserFriendStatus!
    );
    //if (this.selectedUserEvents && this.selectedUserEvents?.length > 0) {
    this.popoverUserEvents.event = e;
    this.isPopoverUserEventsOpen = true;
    //}
  }

  // async confirmQuitEvent(newAdminUid?: string) {
  //   Swal.fire({
  //     title: 'Voulez-vous quitter cet evenement ?',
  //     showDenyButton: true,
  //     customClass: { confirmButton: 'btn btn-success' },
  //     heightAuto: false,
  //     confirmButtonText: 'Oui',
  //     denyButtonText: `Non`,
  //   }).then(async (result) => {
  //     /* Read more about isConfirmed, isDenied below */
  //     if (result.isConfirmed) {
  //       this.agendaSvc
  //         .quitEvent(this.agendaEvent, newAdminUid)
  //         .then((res) => {
  //           this.close();
  //         })
  //         .catch((err) => {
  //           this.utils.showToastError(err);
  //           this.close();
  //         });
  //     } else if (result.isDenied) {
  //     }
  //   });
  // }

  async editEvent() {
    this.isPopoverOpen = false;
    await this.close();
    const navigationExtras: NavigationExtras = {
      state: {
        agendaEvent: this.agendaEvent,
      },
    };
    this.navCtrl.navigateForward(
      '/agenda/me/create-event/edit',
      navigationExtras
    );
  }

  async quitEvent() {
    Swal.fire({
      title: 'Voulez-vous vraiment supprimer cet evenement de votre agenda?',
      showDenyButton: true,
      heightAuto: false,
      confirmButtonText: 'Oui',
      denyButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isPopoverOpen = false;
        // I am the admin
        if (this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid) {
          if (this.new_admin_candidates.length > 0) {
            this.modalNewAdminOpened = true;
            return;
          }
          // No candidates => Delete event
          else {
            this.agendaSvc
              .quitEvent(this.agendaEvent)
              .then((res) => {
                this.close();
              })
              .catch((err) => {
                this.utils.showToastError(err);
                this.close();
              });
          }
        } else {
          this.agendaSvc
            .quitEvent(this.agendaEvent)
            .then((res) => {
              this.close();
            })
            .catch((err) => {
              this.utils.showToastError(err);
              this.close();
            });
        }
      }
    });
  }

  onProfile() {
    //open calendar
  }

  acceptInvitation() {
    this.agendaSvc.acceptEventInvitation(this.agendaEvent);
    this.close();
  }

  declineInvitation() {
    this.agendaSvc.declineEventInvitation(this.agendaEvent);
    this.close();
  }

  close() {
    return this.modalCtrl.dismiss({});
  }

  confirmNewAdmin(newAdmin: AppUser) {
    this.modalNewAdminOpened = false;

    this.utils.showLoader();
    this.agendaSvc
      .quitEvent(this.agendaEvent, newAdmin.uid)
      .then((res) => {
        setTimeout(() => {
          this.utils.hideLoader();
          this.close();
        }, 1000);

        console.log('New admin has been set-> Close');
      })
      .catch((err) => {
        setTimeout(() => {
          this.utils.hideLoader();
          this.utils.showToastError(err);
          this.close();
        }, 1000);
      });
  }

  invite(user: AppUserWithEvents) {
    this.isPopoverUserEventsOpen = false;
    if (!user) return;
    this.friendsSvc.invite(user, true).then(() => {
      user.is_my_friend = true;
    });
  }

  getSelectedFriendStatusLabel(status: FriendStatus): string {
    let label = '';
    switch (status) {
      case FriendStatus.FRIEND:
        label = 'Vous êtes amis';
        break;
      case FriendStatus.NOFRIEND:
        label = "Vous n'êtes pas amis";
        break;
      case FriendStatus.INVITED:
        label = 'Invitation ami envoyée';
        break;
      case FriendStatus.SUGGESTED:
        label = 'Invitation ami reçue';
        break;
    }
    return label;
  }

  getOtherEventLabel(ev: AgendaEvent) {
    // Event long
    if (ev.start_date_day_of_year !== ev.end_date_day_of_year) {
      return (
        format(parseISO(ev.startISO), 'dd MMM HH:mm', { locale: fr }) +
        ' - ' +
        format(parseISO(ev.endISO), 'dd MMM HH:mm', { locale: fr })
      );
    }
    // Event sur une journee
    else {
      return (
        format(parseISO(ev.endISO), 'dd MMM', { locale: fr }) +
        ' ' +
        ev.start_time_formatted +
        ' - ' +
        ev.end_time_formatted
      );
    }
  }
}
