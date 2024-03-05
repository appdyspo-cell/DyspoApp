import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  ActionSheetController,
  ModalController,
  NavController,
  NavParams,
} from '@ionic/angular';
import {
  addHours,
  getDate,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isPast,
  isSameDay,
  isSameMonth,
  parseISO,
  setHours,
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
  AppUser,
  Friend,
  HolidaysEvent,
  ShowHelper,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UtilsService } from 'src/app/services/utils.service';

import { cloneDeep } from 'lodash';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { UserService } from 'src/app/services/user.service';
import { Preferences } from '@capacitor/preferences';
import { HelperComponent } from 'src/app/components/helper/helper.component';

export enum AgendaMode {
  SELECT,
  EDIT,
  READONLY,
  FRIEND,
}

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
})
export class AgendaPage implements AfterViewInit {
  @ViewChild('mydiv') mydiv!: ElementRef;
  agendaModeEnum = AgendaMode;
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

  agendaEvents$: Observable<AgendaEvent[]> | undefined;
  agendaEvents: AgendaEvent[] = [];
  agendaEventsSubscription: Subscription | undefined;

  agendaDyspos: AgendaDyspoItem[] = [];
  agendaDysposSubscription: Subscription | undefined;

  holidays: HolidaysEvent[] = [];
  holidaysSubscription: Subscription | undefined;

  agendaMode: AgendaMode = AgendaMode.READONLY;
  isFriendMode = false;
  selectedDateFormatted: any;
  selectedDateMs: number | undefined;

  agendaModes = AgendaMode;
  calendarMonthData!: CalendarMonth;
  originalCalendarMonthData!: CalendarMonth;
  isModified = false;
  dataMode = '';
  agendaFriend: Friend | undefined;
  userSubscription: Subscription;
  my_info!: AppUser;
  showHelper = false;

