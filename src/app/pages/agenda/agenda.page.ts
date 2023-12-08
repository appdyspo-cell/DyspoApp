import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import {
  getDate,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import {
  CalendarComponentOptions,
  CalendarDay,
  CalendarMonth,
} from 'src/app/calendar';
import { CalendarMode } from 'src/app/components/calendar';
import {
  AgendaDyspoItem,
  AgendaEvent,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UtilsService } from 'src/app/services/utils.service';

import { cloneDeep } from 'lodash';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';

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

  // agendaDyspos$: Observable<{
  //   action: 'MODIFIED' | 'ADDED' | 'REMOVED';
  //   items: AgendaDyspoItem[];
  // }>;
  agendaDyspos: AgendaDyspoItem[] = [];
  agendaDysposSubscription: Subscription;

  agendaMode: AgendaMode = AgendaMode.READONLY;
  selectedDateFormatted: any;
  selectedDateMs: number;

  agendaModes = AgendaMode;
  calendarMonthData!: CalendarMonth;
  originalCalendarMonthData!: CalendarMonth;
  isModified = false;

  constructor(
    public agendaSvc: AgendaService,
    private navCtrl: NavController,
    private utils: UtilsService,
    private modalCtrl: ModalController,
    private route: Router
  ) {
    this.agendaEvents$ = this.agendaSvc.agendaEvents$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents: AgendaEvent[]) => {
        this.agendaEvents = agendaEvents;
        this.tagCalendarEventsData();
      }
    );

    //this.agendaDyspos$ = this.agendaSvc.agendaDyspos$;
    this.agendaDysposSubscription = this.agendaSvc.agendaDyspos$.subscribe(
      (agendaDyspos) => {
        console.log(agendaDyspos.action);
        if (
          agendaDyspos.action === 'ADDED' ||
          agendaDyspos.action === 'MODIFIED'
        ) {
          this.agendaDyspos = agendaDyspos.items;
          this.tagCalendarUserDyspoData();
        }
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
    this.agendaSvc.isModified = true;
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
    }
  }

  onCreateMonthEvent(calendarMonthData: CalendarMonth) {
    console.log('Month created !!!!', calendarMonthData);
    this.calendarMonthData = calendarMonthData;
    this.originalCalendarMonthData = cloneDeep(this.calendarMonthData);
    this.agendaSvc.isModified = false;
    this.tagCalendarEventsData();
    this.tagCalendarUserDyspoData();
  }

  tagCalendarEventsData() {
    if (!this.calendarMonthData) {
      console.log('Can not tag calendar data');
    } else {
      this.eventsForDate = [];
      this.calendarMonthData.days.forEach((day) => {
        this.agendaEvents.forEach((agendaEvent) => {
          if (isSameDay(day.time, parseISO(agendaEvent.startISO))) {
            day.isEvent = true;
            this.eventsForDate.push(agendaEvent);
            //day.subTitle = agendaEvent.title?.substring(0, 5);
          }
        });
      });
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
  }

  getAgendaEventsForCurrentMonth() {
    this.eventsForDate = [];
    this.eventsForDate = this.agendaEvents.filter((elt: AgendaEvent) =>
      isSameMonth(
        this.calendarMonthData?.original.month,
        parseISO(elt.startISO)
      )
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

  tagCalendarUserDyspoData() {
    if (!this.calendarMonthData) {
      console.log('Can not tag calendar data');
    } else {
      this.calendarMonthData.days.forEach((day) => {
        this.agendaDyspos.forEach((dyspoItem) => {
          if (isSameDay(day.time, dyspoItem.time)) {
            day.userDyspo = dyspoItem.userDyspo;
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
  updateEvent(agendaEvent: AgendaEvent, event: any) {
    event.stopPropagation();
    const navigationExtras: NavigationExtras = {
      state: {
        agendaEvent,
      },
    };
    this.navCtrl.navigateForward('/agenda/create-event/edit', navigationExtras);
  }

  async openEvent(agendaEvent: AgendaEvent, event: any) {
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent,
        isInvitation: false,
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
    }
  }

  saveAgenda() {
    console.log('Save ', this.calendarMonthData);

    const agendaDyspoItems: AgendaDyspoItem[] = [];

    this.calendarMonthData.days.forEach((day) => {
      if (
        day.userDyspo === UserDyspoStatus.DYSPO ||
        day.userDyspo === UserDyspoStatus.DYSPOWITHKIDS ||
        day.userDyspo === UserDyspoStatus.NODYSPO
      )
        agendaDyspoItems.push({
          time: day.time,
          userDyspo: day.userDyspo,
          month: getMonth(day.time),
          year: getYear(day.time),
          day: getDate(day.time),
        });
    });

    console.log(agendaDyspoItems);

    this.agendaSvc.saveDyspos(agendaDyspoItems);
    this.agendaSvc.isModified = false;
  }

  cancelAgenda() {
    // this.originalCalendarMonthData.days.forEach((origDay) => {
    //   let day = this.calendarMonthData.days.find((elt) => {
    //     return elt.time === origDay.time;
    //   });
    //   if (day) {
    //     // Copy all props ?
    //     day.userDyspo = origDay.userDyspo;
    //   }
    // });

    this.originalCalendarMonthData.days.forEach((origDay) => {
      let day = this.calendarMonthData.days.find((elt) => {
        return elt.time === origDay.time;
      });
      if (day) {
        // Copy all props ?
        day.userDyspo = UserDyspoStatus.UNDEFINED;
      }
    });
    this.tagCalendarUserDyspoData();
    this.agendaSvc.isModified = false;
  }

  goToChat(agendaEvent: AgendaEvent | undefined, event: any) {
    event.stopPropagation();
    console.log('goToChat', agendaEvent);

    if (agendaEvent) {
      const navigationExtras: NavigationExtras = {
        state: {
          agendaEvent,
        },
      };
      this.navCtrl.navigateForward('/group-chatting', navigationExtras);
      //this.route.navigate(['chat-home'], navigationExtras);
    }
  }
}
