import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Gesture,
  GestureController,
  GestureDetail,
  IonDatetime,
  NavController,
} from '@ionic/angular';
import { CalendarComponentOptions } from 'src/app/calendar';
import { CalendarMode } from 'src/app/components/calendar';

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
  constructor(private gestureCtrl: GestureController, private navCtrl: NavController) {}

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
    //console.log(ev);
  }
  onItemSwipe(ev: any) {
    console.log('Sxipe');
  }
  onSelect(ev:any){
    console.log('Selected ', ev);
    this.navCtrl.navigateForward('/agenda/create-event');
  }
}