  constructor(
    public agendaSvc: AgendaService,
    public navCtrl: NavController,
    private utils: UtilsService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public userSvc: UserService
  ) {
    this.userSubscription = this.userSvc.appUserInfoObs$.subscribe((user) => {
      this.my_info = user;

      console.log('user subscription profile page', user);
    });
    this.activatedRoute.params.subscribe(async (params) => {
      this.dataMode = params['dataMode'];
      if (this.dataMode !== 'friend') {
        this.agendaEvents$ = this.agendaSvc.agendaEvents$;
        this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
          (agendaEvents: AgendaEvent[]) => {
            console.log('Ag events');
            this.agendaEvents = agendaEvents;
            this.tagCalendarEventsDataForMonth();
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
        this.selectedDateFormatted = this.utils.formatDate(
          new Date().getTime()
        );
        this.getAgendaEventsForDate(this.selectedDateMs);
      } else if (this.dataMode === 'friend') {
        // Check if shareAgenda is allowed

        this.isFriendMode = true;
        this.agendaFriend =
          this.router.getCurrentNavigation()?.extras.state?.['friend'];
        console.log('Friend Ag events');
        const friendData = await this.agendaSvc.getUserAgendaEventsAndDyspos(
          this.agendaFriend!.friend_uid!,
          true
        );
        if (friendData.allowShare) {
          this.agendaEvents = friendData.agendaEvents;
          this.tagCalendarEventsDataForMonth();
          this.agendaDyspos = friendData.dyspos;
          this.tagCalendarUserDyspoData();
        } else {
          this.utils.showAlert('Ne souhaite pas partager son calendrier');
        }
      }

      this.holidaysSubscription = this.agendaSvc.holidays$.subscribe(
        (holidays) => {
          console.log(holidays.action);
          this.holidays = holidays.items;
          this.tagHolidays();
        }
      );
    });
  }

  ngOnDestroy() {
    if (this.agendaEventsSubscription) {
      this.agendaEventsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.holidaysSubscription) {
      this.holidaysSubscription.unsubscribe();
    }
  }

  onChangeMode(ev: any) {
    if (ev.detail.checked) {
      this.agendaMode = AgendaMode.EDIT;
    } else {
      this.agendaMode = AgendaMode.READONLY;
    }
  }

  async ngAfterViewInit() {
    const { value } = await Preferences.get({ key: ShowHelper.AGENDA });
    if (!value) {
      this.showHelper = true;
      const modal = await this.modalCtrl.create({
        component: HelperComponent,
        componentProps: {
          showHelper: ShowHelper.AGENDA,
        },
      });
      modal.present();

      await Preferences.set({
        key: ShowHelper.AGENDA,
        value: 'SHOWN',
      });
    }
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
    this.tagCalendarEventsDataForMonth();
    this.tagCalendarUserDyspoData();
    this.tagHolidays();
  }

  tagCalendarEventsDataForMonth() {
    if (!this.calendarMonthData) {
      console.log('Can not tag calendar data');
    } else {
      this.eventsForDate = [];
      this.selectedDate = undefined;
      this.selectedDateMs = undefined;
      this.selectedDateFormatted = this.utils.formatMonth(
        this.calendarMonthData.original.time
      );
      this.calendarMonthData.days.forEach((day) => {
        day.isEvent = false;

        this.agendaEvents.forEach((agendaEvent) => {
          if (
            agendaEvent.start_date_ts <= day.time &&
            agendaEvent.end_date_ts >= day.time
          ) {
            day.isEvent = true;
            //Prevent doublons for long events
            const foundIndex = this.eventsForDate.findIndex((evForDate) => {
              return evForDate.uid === agendaEvent.uid;
            });
            if (foundIndex < 0) {
              this.eventsForDate.push(agendaEvent);
            }
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

  tagHolidays() {
    if (!this.calendarMonthData) {
      console.log('Can not tag calendar holidays');
    } else {
      this.calendarMonthData.days.forEach((day) => {
        day.isHolidays = false;

        this.holidays.forEach((h) => {
          if (
            h.geo_zone === this.userSvc.userInfo?.geo_zone &&
            h.start_date_ts <= day.time &&
            h.end_date_ts >= day.time
          ) {
            day.isHolidays = true;
          }
        });
      });
    }
  }

  getAgendaEventsForDate(ts: number) {
    this.eventsForDate = [];
    this.eventsForDate = this.agendaEvents.filter(
      (elt: AgendaEvent) => {
        return elt.start_date_ts <= ts && elt.end_date_ts >= ts;
      }
      //isSameDay(ev.time, parseISO(elt.startISO))
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
    // if (this.isFriendMode) {
    //   return;
    // }
    if (this.agendaMode === AgendaMode.READONLY) {
      console.log('Selected read only ', ev);

      this.selectedDate = ev[0];
      this.selectedDateFormatted = this.utils.formatDate(ev[0].time);
      this.selectedDateMs = ev[0].time;

      //this.openCreateEvent();
      this.getAgendaEventsForDate(ev[0].time);
    }
  }
  async openCreateEvent() {
    const todayMorning = setHours(new Date(), 0);
    console.log();
    if (isBefore(new Date(addHours(this.selectedDateMs!, 1)), todayMorning)) {
      this.utils.showAlert(
        'Vous ne pouvez pas créer un événement dans le passé'
      );
      return;
    }

    const buttons = [];
    buttons.push({
      text: 'Rendez-vous personnel',
      // cssClass: 'dyspo-sheet-dyspo',
      data: {
        is_multi: false,
      },
    });

    buttons.push({
      text: 'Événement avec mes amis',
      // cssClass: 'dyspo-sheet-dyspo-with-kids',
      data: {
        is_multi: true,
      },
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: "Saisissez le type d'événement",
      cssClass: 'dyspo-sheet',
      buttons,
    });

    await actionSheet.present();

    let result = await actionSheet.onDidDismiss();
    if (result.data) {
      const navigationExtras: NavigationExtras = {
        state: {
          tsDate: this.selectedDateMs,
          is_multi: result.data.is_multi,
        },
      };
      this.navCtrl.navigateForward(
        '/agenda/me/create-event/new',
        navigationExtras
      );
    }
  }

  updateEvent(agendaEvent: AgendaEvent, event: any) {
    event.stopPropagation();
    const navigationExtras: NavigationExtras = {
      state: {
        agendaEvent,
      },
    };
    this.navCtrl.navigateForward(
      '/agenda/me/create-event/edit',
      navigationExtras
    );
  }

  async openEvent(agendaEvent: AgendaEvent) {
    if (this.isFriendMode) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent,
        isInvitation: false,
        isMulti: agendaEvent.is_multi,
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
        day.userDyspo === UserDyspoStatus.NODYSPO ||
        day.userDyspo === UserDyspoStatus.UNDEFINED
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
