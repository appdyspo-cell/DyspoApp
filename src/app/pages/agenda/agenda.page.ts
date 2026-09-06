import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  ActionSheetController,
  ModalController,
  NavController,
} from '@ionic/angular';
import {
  addHours,
  format,
  getDate,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  setHours,
} from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import {
  CalendarComponentOptions,
  CalendarDay,
  CalendarMonth,
} from 'src/app/calendar';
type CalendarMode = 'day' | 'month' | 'week';
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
import { CalendarService } from 'src/app/services/calendar.service';
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
    standalone: false
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
  calendarEventDates: Set<string> = new Set();
  calendarCommonEventDates: Set<string> = new Set();  // événements partagés → bulle rose

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

  activeFilter: string | null = null;
  myDysposForCommon: AgendaDyspoItem[] = [];
  showCommonDatesOnly = false;

  constructor(
    public agendaSvc: AgendaService,
    public navCtrl: NavController,
    private utils: UtilsService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private calendarSvc: CalendarService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public userSvc: UserService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
            // onSnapshot Firebase s'exécute hors de la zone Angular (@angular/fire v20).
            // NgZone.run() garantit que les mises à jour déclenchent bien le cycle CD
            // et que la chaîne AgendaPage → CalendarComponent → MonthComponent se met à jour.
            this.ngZone.run(() => {
              console.log('Ag events', agendaEvents.length, 'events, dates:', agendaEvents.slice(0,2).map(e => e.ref_start_ISO?.substring(0,10)));
              this.agendaEvents = agendaEvents;
              this.buildCalendarEventDates();
              this.tagCalendarEventsDataForMonth();
            });
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
              this.cdr.detectChanges();
            }
          }
        );

        // this.selectedDateMs = new Date().getTime();
        // this.selectedDateFormatted = this.utils.formatDate(
        //   new Date().getTime()
        // );
        // this.getAgendaEventsForDate(this.selectedDateMs);
      } else if (this.dataMode === 'friend') {
        // Check if shareAgenda is allowed

        this.isFriendMode = true;
        this.agendaFriend =
          this.router.getCurrentNavigation()?.extras.state?.['friend'];
        console.log('Friend Ag events', this.agendaFriend);
        const friendUid = this.agendaFriend?.friend_uid || this.agendaFriend?.uid;
        if (!friendUid) {
          this.utils.showToastError('Utilisateur introuvable');
          return;
        }
        const friendData = await this.agendaSvc.getUserAgendaEventsAndDyspos(
          friendUid,
          true
        );
        if (friendData.allowShare) {
          // On récupère d'abord les données asynchrones (hors zone, c'est OK pour les requêtes)
          const myData = await this.agendaSvc.getUserAgendaEventsAndDyspos(
            this.userSvc.userInfo!.uid, false
          );
          // Puis on met à jour la vue dans la zone Angular —
          // indispensable sur iOS avec @angular/fire v20 (les callbacks s'exécutent hors zone)
          this.ngZone.run(() => {
            this.agendaEvents = friendData.agendaEvents;
            this.buildCalendarEventDates(); // construit calendarEventDates (Set) → bulles de l'ami
            this.tagCalendarEventsDataForMonth();
            this.agendaDyspos = friendData.dyspos;
            this.tagCalendarUserDyspoData();
            this.myDysposForCommon = myData.dyspos;
            this.cdr.detectChanges(); // force le repaint du calendrier après chargement async
          });
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

  ionViewWillEnter() {
    this.buildCalendarEventDates();
    if (this.calendarMonthData) {
      this.tagCalendarEventsDataForMonth();
      this.tagCalendarUserDyspoData();
    }
    this.cdr.detectChanges();
    this.handlePendingDeepLink();
  }

  private handlePendingDeepLink() {
    const uid = this.agendaSvc.pendingDeepLinkEventUid;
    if (!uid) return;
    this.agendaSvc.pendingDeepLinkEventUid = null;
    const event = this.agendaSvc.agendaEvents.find((e) => e.uid === uid);
    if (event) {
      this.openEvent(event);
    }
  }

  ngOnDestroy() {
    if (this.agendaEventsSubscription) {
      this.agendaEventsSubscription.unsubscribe();
    }
    if (this.agendaDysposSubscription) {
      this.agendaDysposSubscription.unsubscribe();
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
    if (this.userSvc.userInfo?.firstConnexion) {
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
    if (this.isFriendMode) this.tagCommonDates();
    this.cdr.detectChanges();
  }

  buildCalendarEventDates() {
    const dates = new Set<string>();
    const commonDates = new Set<string>(); // événements partagés (bulle rose)
    this.agendaEvents.forEach((ev) => {
      let startStr: string;
      let endStr: string;
      if (ev.ref_start_ISO) {
        startStr = ev.ref_start_ISO.substring(0, 10);
        endStr = ev.ref_end_ISO ? ev.ref_end_ISO.substring(0, 10) : startStr;
      } else {
        startStr = format(new Date(ev.start_date_ts), 'yyyy-MM-dd');
        endStr = format(new Date(ev.end_date_ts), 'yyyy-MM-dd');
      }
      const isShared = ev.is_multi || (ev.members_uid?.length ?? 0) > 1;
      // Pour les événements multi-jours, ajouter chaque jour de la plage
      let current = startStr;
      while (current <= endStr) {
        dates.add(current);
        if (isShared) commonDates.add(current);
        const d = new Date(current);
        d.setDate(d.getDate() + 1);
        current = format(d, 'yyyy-MM-dd');
        if (current > endStr) break;
      }
    });
    this.calendarEventDates = dates;
    this.calendarCommonEventDates = commonDates;
    console.log('[AgendaPage] calendarEventDates:', dates.size, 'dates, shared:', commonDates.size);
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
      // const prob = this.agendaEvents.find(
      //   (elt) => elt.uid === 'agev_1712933342454'
      // );
      // console.log('Probleme with this event', prob);

      this.calendarMonthData.days.forEach((day) => {
        if (!day) return; // Guard : peut être null si monthOpt est corrompu

        day.isEvent = false;

        // Date du jour au format YYYY-MM-DD (heure locale) — indépendant du fuseau
        const calDayStr = format(new Date(day.time), 'yyyy-MM-dd');

        this.agendaEvents.forEach((agendaEvent) => {
          let eventStartStr: string;
          let eventEndStr: string;
          if (agendaEvent.ref_start_ISO) {
            eventStartStr = agendaEvent.ref_start_ISO.substring(0, 10);
            eventEndStr   = agendaEvent.ref_end_ISO
              ? agendaEvent.ref_end_ISO.substring(0, 10)
              : eventStartStr;
          } else {
            eventStartStr = format(new Date(agendaEvent.start_date_ts), 'yyyy-MM-dd');
            eventEndStr   = format(new Date(agendaEvent.end_date_ts), 'yyyy-MM-dd');
          }

          if (calDayStr >= eventStartStr && calDayStr <= eventEndStr) {
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
      const days = this.calendarMonthData.days;

      // Normalise "zone_A" → "A" pour correspondre aux deux formats possibles
      const normalizeZone = (z: string | undefined) =>
        (z ?? '').replace('zone_', '').toUpperCase();
      const userZone = normalizeZone(this.userSvc.userInfo?.geo_zone);

      // Normalise un timestamp qui pourrait être en secondes ou en millisecondes
      const toMs = (ts: number) => (ts < 1e10 ? ts * 1000 : ts);

      days.forEach((day) => {
        day.isHolidays = false;
        if (!userZone) return;
        this.holidays.forEach((h) => {
          if (
            normalizeZone(h.geo_zone) === userZone &&
            toMs(h.start_date_ts) <= day.time &&
            toMs(h.end_date_ts)   >= day.time
          ) {
            day.isHolidays = true;
          }
        });
      });

      days.forEach((day, i) => {
        if (day.isHolidays) {
          const dow = new Date(day.time).getDay(); // 0=Sun, 1=Mon
          day.isHolidaysFirst = !days[i - 1]?.isHolidays || dow === 1;
          day.isHolidaysLast  = !days[i + 1]?.isHolidays || dow === 0;
        } else {
          day.isHolidaysFirst = false;
          day.isHolidaysLast  = false;
        }
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
  async openCreateEventForFriend() {
    const todayMorning = setHours(new Date(), 0);
    if (isBefore(new Date(addHours(this.selectedDateMs!, 1)), todayMorning)) {
      this.utils.showAlert('Vous ne pouvez pas créer un événement dans le passé');
      return;
    }
    const navigationExtras: NavigationExtras = {
      state: {
        tsDate: this.selectedDateMs,
        is_multi: true,
        preInvitedFriend: this.agendaFriend,
      },
    };
    this.navCtrl.navigateForward('/agenda/me/create-event/new', navigationExtras);
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
      cssClass: 'dyspo-sheet-no-dyspo',
      data: {
        is_multi: false,
      },
    });

    buttons.push({
      text: 'Événement avec mes amis',
      cssClass: 'dyspo-sheet-dyspo',
      data: {
        is_multi: true,
      },
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'On fait quoi ?',
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

  isCommonEvent(agendaEvent: AgendaEvent): boolean {
    return !!this.my_info?.uid && agendaEvent.members_uid.includes(this.my_info.uid);
  }

  addToCalendar(agendaEvent: AgendaEvent, event: Event) {
    event.stopPropagation();
    this.calendarSvc.promptAddToCalendar(agendaEvent);
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

  async openHelp() {
    const modal = await this.modalCtrl.create({
      component: HelperComponent,
      componentProps: { showHelper: ShowHelper.AGENDA },
    });
    modal.present();
  }

  // To include for private multi event
  displayEventTitle(agendaEvent: AgendaEvent) {
    if (agendaEvent.all_can_see_title || this.isFriendMode === false) {
      return agendaEvent.title;
    } else if (!agendaEvent.all_can_see_title) {
      const members = agendaEvent.members_uid.concat(
        agendaEvent.members_invited_uid
      );
      if (!members.includes(this.userSvc.userInfo?.uid!)) {
        return 'Événement privé';
      } else {
        return agendaEvent.title;
      }
    }
    {
      return 'Événement privé';
    }
  }

  toggleFilter(filter: string) {
    if (this.showCommonDatesOnly) {
      this.showCommonDatesOnly = false;
      this.tagCommonDates();
    }
    this.activeFilter = this.activeFilter === filter ? null : filter;
  }

  async onLongPressDay(day: CalendarDay) {
    if (this.isFriendMode) return;
    this.selectedDateMs = day.time;
    this.selectedDate = day;
    this.selectedDateFormatted = this.utils.formatDate(day.time);
    await this.openCreateEvent();
  }

  toggleCommonDates() {
    this.showCommonDatesOnly = !this.showCommonDatesOnly;
    this.activeFilter = null;
    this.tagCommonDates();
  }

  tagCommonDates() {
    if (!this.calendarMonthData) return;
    this.calendarMonthData.days.forEach((day) => {
      day.cssClass = (day.cssClass || '').replace(/\bfilter-dimmed\b/g, '').trim();
      if (this.showCommonDatesOnly && !day.isLastMonth && !day.isNextMonth) {
        const myDyspo = this.myDysposForCommon.find((d) => isSameDay(d.time, day.time));
        const myStatus = myDyspo?.userDyspo ?? UserDyspoStatus.UNDEFINED;
        const friendStatus = day.userDyspo ?? UserDyspoStatus.UNDEFINED;
        // Afficher uniquement les jours où les deux ont exactement le même statut
        // et que ce statut est une disponibilité réelle (DYSPO ou DYSPOWITHKIDS)
        const sameAvailableStatus =
          myStatus === friendStatus &&
          (myStatus === UserDyspoStatus.DYSPO || myStatus === UserDyspoStatus.DYSPOWITHKIDS);
        if (!sameAvailableStatus) {
          day.cssClass = ((day.cssClass || '') + ' filter-dimmed').trim();
        }
      }
    });
  }
}
