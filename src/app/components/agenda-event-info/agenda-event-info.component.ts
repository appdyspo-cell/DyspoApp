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
import {
  AgendaEvent,
  AgendaEventType,
  AppUser,
  AppUserWithEvents,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
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
  agendaEventType = AgendaEventType;
  members_presence_confirmed: AppUserWithEvents[] = [];
  members_presence_not_confirmed: AppUserWithEvents[] = [];
  new_admin_candidates: AppUser[] = [];
  admin!: AppUser;
  modalNewAdminOpened = false;
  isPopoverOpen = false;
  isPopoverUserEventsOpen = false;
  allowEdit = false;
  isSoloEvent!: boolean;
  selectedUserEvents: AgendaEvent[] | undefined;
  defaultImage = 'assets/logo.svg';

  constructor(
    private modalCtrl: ModalController,
    private agendaSvc: AgendaService,
    public userSvc: UserService,
    private alertCtrl: AlertController,
    private utils: UtilsService,
    private navCtrl: NavController,

    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    console.log(this.agendaEvent);

    this.allowEdit =
      this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid ||
      this.agendaEvent.all_can_edit;

    this.isSoloEvent =
      this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid &&
      this.agendaEvent.members_invited_uid.length === 0 &&
      this.agendaEvent.members_uid.length === 1;
    // Get members info

    this.members_presence_not_confirmed = await this.userSvc.getUserInfos(
      this.agendaEvent!.members_invited_uid
    );

    this.members_presence_confirmed = await this.userSvc.getUserInfos(
      this.agendaEvent!.members_uid
    );

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
    }
  }

  openPopoverMenu(e: Event) {
    this.popoverMenu.event = e;
    this.isPopoverOpen = true;
  }

  onSelectUser(user: AppUserWithEvents, e: Event) {
    this.selectedUserEvents = user.agendaEvents;
    if (this.selectedUserEvents && this.selectedUserEvents?.length > 0) {
      this.popoverUserEvents.event = e;
      this.isPopoverUserEventsOpen = true;
    }
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
    this.navCtrl.navigateForward('/agenda/create-event/edit', navigationExtras);
  }

  async quitEvent() {
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
}
