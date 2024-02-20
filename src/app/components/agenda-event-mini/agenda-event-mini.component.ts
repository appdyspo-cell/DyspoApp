import { Component, Input, OnInit } from '@angular/core';
import { AgendaEvent, AgendaEventType } from 'src/app/models/models';
import { Output, EventEmitter } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';
import { format, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  display_date_1: string | undefined;
  display_date_2: string | undefined;
  eventTypeLabel = '';

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
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
    if (
      isSameDay(this.agendaEvent.start_date_ts, this.agendaEvent.end_date_ts)
    ) {
      this.display_date_1 = format(
        parseISO(this.agendaEvent.startISO),
        'iii dd MMM',
        {
          locale: fr,
        }
      );
      this.display_date_2 =
        format(parseISO(this.agendaEvent.startISO), 'HH:mm', {
          locale: fr,
        }) +
        '-' +
        format(parseISO(this.agendaEvent.endISO), 'HH:mm', {
          locale: fr,
        });
    } else {
      this.display_date_1 = format(
        parseISO(this.agendaEvent.startISO),
        'iii dd MMM HH:mm',
        {
          locale: fr,
        }
      );
      this.display_date_2 = format(
        parseISO(this.agendaEvent.endISO),
        'iii dd MMM HH:mm',
        {
          locale: fr,
        }
      );
    }
  }

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
