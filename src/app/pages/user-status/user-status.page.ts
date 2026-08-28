import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
  ShowHelper,
  UserDyspoStatus,
} from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';
import { OverlayEventDetail } from '@ionic/core/components';
import { AgendaService } from 'src/app/services/agenda.service';
import { Observable, Subscription } from 'rxjs';
import {
  format,
  getDate,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { FriendsService } from 'src/app/services/friends.service';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { NavigationExtras } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { Preferences } from '@capacitor/preferences';
import { HelperComponent } from 'src/app/components/helper/helper.component';

@Component({
    selector: 'app-user-status',
    templateUrl: './user-status.page.html',
    styleUrls: ['./user-status.page.scss'],
    standalone: false
})
export class UserStatusPage implements OnInit, OnDestroy {
  @ViewChild(IonModal) modal!: IonModal;
  userInfo: AppUser | undefined;
  dyspoStatus = UserDyspoStatus;
  nextAgendaEvents: AgendaEvent[] = [];

  // ── CTA animated phrases ──────────────────────────────────────────────────
  readonly ctaPhrases = [
    'Invitez vos amis à vous retrouver 👋',
    'Créez un événement de groupe 🎉',
    'Planifiez une sortie entre amis 📅',
    'Partagez un moment en famille 🏡',
    'Organisez votre prochaine aventure ✨',
  ];
  ctaPhrase   = this.ctaPhrases[0];
  ctaVisible  = true;
  private ctaPhraseIndex = 0;
  private ctaInterval?: ReturnType<typeof setInterval>;

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

  private resumeHandle?: PluginListenerHandle;

  get totalNotifications(): number {
    return this.nb_notifications + this.friendsSuggested.length;
  }

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
      this.unsubscribeAll();
      this.todayFormatted = format(new Date(), 'iiii dd MMMM yyyy', {
        locale: fr,
      });
      this.notificationsSvc.resetBadgeCount();
      this.fetchData();
    }).then(handle => { this.resumeHandle = handle; });
  }

  fetchData() {
    this.friends$ = this.friendService.friends$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        this.nextAgendaEvents = agendaEvents
          .filter((agEvent) => isAfter(parseISO(agEvent.startISO), new Date()))
          .sort((a, b) => {
            const d1 = parseISO(a.startISO);
            const d2 = parseISO(b.startISO);
            return isBefore(d1, d2) ? -1 : isAfter(d1, d2) ? 1 : 0;
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
        const sorted = [...invitations].sort((a, b) => {
          const d1 = parseISO(a.startISO);
          const d2 = parseISO(b.startISO);
          return isBefore(d1, d2) ? -1 : isAfter(d1, d2) ? 1 : 0;
        });
        this.invitations = sorted.filter((ev) =>
          isAfter(parseISO(ev.endISO), new Date())
        );
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

  private unsubscribeAll() {
    this.agendaEventsSubscription?.unsubscribe();
    this.invitationsSubscription?.unsubscribe();
    this.friendsSubscrition?.unsubscribe();
    this.agendaDysposSubscription?.unsubscribe();
  }

  async ngOnInit() {
    this.ctaInterval = setInterval(() => {
      this.ctaVisible = false;
      setTimeout(() => {
        this.ctaPhraseIndex = (this.ctaPhraseIndex + 1) % this.ctaPhrases.length;
        this.ctaPhrase = this.ctaPhrases[this.ctaPhraseIndex];
        this.ctaVisible = true;
      }, 380);
    }, 3200);

    if (this.userSvc.userInfo?.firstConnexion) {
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
  }

  ngOnDestroy() {
    if (this.ctaInterval) clearInterval(this.ctaInterval);
    this.unsubscribeAll();
    this.resumeHandle?.remove();
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {}

  updateStatus(dyspoStatus: UserDyspoStatus) {
    this.modal.dismiss(dyspoStatus, 'confirm');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
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
    await modal.onWillDismiss();
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
    await modal.onWillDismiss();
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
    const buttons = [
      {
        text: 'Personnel',
        data: { is_multi: false },
      },
      {
        text: 'Groupe',
        data: { is_multi: true },
      },
    ];

    const actionSheet = await this.actionSheetCtrl.create({
      header: "Saisissez le type de l'événement",
      cssClass: 'dyspo-sheet',
      buttons,
    });

    await actionSheet.present();

    const result = await actionSheet.onDidDismiss();
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

  openAllNotifications() {
    this.navCtrl.navigateForward('/notifications-list');
  }
}
