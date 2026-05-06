import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { ModalController, NavController } from '@ionic/angular';
import { format, isAfter, isBefore, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Subscription } from 'rxjs';
import { HelperComponent } from 'src/app/components/helper/helper.component';
import {
  AgendaEvent,
  AgendaEventType,
  Chatroom,
  DiscussionType,
  ShowHelper,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UserService } from 'src/app/services/user.service';

type ChatFilter = 'all' | 'unread' | 'recent' | 'favorites';
const FAVORITES_PREF_KEY = 'chat_favorites';

@Component({
    selector: 'app-group-list',
    templateUrl: './group-list.page.html',
    styleUrls: ['./group-list.page.scss'],
    standalone: false
})
export class GroupListPage implements OnInit {
  agendaEventType = AgendaEventType;
  agendaSubscription: Subscription;
  discussionType = DiscussionType;
  agendaEvents: AgendaEvent[] = [];
  agendaEventsArchived: AgendaEvent[] = [];
  my_uid: string;
  chatrooms: Record<string, Chatroom> = {};
  selectDiscussionsType: DiscussionType;
  isLoading = true;
  showHelper = false;

  activeFilter: ChatFilter = 'all';
  archiveFilter: ChatFilter = 'all';
  favoriteUids = new Set<string>();

  constructor(
    private route: Router,
    private modalCtrl: ModalController,
    private agendaSvc: AgendaService,
    private userSvc: UserService,
    private navCtrl: NavController
  ) {
    this.selectDiscussionsType = DiscussionType.ACTIVE;
    this.my_uid = this.userSvc.userInfo?.uid!;

    const sortByLatestActivity = (a: AgendaEvent, b: AgendaEvent) => {
      const timeA = a.last_message?.time_ms || a.start_date_ts || 0;
      const timeB = b.last_message?.time_ms || b.start_date_ts || 0;
      return timeB - timeA;
    };

    this.agendaSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        this.isLoading = false;

        this.agendaEvents = agendaEvents
          .filter(
            (ev) =>
              ev.members_uid.length > 1 &&
              isAfter(parseISO(ev.endISO), new Date())
          )
          .sort(sortByLatestActivity);

        this.agendaEventsArchived = agendaEvents
          .filter(
            (ev) =>
              ev.members_uid.length > 1 &&
              isBefore(parseISO(ev.endISO), new Date())
          )
          .sort(sortByLatestActivity);

        agendaEvents.forEach((agEvent) => {
          this.chatrooms[agEvent.uid!] = agEvent[
            'user_' + this.my_uid
          ] as Chatroom;
        });
      }
    );
  }

  async ngOnInit() {
    await this.loadFavorites();

    const { value } = await Preferences.get({ key: ShowHelper.CHATS });
    if (!value) {
      this.showHelper = true;
      const modal = await this.modalCtrl.create({
        component: HelperComponent,
        componentProps: { showHelper: ShowHelper.CHATS },
      });
      modal.present();
      await Preferences.set({ key: ShowHelper.CHATS, value: 'SHOWN' });
    }
  }

  // ── Favorites ──────────────────────────────────────────────────────────────

  private async loadFavorites() {
    const { value } = await Preferences.get({ key: FAVORITES_PREF_KEY });
    if (value) {
      this.favoriteUids = new Set(JSON.parse(value) as string[]);
    }
  }

  async toggleFavorite(uid: string, event: Event) {
    event.stopPropagation();
    if (this.favoriteUids.has(uid)) {
      this.favoriteUids.delete(uid);
    } else {
      this.favoriteUids.add(uid);
    }
    this.favoriteUids = new Set(this.favoriteUids);
    await Preferences.set({
      key: FAVORITES_PREF_KEY,
      value: JSON.stringify([...this.favoriteUids]),
    });
  }

  isFavorite(uid: string): boolean {
    return this.favoriteUids.has(uid);
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  get currentFilter(): ChatFilter {
    return this.selectDiscussionsType === DiscussionType.ACTIVE
      ? this.activeFilter
      : this.archiveFilter;
  }

  setFilter(filter: ChatFilter) {
    if (this.selectDiscussionsType === DiscussionType.ACTIVE) {
      this.activeFilter = filter;
    } else {
      this.archiveFilter = filter;
    }
  }

  get filteredActive(): AgendaEvent[] {
    return this.applyFilter(this.agendaEvents, this.activeFilter);
  }

  get filteredArchived(): AgendaEvent[] {
    return this.applyFilter(this.agendaEventsArchived, this.archiveFilter);
  }

  private applyFilter(events: AgendaEvent[], filter: ChatFilter): AgendaEvent[] {
    let result: AgendaEvent[];
    switch (filter) {
      case 'unread':
        result = events.filter(
          (ev) => (this.chatrooms[ev.uid!]?.count || 0) > 0
        );
        break;
      case 'recent':
        const cutoff = subDays(new Date(), 7).getTime();
        result = events.filter((ev) => {
          const t = ev.last_message?.time_ms || ev.start_date_ts || 0;
          return t >= cutoff;
        });
        break;
      case 'favorites':
        result = events.filter((ev) => this.favoriteUids.has(ev.uid!));
        break;
      default:
        result = [...events];
    }
    // Always pin favorites at the top within the filtered result
    const pinned = result.filter((ev) => this.favoriteUids.has(ev.uid!));
    const rest = result.filter((ev) => !this.favoriteUids.has(ev.uid!));
    return [...pinned, ...rest];
  }

  // ── Navigation & display ───────────────────────────────────────────────────

  goToChat(
    agendaEvent: AgendaEvent | undefined,
    discussionType: DiscussionType,
    _ev: any
  ) {
    const navigationExtras: NavigationExtras = {
      state: { agendaEvent, discussionType },
    };
    this.navCtrl.navigateForward('/group-chatting', navigationExtras);
  }

  create_group() {
    this.route.navigate(['./create-group']);
  }

  getLastMessageDate(agendaEvent: AgendaEvent) {
    if (!agendaEvent.last_message) return '';
    return format(parseISO(agendaEvent.last_message.date_ISO), 'HH:mm dd MMM', {
      locale: fr,
    });
  }

  getLastMessageMessage(agendaEvent: AgendaEvent) {
    if (!agendaEvent.last_message) return '';
    if (
      agendaEvent.last_message.deleted_by.includes(this.my_uid) ||
      agendaEvent.last_message.is_deleted
    ) {
      return 'Message effacé';
    }
    return agendaEvent.last_message.message!;
  }

  getDelayClass(index: number): string {
    return 'animated delay_' + Math.min(index, 12);
  }
}
