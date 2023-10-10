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
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parse,
  parseISO,
} from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import {
  CalendarComponentOptions,
  CalendarDay,
  CalendarMonth,
  DayConfig,
} from 'src/app/calendar';
import { CalendarMode } from 'src/app/components/calendar';
import {
  AgendaDyspo,
  AgendaEvent,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UtilsService } from 'src/app/services/utils.service';

export enum AgendaMode {
  SELECT,
  EDIT,
  READONLY,
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

  agendaDyspos$: Observable<AgendaDyspo[]>;
  agendaDyspos: AgendaDyspo[] = [];
  agendaDysposSubscription: Subscription;

  agendaMode: AgendaMode = AgendaMode.READONLY;
  selectedDateFormatted: any;
  selectedDateMs: number;

  agendaModes = AgendaMode;
  calendarMonthData!: CalendarMonth;

  constructor(
    private gestureCtrl: GestureController,
    private agendaSvc: AgendaService,
    private navCtrl: NavController,
    private utils: UtilsService
  ) {
    this.agendaEvents$ = this.agendaSvc.agendaEvents$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents: AgendaEvent[]) => {
        this.agendaEvents = agendaEvents;
        this.tagCalendarEventsData();
        this.getAgendaEventsForSelectedDate();
      }
    );

    this.agendaDyspos$ = this.agendaSvc.agendaDyspos$;
    this.agendaDysposSubscription = this.agendaSvc.agendaDyspos$.subscribe(
      (agendaDyspos: AgendaDyspo[]) => {
        this.agendaDyspos = agendaDyspos;
        this.tagCalendarUserDyspoData();
      }
    );

    this.selectedDateMs = new Date().getTime();
    this.selectedDateFormatted = this.utils.formatDate(new Date().getTime());
  }

  ngOnDestroy() {
    this.agendaEventsSubscription.unsubscribe();
  }

  onChangeMode(ev: any) {
    if (ev.detail.checked) {
      this.agendaMode = AgendaMode.EDIT;
    } else {
      this.agendaMode = AgendaMode.READONLY;
    }
  }

  ngAfterViewInit() {
    this.optionsMulti = {
      pickMode: 'multi',
      showMonthPicker: true,
      showToggleButtons: true,
      weekdays: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      weekStart: 1,
    };
  }

  onChange(ev: any) {
    console.log('onChange', ev);
  }
  onItemSwipe(ev: any) {
    console.log('Sxipe');
  }
  onSelect(ev: any) {
    if (this.agendaMode === AgendaMode.READONLY) {
      console.log('Get events for Selected ', ev);

      this.selectedDate = ev;
      this.selectedDateFormatted = this.utils.formatDate(ev.time);
      this.selectedDateMs = ev.time;
      //this.getAgendaEventsForSelectedDate();
    }
  }

  onCreateMonthEvent(calendarMonthData: CalendarMonth) {
    console.log('Month created !!!!', calendarMonthData);
    this.calendarMonthData = calendarMonthData;
    this.tagCalendarEventsData();
  }

  tagCalendarEventsData() {
    if (!this.calendarMonthData) {
      console.log('Can not tag calendar data');
    } else {
      this.calendarMonthData.days.forEach((day) => {
        this.agendaEvents.forEach((agendaEvent) => {
          if (isSameDay(day.time, parseISO(agendaEvent.startISO))) {
            day.isEvent = true;
            //day.subTitle = agendaEvent.title?.substring(0, 5);
          }
        });
      });
    }
  }

  tagCalendarUserDyspoData() {
    if (!this.calendarMonthData) {
      console.log('Can not tag calendar data');
    } else {
      this.calendarMonthData.days.forEach((day) => {
        this.agendaEvents.forEach((agendaEvent) => {
          if (isSameDay(day.time, parseISO(agendaEvent.startISO))) {
            day.isEvent = true;
            //day.subTitle = agendaEvent.title?.substring(0, 5);
          }
        });
      });
    }
  }

  onSelectReadOnly(ev: CalendarDay[]) {
    if (this.agendaMode === AgendaMode.READONLY) {
      console.log('Selected read only ', ev);

      this.selectedDate = ev;
      this.selectedDateFormatted = this.utils.formatDate(ev[0].time);
      this.selectedDateMs = ev[0].time;
      //ev[0].marked = true;
      // this.getAgendaEventsForSelectedDate();
      this.addEvent();
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
      isSameMonth(this.selectedDateMs, parseISO(elt.startISO))
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
  }

  saveAgenda() {
    console.log('Save ', this.calendarMonthData);

    const dyspos: AgendaDyspo[] = [];
    this.calendarMonthData.days.forEach((day) => {
      dyspos.push({
        time: day.time,
        userDyspo: day.userDyspo || UserDyspoStatus.NODYSPO,
        month: getMonth(day.time),
        year: getYear(day.time),
      });
    });

    console.log(dyspos);
  }
}
