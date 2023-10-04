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
import { formatISO } from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import { CalendarComponentOptions } from 'src/app/calendar';
import { CalendarMode } from 'src/app/components/calendar';
import { AgendaEvent } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';

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
  optionsMulti: CalendarComponentOptions = {
    pickMode: 'multi',
    showMonthPicker: true,
    showToggleButtons: true,
  };

  eventsForDate: any;
  selectedDate: any;

  agendaEvents$: Observable<AgendaEvent[]>;
  agendaEvents: AgendaEvent[] = [];
  agendaEventsSubscription: Subscription;

  constructor(
    private gestureCtrl: GestureController,
    private agendaSvc: AgendaService,
    private navCtrl: NavController
  ) {
    this.agendaEvents$ = this.agendaSvc.agendaEvents$;
    this.agendaEventsSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents: AgendaEvent[]) => {
        console.log('Agenda Events  ', agendaEvents);
        this.agendaEvents = agendaEvents;
      }
    );
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
    // gesture.enable();
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
    console.log('Selected ', ev);
    getEvents(ev.time);
    this.selectedDate = ev;
  }
  addEvent() {
    const navigationExtras: NavigationExtras = {
      state: {
        tsDate: this.selectedDate.time,
      },
    };
    this.navCtrl.navigateForward('/agenda/create-event/new', navigationExtras);
  }
}
function getEvents(selectedDateMs: number) {
  console.log(formatISO(selectedDateMs));

  //throw new Error('Function not implemented.');
}
