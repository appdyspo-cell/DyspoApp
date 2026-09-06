import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NavigationExtras } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  ModalController,
  NavController,
} from '@ionic/angular';

import { format, getDate, getMonth, getYear, isBefore, isSameDay, parseISO, setHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AgendaDyspoItem,
  AgendaEvent,
  AgendaEventType,
  AppUser,
  AppUserWithEvents,
  ChatMessage,
  FriendStatus,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { CalendarService } from 'src/app/services/calendar.service';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { DyspoViewerComponent } from '../dyspo-viewer/dyspo-viewer.component';
import { FriendProfileComponent } from '../friend-profile/friend-profile.component';

@Component({
    selector: 'app-agenda-event-info',
    templateUrl: './agenda-event-info.component.html',
    styleUrls: ['./agenda-event-info.component.scss'],
    standalone: false
})
export class AgendaEventInfoComponent implements OnInit, OnDestroy {
  @Output() outevt = new EventEmitter<string>();
  @Input() agendaEvent!: AgendaEvent;
  @Input() isInvitation!: boolean;
  @Input() isMulti!: boolean;
  @ViewChild('popovermenu') popoverMenu: any;
  @ViewChild('popoverUserEvents') popoverUserEvents: any;

  defaultAvatar = 'assets/img/user.jpg';
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
  private subs: Subscription[] = [];

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private agendaSvc: AgendaService,
    public userSvc: UserService,
    private utils: UtilsService,
    private navCtrl: NavController,
    private friendsSvc: FriendsService,
    private calendarSvc: CalendarService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
      case AgendaEventType.SOLO:
        this.eventTypeLabel = 'Perso';
        break;
    }
    this.members_loaded = false;
    this.allowEdit =
      this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid ||
      this.agendaEvent.all_can_edit;

    // We can not edit an event in the past, except the title
    let agendaEventIsPast = false;
    const todayMorning = setHours(new Date(), 0);
    if (isBefore(parseISO(this.agendaEvent?.startISO!), todayMorning)) {
      // this.utils.showAlert(
      //   'Vous ne pouvez pas editer un événement dans le passé'
      // );
      agendaEventIsPast = true;
    }

    this.allowEdit = this.allowEdit && !agendaEventIsPast;

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
        format(parseISO(this.agendaEvent.startISO), 'iiii dd MMMM', {
          locale: fr,
        }) +
        ' à ' +
        format(parseISO(this.agendaEvent.startISO), 'HH:mm', {
          locale: fr,
        });
    } else {
      this.display_date_1 =
        'Du ' +
        format(parseISO(this.agendaEvent.startISO), 'iiii dd MMMM HH:mm', {
          locale: fr,
        });
      this.display_date_2 =
        'Au ' +
        format(parseISO(this.agendaEvent.endISO), 'iiii dd MMMM HH:mm', {
          locale: fr,
        });
    }
    // ── Récupération des listes de membres (hors zone, OK pour les requêtes) ──
    const [notConfirmed, confirmed] = await Promise.all([
      this.userSvc.getUserInfos(this.agendaEvent!.members_invited_uid),
      this.userSvc.getUserInfos(this.agendaEvent!.members_uid),
    ]);

    // ── Phase 1 : afficher la liste des membres immédiatement dans la zone ──
    // @angular/fire v20 exécute getDocs() hors de la zone Angular.
    // Sur iOS (WKWebView), Angular ne détecte pas les changements sans ngZone.run().
    this.ngZone.run(() => {
      this.members_presence_not_confirmed = notConfirmed;
      this.members_presence_confirmed = confirmed;
      this.members_loaded = true;

      // New Admin candidates
      if (this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid) {
        this.admin = confirmed.find(m => m.uid === this.agendaEvent.admin_uid);
        this.new_admin_candidates = confirmed.filter(m => m.uid !== this.userSvc.userInfo?.uid);
      } else {
        this.admin = confirmed.find(m => m.uid === this.agendaEvent.admin_uid);
      }
    });

    // ── Requêtes dyspos / événements par membre (hors zone, OK) ────────────
    const allMembers = confirmed.concat(notConfirmed);

    // Paralléliser les requêtes par membre (au lieu d'un for...of séquentiel)
    await Promise.all(
      allMembers.map(async (member) => {
        // Is he my friend ?
        member.is_my_friend = this.friendsSvc.isMyFriend(member.uid);

        const [dyspoResults, events] = await Promise.all([
          this.agendaSvc.getDyspos([member.uid], this.agendaEvent),
          this.agendaSvc.getUserAgendaEvents(member.uid, this.agendaEvent),
        ]);
        const dyspo = dyspoResults[0];
        const dyspoStatus = dyspo.friend_dyspo;
        // Hydrate AppUser with dyspo status
        member.dyspoStatus = dyspoStatus;
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
              this.my_dyspoStatus_label = "Vous êtes disponible à cette date";
              break;
            case UserDyspoStatus.NODYSPO:
              this.my_dyspoStatus_label =
                "Vous n'êtes pas disponible à cette date";
              break;
            case UserDyspoStatus.DYSPOWITHKIDS:
              this.my_dyspoStatus_label = "Vous avez vos enfants à cette date";
              break;
            case UserDyspoStatus.UNDEFINED:
              this.my_dyspoStatus_label =
                "Vous n’avez pas indiqué si vous êtes disponible à cette date";
              break;
          }
        }
      })
    );

    // ── Phase 2 : forcer le re-rendu avec les statuts dyspo/événements ──────
    // Les propriétés des membres ont été mutées en place hors zone —
    // on spread les tableaux pour qu’Angular détecte les changements sur iOS.
    this.ngZone.run(() => {
      this.members_presence_confirmed = [...this.members_presence_confirmed];
      this.members_presence_not_confirmed = [...this.members_presence_not_confirmed];
    });

    // ── Souscriptions live : mises à jour réactives du bloc disponibilité ──
    // Les labels sont recalculés chaque fois que les events ou le statut
    // dyspo changent (ex: un autre événement créé pendant que la modale est ouverte).
    if (this.isInvitation) {
      this.subs.push(
        this.agendaSvc.agendaEventsSubject.subscribe(events => {
          this.ngZone.run(() => {
            this.recomputeMyEventsLabel(events);
            this.cdr.detectChanges();
          });
        }),
        this.agendaSvc.agendaDysposSubject.subscribe(({ items }) => {
          this.ngZone.run(() => {
            this.recomputeMyDyspoLabel(items);
            this.cdr.detectChanges();
          });
        })
      );
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  /** Recalcule le label "événements ce jour" depuis le cache local. */
  private recomputeMyEventsLabel(events: AgendaEvent[]) {
    // Overlap correct : mon événement chevauche la date de l’invitation
    // (pas seulement contenu dedans)
    const overlapping = events.filter(ev =>
      ev.uid !== this.agendaEvent.uid &&
      ev.start_date_ts <= this.agendaEvent.end_date_ts &&
      ev.end_date_ts >= this.agendaEvent.start_date_ts
    );
    if (overlapping.length === 0) {
      this.my_agendaEvents_label = "Vous n’avez rien de prévu à cette date";
    } else if (overlapping.length === 1) {
      this.my_agendaEvents_label = "Vous avez un événement ce jour là";
    } else {
      this.my_agendaEvents_label = "Vous avez plusieurs événements ce jour là";
    }
  }

  /** Recalcule le label "statut dyspo" depuis le cache local. */
  private recomputeMyDyspoLabel(dyspos: AgendaDyspoItem[]) {
    const startDate = parseISO(this.agendaEvent.startISO);
    const y = getYear(startDate);
    const m = getMonth(startDate); // 0-indexed, identique au stockage AgendaDyspoItem
    const d = getDate(startDate);
    const matching = dyspos.find(item =>
      item.year === y && item.month === m && item.day === d
    );
    const status = matching?.userDyspo ?? UserDyspoStatus.UNDEFINED;

    switch (status) {
      case UserDyspoStatus.DYSPO:
        this.my_dyspoStatus_label = "Vous êtes disponible à cette date";
        break;
      case UserDyspoStatus.NODYSPO:
        this.my_dyspoStatus_label = "Vous n’êtes pas disponible à cette date";
        break;
      case UserDyspoStatus.DYSPOWITHKIDS:
        this.my_dyspoStatus_label = "Vous avez vos enfants à cette date";
        break;
      default:
        this.my_dyspoStatus_label = "Vous n’avez pas indiqué votre disponibilité";
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
    const alert = await this.alertCtrl.create({
      header: 'Supprimer l\'événement',
      message: 'Voulez-vous vraiment supprimer cet événement de votre agenda ?',
      cssClass: 'dyspo-alert-confirm',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.isPopoverOpen = false;
            if (this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid) {
              if (this.new_admin_candidates.length > 0) {
                this.modalNewAdminOpened = true;
                return;
              }
              this.agendaSvc
                .quitEvent(this.agendaEvent)
                .then(() => this.close())
                .catch((err) => { this.utils.showToastError(err); this.close(); });
            } else {
              this.agendaSvc
                .quitEvent(this.agendaEvent)
                .then(() => this.close())
                .catch((err) => { this.utils.showToastError(err); this.close(); });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  onProfile() {
    //open calendar
  }

  async acceptInvitation() {
    this.agendaSvc.acceptEventInvitation(this.agendaEvent);
    this.close();
  }

  addToCalendar() {
    this.calendarSvc.promptAddToCalendar(this.agendaEvent);
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

  /** Clique sur le "+" d'un participant non-ami → action sheet avec 2 options */
  async openParticipantActions(member: AppUserWithEvents, event: Event) {
    event.stopPropagation();
    const firstname = member.firstname || 'ce participant';
    const sheet = await this.actionSheetCtrl.create({
      header: firstname,
      cssClass: 'participant-action-sheet',
      buttons: [
        {
          text: `Voir la fiche de ${firstname}`,
          icon: 'person-circle-outline',
          handler: () => { this.openFriendProfileModal(member); },
        },
        {
          text: 'Demander en ami',
          icon: 'person-add-outline',
          handler: () => {
            this.friendsSvc.invite(member, true).then(() => {
              member.is_my_friend = true;
            });
          },
        },
        {
          text: 'Annuler',
          role: 'cancel',
          icon: 'close-outline',
        },
      ],
    });
    await sheet.present();
  }

  /** Ouvre la fiche profil du participant dans une modale */
  private async openFriendProfileModal(member: AppUserWithEvents) {
    const modal = await this.modalCtrl.create({
      component: FriendProfileComponent,
      componentProps: {
        user: member,
        isFriend: member.is_my_friend !== false,
      },
      initialBreakpoint: 0.75,
      breakpoints: [0, 0.75, 1],
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === 'requested') {
      member.is_my_friend = true;
    }
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

  /** Classe CSS appliquée sur le card wrapper pour les tokens couleur */
  get evTypeClass(): string {
    switch (this.agendaEvent?.type) {
      case AgendaEventType.KIDS:   return 'ev-KIDS';
      case AgendaEventType.NOKIDS: return 'ev-NOKIDS';
      case AgendaEventType.FREE:   return 'ev-FREE';
      case AgendaEventType.SOLO:   return 'ev-SOLO';
      default:                     return 'ev-SOLO';
    }
  }

  /** Classe d'anneau dyspo autour de l'avatar admin */
  get adminDyspoRingClass(): string {
    const status = (this.admin as AppUserWithEvents)?.dyspoStatus;
    switch (status) {
      case UserDyspoStatus.DYSPOWITHKIDS: return 'ring-kids';
      case UserDyspoStatus.DYSPO:         return 'ring-dyspo';
      case UserDyspoStatus.NODYSPO:       return 'ring-nodyspo';
      default:                            return '';
    }
  }

  /** Classe d'anneau dyspo autour d'un avatar participant */
  getMemberRingClass(member: AppUserWithEvents): string {
    switch (member.dyspoStatus) {
      case UserDyspoStatus.DYSPOWITHKIDS: return 'ring-kids';
      case UserDyspoStatus.DYSPO:         return 'ring-dyspo';
      case UserDyspoStatus.NODYSPO:       return 'ring-nodyspo';
      default:                            return 'ring-undef';
    }
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

  async viewFriendCalendar() {
    this.isPopoverUserEventsOpen = false;
    await this.close();
    const navigationExtras: NavigationExtras = {
      state: {
        friend: {
          uid: this.selectedUser!.uid,
          friend_uid: this.selectedUser!.uid,
          userData: this.selectedUser,
        },
      },
    };
    this.navCtrl.navigateForward('agenda/friend', navigationExtras);
  }

  async goToChat(agendaEvent: AgendaEvent | undefined, event: any) {
    event.stopPropagation();
    console.log('goToChat', agendaEvent);

    if (agendaEvent) {
      const navigationExtras: NavigationExtras = {
        state: {
          agendaEvent,
        },
      };
      await this.close();
      this.navCtrl.navigateForward('/group-chatting', navigationExtras);
    }
  }

  async openImage(image: string, event: any) {
    event?.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: DyspoViewerComponent,
      componentProps: { image },
      cssClass: 'dyspo-viewer-modal',
      animated: true,
    });
    modal.present();
  }
}
