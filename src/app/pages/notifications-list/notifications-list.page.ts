import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { AgendaEvent } from 'src/app/models/models';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.page.html',
  styleUrls: ['./notifications-list.page.scss'],
})
export class NotificationsListPage implements OnInit {
  invitations: AgendaEvent[] = [];

  constructor(private router: Router, private modalCtrl: ModalController) {
    this.invitations =
      this.router.getCurrentNavigation()?.extras.state?.['invitations'];
    // for (let i = 0; i < 35; i++) {
    //   this.invitations = this.invitations.concat(myinvitations);
    // }
    console.log(this.invitations);
  }

  ngOnInit() {}

  async openAgendaEventInfo(agendaEvent: AgendaEvent) {
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
    }
  }
}
