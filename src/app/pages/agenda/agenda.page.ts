import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NavigationExtras } from '@angular/router';
import {
  Gesture,
  GestureController,
  GestureDetail,
  IonDatetime,
  NavController,
} from '@ionic/angular';
import {
  formatISO,
  isAfter,
  isBefore,
  isSameDay,
  parse,
  parseISO,
} from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import { CalendarComponentOptions, DayConfig } from 'src/app/calendar';
import { CalendarMode } from 'src/app/components/calendar';
import { AgendaEvent } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UtilsService } from 'src/app/services/utils.service';

export enum AgendaMode {
  SELECT,
  EDIT,
  GETEVENTS,
}

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
})
export class AgendaPage implements AfterViewInit {
  @ViewChild('mydiv') mydiv!: ElementRef;
  calendar = {
    mode: 'month' as CalendarMode,
  };
  dateMulti: string[] = [];
  dateRange: { from: string; to: string } | undefined;
  type: 'string' = 'string'; // 'string' | 'js-date' | 'moment' | 'time' | 'object'
  optionsRange: CalendarComponentOptions = {
    pickMode: 'range',
  };
  optionsMulti: CalendarComponentOptions = {};

  eventsForDate: AgendaEvent[] = [];
  selectedDate: any;

  agendaEvents$: Observable<AgendaEvent[]>;
  agendaEvents: AgendaEvent[] = [];
  agendaEventsSubscription: Subscription;

  agendaMode: AgendaMode = AgendaMode.GETEVENTS;
  selectedDateFormatted: any;
  selectedDateMs: number;

  constructor(
    private gestureCtrl: GestureController,
    private agendaSvc: AgendaService,
    private navCtrl: NavController,
    private utils: UtilsService
  ) {
    this.agendaEvents$ = this.agendaSvc.agendaEvents$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents: AgendaEvent[]) => {
        console.log('Agenda Events  ', agendaEvents);
        this.agendaEvents = agendaEvents;
        this.getAgendaEventsForSelectedDate();
      }
    );
    this.selectedDateMs = new Date().getTime();
    this.selectedDateFormatted = this.utils.formatDate(new Date().getTime());
  }

  ngOnDestroy() {
    this.agendaEventsSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    // console.log('mydiv', this.mydiv);
    // const gesture: Gesture = this.gestureCtrl.create(
    //   {
    //     el: this.mydiv.nativeElement,
    //     disableScroll: true,
    //     threshold: 15,
    //     gestureName: 'my-gesture',
    //     onMove: (ev) => this.onMove(ev),
    //     onStart: (ev) => this.onStart(ev),
    //     gesturePriority: 10000000000000000000,
    //   },
    //   true
    // );
    // gesture.enable()

    // Set events for today
    this.getAgendaEventsForSelectedDate();

    let _daysConfig: DayConfig[] = [];

    for (let i = 0; i < 31; i++) {
      _daysConfig.push({
        date: new Date(2022, 9, i + 1),
        subTitle: `$${i + 1}`,
      });
    }
    this.optionsMulti = {
      pickMode: 'multi',
      showMonthPicker: true,
      showToggleButtons: true,
      //daysConfig: _daysConfig,
    };
  }

  private onStart(detail: GestureDetail) {
    console.log('start', detail);
  }

  private onMove(detail: GestureDetail) {
    const type = detail.type;
    const currentX = detail.currentX;
    const deltaX = detail.deltaX;
    const velocityX = detail.velocityX;

    // this.p.innerHTML = `
    //   <div>Type: ${type}</div>
    //   <div>Current X: ${currentX}</div>
    //   <div>Delta X: ${deltaX}</div>
    //   <div>Velocity X: ${velocityX}</div>
    // `;
  }

  onChange(ev: any) {
    console.log('onChange');
  }
  onItemSwipe(ev: any) {
    console.log('Sxipe');
  }
  onSelect(ev: any) {
    if (this.agendaMode === AgendaMode.GETEVENTS) {
      console.log('Get events for Selected ', ev);

      this.selectedDate = ev;
      this.selectedDateFormatted = this.utils.formatDate(ev.time);
      this.selectedDateMs = ev.time;
      this.getAgendaEventsForSelectedDate();
    }
  }
  addEvent() {
    const navigationExtras: NavigationExtras = {
      state: {
        tsDate: this.selectedDateMs,
      },
    };
    this.navCtrl.navigateForward('/agenda/create-event/new', navigationExtras);
  }
  updateEvent(agendaEvent: AgendaEvent) {
    const navigationExtras: NavigationExtras = {
      state: {
        agendaEvent,
      },
    };
    this.navCtrl.navigateForward('/agenda/create-event/edit', navigationExtras);
  }

  getAgendaEventsForSelectedDate() {
    this.eventsForDate = [];
    this.eventsForDate = this.agendaEvents.filter((elt: AgendaEvent) =>
      isSameDay(this.selectedDateMs, parseISO(elt.startISO))
    );
    this.eventsForDate.sort((item1, item2) => {
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
    console.log(this.eventsForDate);
  }
}
