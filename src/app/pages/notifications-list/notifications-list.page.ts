import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { isAfter, isBefore, parseISO } from 'date-fns';
import { Subscription } from 'rxjs';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { AgendaEvent } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.page.html',
  styleUrls: ['./notifications-list.page.scss'],
})
export class NotificationsListPage implements OnInit {
  invitations: AgendaEvent[] = [];
  invitationsSubscription!: Subscription;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private agendaSvc: AgendaService
  ) {
    // this.invitations =
    //   this.router.getCurrentNavigation()?.extras.state?.['invitations'];
    // for (let i = 0; i < 35; i++) {
    //   this.invitations = this.invitations.concat(myinvitations);
    // }
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

        // this.nb_notifications = this.invitations.length;
      });

    console.log(this.invitations);
  }

  ngOnInit() {}

  ionViewWillLeave() {
    if (this.invitationsSubscription)
      this.invitationsSubscription.unsubscribe();
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

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
    }
  }
}
