import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AgendaEvent, AgendaEventType, AppUser } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-agenda-event-info',
  templateUrl: './agenda-event-info.component.html',
  styleUrls: ['./agenda-event-info.component.scss'],
})
export class AgendaEventInfoComponent implements OnInit {
  @Output() outevt = new EventEmitter<string>();
  @Input() agendaEvent!: AgendaEvent;
  @Input() isInvitation!: boolean;

  agendaEventType = AgendaEventType;
  members: AppUser[] = [];
  admin!: AppUser;

  constructor(
    private modalCtrl: ModalController,
    private agendaSvc: AgendaService,
    public userSvc: UserService
  ) {}

  async ngOnInit() {
    console.log(this.agendaEvent);
    // Get members info

    this.members = await this.userSvc.getUserInfosExceptMe(
      this.agendaEvent!.members_uid.concat(
        this.agendaEvent!.members_invited_uid
      )
    );

    this.admin = this.members.filter(
      (member) => member.uid === this.agendaEvent.admin_uid
    )[0];
  }

  onProfile() {}

  acceptInvitation() {
    this.agendaSvc.acceptEventInvitation(this.agendaEvent);
    this.close();
  }

  declineInvitation() {
    this.agendaSvc.declineEventInvitation(this.agendaEvent);
    this.close();
  }

  close() {
    this.modalCtrl.dismiss({});
  }

  menu() {}
}
