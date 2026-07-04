import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { isAfter, isBefore, parseISO } from 'date-fns';
import { Subscription } from 'rxjs';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { AgendaEvent, Friend, FriendStatus } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { FriendsService } from 'src/app/services/friends.service';

@Component({
    selector: 'app-notifications-list',
    templateUrl: './notifications-list.page.html',
    styleUrls: ['./notifications-list.page.scss'],
    standalone: false
})
export class NotificationsListPage implements OnInit {
  invitations: AgendaEvent[] = [];
  friendsSuggested: Friend[] = [];
  defaultImage = 'assets/logo.svg';
  private invitationsSub!: Subscription;
  private friendsSub!: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private agendaSvc: AgendaService,
    private friendsSvc: FriendsService
  ) {}

  ngOnInit() {
    this.invitationsSub = this.agendaSvc.agendaEventInvitations$.subscribe((invitations) => {
      const sorted = [...invitations].sort((a, b) => {
        const d1 = parseISO(a.startISO);
        const d2 = parseISO(b.startISO);
        return isBefore(d1, d2) ? -1 : isAfter(d1, d2) ? 1 : 0;
      });
      this.invitations = sorted.filter((ev) => isAfter(parseISO(ev.endISO), new Date()));
    });

    this.friendsSub = this.friendsSvc.friends$.subscribe((friends) => {
      this.friendsSuggested = friends.filter(f => f.friend_status === FriendStatus.SUGGESTED);
    });
  }

  ionViewWillLeave() {
    if (this.invitationsSub) this.invitationsSub.unsubscribe();
    if (this.friendsSub) this.friendsSub.unsubscribe();
  }

  openFriendRequests() {
    this.navCtrl.navigateForward('/tabs/friends', { state: { isFromNotif: true } });
  }

  async openAgendaEventInfo(agendaEvent: AgendaEvent) {
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
}
