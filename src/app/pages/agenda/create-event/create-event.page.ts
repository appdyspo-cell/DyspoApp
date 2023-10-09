import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonDatetime, NavController } from '@ionic/angular';
import {
  add,
  addHours,
  format,
  formatISO,
  getHours,
  isAfter,
  isEqual,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AgendaEvent,
  AgendaEventStatus,
  AgendaEventType,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
})
export class CreateEventPage implements OnInit {
  tsInputDate: any;
  start_date_formatted!: string;
  end_date_formatted!: string;
  start_time_formatted!: string;
  end_time_formatted!: string;
  min_time_ISO_start!: string;
  min_time_ISO_end!: string;
  agendaEvent: AgendaEvent | undefined;
  agendaEventType = AgendaEventType;
  pageTitle = '';
  saveLabel = '';

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private agendaSvc: AgendaService
  ) {
    this.activatedRoute.params.subscribe((params) => {
      const mode = params['mode'];
      switch (mode) {
        case 'new':
          this.pageTitle = 'Créer un evenement';
          this.saveLabel = 'Sauvegarder';
          this.tsInputDate =
            this.router.getCurrentNavigation()?.extras.state?.['tsDate'];

          this.agendaEvent = {
            uid: 'agev_' + new Date().getTime(),
            startISO: formatISO(
              setHours(
                new Date(this.tsInputDate),
                getHours(add(new Date(), { hours: 1 }))
              )
            ),
            endISO: formatISO(
              setHours(
                new Date(this.tsInputDate),
                getHours(add(new Date(), { hours: 2 }))
              )
            ),
            title: undefined,
            type: AgendaEventType.KIDS,
            status: AgendaEventStatus.ACTIVE,
          };

          // Hydrate agendaEvent
          this.agendaEvent.start_date_formatted = this.formatDate(
            this.agendaEvent.startISO
          );
          this.agendaEvent.end_date_formatted = this.formatDate(
            this.agendaEvent.endISO
          );
          this.agendaEvent.start_time_formatted = this.formatTime(
            this.agendaEvent.startISO
          );
          this.agendaEvent.end_time_formatted = this.formatTime(
            this.agendaEvent.endISO
          );

          this.min_time_ISO_start = this.agendaEvent.startISO;
          this.min_time_ISO_end = this.agendaEvent.startISO;

          break;
        case 'edit':
          this.saveLabel = 'Mettre à jour';
          this.pageTitle = 'Editer un evenement';
          this.agendaEvent =
            this.router.getCurrentNavigation()?.extras.state?.['agendaEvent'];

          break;
      }
    });
  }

  ngOnInit() {}

  createEvent() {
    console.log(this.agendaEvent);
    if (this.agendaEvent?.title) {
      console.log('Événement créé :', this.agendaEvent);
      this.agendaSvc.addEvent(this.agendaEvent!);
      this.navCtrl.pop();
    }
  }

  removeEvent() {
    this.agendaSvc.removeEvent(this.agendaEvent!);
  }

  updateEvent() {}

  onStartTimeChanged(ev: any) {
    console.log(ev);
    this.agendaEvent!.start_date_formatted = this.formatDate(ev.detail.value);
    this.agendaEvent!.start_time_formatted = this.formatTime(ev.detail.value);
    this.agendaEvent!.startISO = ev.detail.value;

    this.min_time_ISO_end = ev.detail.value;
    if (
      isAfter(
        parseISO(this.agendaEvent!.startISO),
        parseISO(this.agendaEvent!.endISO)
      )
    ) {
      this.agendaEvent!.endISO = formatISO(
        addHours(new Date(parseISO(ev.detail.value)), 1)
      );

      this.agendaEvent!.end_date_formatted = this.formatDate(
        this.agendaEvent!.endISO
      );
      this.agendaEvent!.end_time_formatted = this.formatTime(
        this.agendaEvent!.endISO
      );
    }
  }

  onEndTimeChanged(ev: any) {
    this.agendaEvent!.end_date_formatted = this.formatDate(ev.detail.value);
    this.agendaEvent!.end_time_formatted = this.formatTime(ev.detail.value);
    this.agendaEvent!.endISO = ev.detail.value;
  }

  formatDate(value: string) {
    console.log(parseISO(value));
    const dateTime = parseISO(value).getTime();
    console.log(dateTime);
    return format(parseISO(value), 'iii dd MMM yyyy', { locale: fr });
  }

  formatTime(dateISO: string) {
    console.log(dateISO);
    return format(parseISO(dateISO), 'HH:mm');
  }
}
