import { Component, Input, OnInit } from '@angular/core';
import { AgendaEvent, AgendaEventType } from 'src/app/models/models';
import { Output, EventEmitter } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-agenda-event-mini',
  templateUrl: './agenda-event-mini.component.html',
  styleUrls: ['./agenda-event-mini.component.scss'],
})
export class AgendaEventMiniComponent implements OnInit {
  @Output() outevt = new EventEmitter<string>();
  @Input() agendaEvent!: AgendaEvent;
  @Input() isInvitation!: boolean;
  agendaEventType = AgendaEventType;

  constructor(private navCtrl: NavController) {}

  ngOnInit() {}

  addNewItem(value: string) {
    this.outevt.emit(value);
  }

  goToChat(agendaEvent: AgendaEvent | undefined, event: any) {
    event.stopPropagation();

    if (agendaEvent) {
      const navigationExtras: NavigationExtras = {
        state: {
          agendaEvent,
        },
      };
      this.navCtrl.navigateForward('/group-chatting', navigationExtras);
    }
  }
}
