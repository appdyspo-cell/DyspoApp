import {
  Component,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  CalendarDay,
  CalendarMonth,
  CalendarOriginal,
  PickMode,
} from '../calendar.model';
import { defaults, pickModes } from '../config';
import { ActionSheetController, GestureController } from '@ionic/angular';
import * as Hammer from 'hammerjs';
import $$ from 'dom7';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { UserDyspoStatus } from 'src/app/models/models';

export const MONTH_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MonthComponent),
  multi: true,
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ion-calendar-month',
  providers: [MONTH_VALUE_ACCESSOR],
  styleUrls: ['./month.component.scss'],
  // tslint:disable-next-line:use-host-property-decorator
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '[class.component-mode]': 'componentMode',
  },
  template: `
    <div
      [class]="color"
      #calendarmonth
      (panend)="onPanEnd($event)"
      (panmove)="onPanMove($event)"
    >
      <ng-template [ngIf]="!_isRange" [ngIfElse]="rangeBox">
        <div class="days-box">
          <ng-template ngFor let-day [ngForOf]="month.days || []">
            <div class="days" style="position: relative;">
              <ng-container *ngIf="day">
                <button
                  type="button"
                  [id]="'btn-day-' + day.time"
                  [class]="'days-btn ' + day.cssClass"
                  [class.p-day]="true"
                  [class.today]="day.isToday"
                  (tap)="onSelected(day, $event)"
                  (doubletap)="onDoubleTap($event, day)"
                  (press)="onLongPress($event, day)"
                  [class.marked]="day.marked"
                  [class.last-month-day]="day.isLastMonth"
                  [class.next-month-day]="day.isNextMonth"
                  [class.on-selected]="isSelected(day.time)"
                  [class.on-selected-pan]="isSelectedPan(day.time)"
                  [class.on-selected-dyspo-kids]="
                    day.userDyspo === userDyspoStatus.DYSPOWITHKIDS
                  "
                  [class.on-selected-dyspo]="
                    day.userDyspo === userDyspoStatus.DYSPO
                  "
                  [class.on-selected-no-dyspo]="
                    day.userDyspo === userDyspoStatus.NODYSPO
                  "
                  [disabled]="day.disable"
                  [attr.aria-label]="getDayLabel(day) | date : DAY_DATE_FORMAT"
                >
                  <p
                    [id]="'day-' + day.time"
                    class="p-day"
                    [class.p-selected]="
                      day.userDyspo === userDyspoStatus.DYSPOWITHKIDS ||
                      day.userDyspo === userDyspoStatus.DYSPO ||
                      day.userDyspo === userDyspoStatus.NODYSPO
                    "
                  >
                    {{ day.title }}
                  </p>
                  <small *ngIf="day.subTitle">{{ day?.subTitle }}</small>
                </button>
                <div *ngIf="day.isEvent" class="event-badge">&nbsp;</div>
              </ng-container>
            </div>
          </ng-template>
        </div>
      </ng-template>

      <ng-template #rangeBox>
        <div class="days-box">
          <ng-template ngFor let-day [ngForOf]="month.days || []">
            <div
              class="days"
              [class.startSelection]="isStartSelection(day)"
              [class.endSelection]="isEndSelection(day)"
              [class.is-first-wrap]="day?.isFirst"
              [class.is-last-wrap]="day?.isLast"
              [class.between]="isBetween(day)"
            >
              <ng-container *ngIf="day">
                <button
                  id="xf"
                  type="button"
                  [class]="'days-btn ' + day.cssClass"
                  [class.today]="day.isToday"
                  (click)="onSelected(day, $event)"
                  [class.marked]="day.marked"
                  [class.last-month-day]="day.isLastMonth"
                  [class.next-month-day]="day.isNextMonth"
                  [class.is-first]="day.isFirst"
                  [class.is-last]="day.isLast"
                  [class.on-selected-dyspo-kids]="
                    day.userDyspo === userDyspoStatus.DYSPOWITHKIDS
                  "
                  [class.on-selected-dyspo]="
                    day.userDyspo === userDyspoStatus.DYSPO
                  "
                  [class.on-selected]="isSelected(day.time)"
                  [disabled]="day.disable"
                >
                  <p [id]="'day-' + day.time">{{ day.title }}</p>
                  <small *ngIf="day.subTitle">{{ day?.subTitle }}</small>
                </button>
              </ng-container>
            </div>
          </ng-template>
        </div>
      </ng-template>
    </div>
  `,
})
export class MonthComponent implements ControlValueAccessor, AfterViewInit {
  //@ViewChild('calendarmonth', { static: true }) myElement!: ElementRef;

  @ViewChild('calendarmonth', { read: ElementRef }) myElement!: ElementRef;
  @Input() componentMode = false;
  @Input()
  public month!: CalendarMonth;
  @Input()
  public pickMode!: PickMode | string | undefined;
  @Input()
  public isSaveHistory!: boolean;
  @Input()
  public id!: any;
  @Input()
  public readonly = false;
  @Input()
  public color?: string = defaults.COLOR;

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  public change: EventEmitter<CalendarDay[]> = new EventEmitter();

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  public selectReadOnly: EventEmitter<CalendarDay[]> = new EventEmitter();
  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  public select: EventEmitter<CalendarDay> = new EventEmitter();
  @Output()
  public selectStart: EventEmitter<CalendarDay> = new EventEmitter();
  @Output()
  public selectEnd: EventEmitter<CalendarDay> = new EventEmitter();

  public _date: Array<CalendarDay | null> = [null, null];
  _isInit = false;
  public _onChanged!: Function;
  public _onTouched!: Function;

  readonly DAY_DATE_FORMAT = 'MMMM dd, yyyy';
  longPressedDay: CalendarDay | undefined;
  startDay: CalendarDay | undefined;
  startDayIndex = -1;

  _selectedPanDays: CalendarDay[] = [];
  userDyspoStatus = UserDyspoStatus;

  get _isRange(): boolean {
    return this.pickMode === pickModes.RANGE;
  }

  constructor(
    public ref: ChangeDetectorRef,
    private gestureCtrl: GestureController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  onPanEnd(ev: any) {
    console.log('pan end');
    if (this.readonly) {
      console.log('Read Only Mode');

      return;
    }
    console.log('_selectedPanDays ', this._selectedPanDays);
    console.log('_date ', this._date);
    if (this._selectedPanDays?.length > 0) {
      this.presentAction();
    } else {
      this.startDayIndex = -1;
      this._selectedPanDays = [];
    }
  }

  onPanMove(ev: any) {
    if (this.readonly) {
      console.log('Read Only Mode');

      return;
    }
    const targetElement = document.elementFromPoint(ev.center.x, ev.center.y);

    if (targetElement && targetElement.classList.contains('p-day')) {
      // L'élément Ionic survolé a été trouvé

      const targetDayObj = this.getCalendarDayFromId(targetElement.id);
      if (targetDayObj) {
        const targetDayIndex: number = targetDayObj.index;
        const targetDay: CalendarDay = targetDayObj.day;

        if (!this.startDay || this.startDayIndex < 0) {
          this.startDay = targetDay;
          this.startDayIndex = targetDayIndex as number;
          this._selectedPanDays.push(this.startDay);
        } else if (targetDayIndex !== this.startDayIndex) {
          this._selectedPanDays = [];

          // On recupere l'intervalle des dates
          for (let i = this.startDayIndex; i <= targetDayIndex; i++) {
            //this.month.days[i].selected = true;
            //this.month.days[i].subTitle = '*';
            //this.select.emit(this.month.days[i]);
            // this._date.push(this.month.days[i]);
            this._selectedPanDays.push(this.month.days[i]);
          }
        } else if (targetDayIndex === this.startDayIndex) {
          this._selectedPanDays = [this.startDay];
        }
      }
    }
  }

  updateDays(action: UserDyspoStatus) {
    this._selectedPanDays.forEach((item) => {
      //item.selected = true;
      // item.subTitle = action;
      item.userDyspo = action;
      //this.select.emit(item);

      const index = this._date.findIndex(
        (e) => e !== null && e.time === item.time
      );

      if (index === -1) {
        this._date.push(item);
      }

      //console.log(item);
    });

    console.log(this._date);
    this.change.emit((this._date as CalendarDay[]).filter((e) => e !== null));
    // this.startDay = undefined;
    this.startDayIndex = -1;
    this._selectedPanDays = [];
  }

  async presentAction() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Dyspo',
      cssClass: 'dyspo-sheet',
      buttons: [
        {
          text: 'Dyspo',
          cssClass: 'dyspo-sheet-dyspo',
          data: {
            action: UserDyspoStatus.DYSPO,
          },
        },
        {
          text: 'Dyspo with Kid(s)',
          cssClass: 'dyspo-sheet-dyspo-with-kids',
          data: {
            action: UserDyspoStatus.DYSPOWITHKIDS,
          },
        },
        {
          text: 'No Dyspo',
          cssClass: 'dyspo-sheet-no-dyspo',
          data: {
            action: UserDyspoStatus.NODYSPO,
          },
        },
      ],
    });

    await actionSheet.present();

    let result = await actionSheet.onDidDismiss();
    if (result.data) {
      this.updateDays(result.data.action);
    } else {
      this.startDayIndex = -1;
      this._selectedPanDays = [];
    }
  }

  ngAfterViewInit(): void {
    console.log('after view init month comp');
    this._isInit = true;
    const element = this.myElement.nativeElement;
    const hammer = new Hammer.Manager(element);
    const tap = new Hammer.Tap({ event: 'tap' });
    const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });

    hammer.add([doubleTap, tap]);
    doubleTap.requireFailure(tap);

    // const gesture = this.gestureCtrl.create({
    //   el: element,
    //   onStart: (ev) => {},
    //   onEnd: (ev) => {},
    //   onMove: (ev) => {},
    //   gestureName: 'mygg',
    // });

    // gesture.enable();

    // hammer.on('tap', (event: any) => {
    //   // Gestion de l'événement de tap
    //   console.log('Tap détecté', event);
    // });

    // hammer.on('doubletap', (event: any) => {
    //   // Gestion de l'événement de double tap
    //   console.log('Double tap détecté', event);
    // });
  }

  get value() {
    return this._date;
  }

  writeValue(obj: any): void {
    if (Array.isArray(obj)) {
      this._date = obj;
    }
  }

  registerOnChange(fn: any): void {
    this._onChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  trackByTime(item: CalendarOriginal) {
    return item ? item.time : 0;
  }

  isEndSelection(day: CalendarDay): boolean {
    if (!day) return false;
    if (
      this.pickMode !== pickModes.RANGE ||
      !this._isInit ||
      this._date[1] === null
    ) {
      return false;
    }

    return this._date[1].time === day.time;
  }

  getDayLabel(day: CalendarDay) {
    return new Date(day.time);
  }

  isBetween(day: CalendarDay): boolean {
    if (!day) return false;

    if (this.pickMode !== pickModes.RANGE || !this._isInit) {
      return false;
    }

    if (this._date[0] === null || this._date[1] === null) {
      return false;
    }

    const start = this._date[0].time;
    const end = this._date[1].time;

    return day.time < end && day.time > start;
  }

  isStartSelection(day: CalendarDay): boolean {
    if (!day) return false;
    if (
      this.pickMode !== pickModes.RANGE ||
      !this._isInit ||
      this._date[0] === null
    ) {
      return false;
    }

    return this._date[0].time === day.time && this._date[1] !== null;
  }

  oldisSelected(time: number): boolean {
    if (Array.isArray(this._date) && this._date.length > 0) {
      if (this.pickMode !== pickModes.MULTI) {
        if (this._date[0] !== null) {
          return time === this._date[0].time;
        }

        if (this._date[1] !== null) {
          return time === this._date[1].time;
        }
      } else {
        return (
          this._date.findIndex((e) => e !== null && e.time === time) !== -1
        );
      }
    } else {
      return false;
    }

    return false;
  }

  isSelected(time: number): boolean {
    return false;
  }

  isSelectedPan(time: number): boolean {
    if (
      Array.isArray(this._selectedPanDays) &&
      this._selectedPanDays.length > 0
    ) {
      if (this.pickMode !== pickModes.MULTI) {
        if (this._selectedPanDays[0] !== null) {
          return time === this._selectedPanDays[0].time;
        }

        if (this._selectedPanDays[1] !== null) {
          return time === this._selectedPanDays[1].time;
        }
      } else {
        return (
          this._selectedPanDays.findIndex(
            (e) => e !== null && e.time === time
          ) !== -1
        );
      }
    } else {
      return false;
    }

    return false;
  }

  onSelected(item: CalendarDay, event?: any): void {
    if (this.readonly) {
      console.log('Read Only Mode');
      if (this.pickMode === pickModes.MULTI) {
        this.selectReadOnly.emit([item]);
      }
      return;
    }

    // // Handle double tap
    // const currentTime = new Date().getTime();
    // const tapDelay = 300; // Délai en millisecondes pour considérer le double tap

    // if (currentTime - this.lastTap < tapDelay) {
    //   // Double tap détecté
    //   console.log('Double tap détecté');
    //   return;
    // } else {
    //   // Pas de double tap, mise à jour du dernier tap
    //   this.lastTap = currentTime;
    // }

    console.log('tap Day');
    // item.selected = true;
    // this.select.emit(item);
    if (this.pickMode === pickModes.SINGLE) {
      this._date[0] = item;
      this.change.emit(this._date as CalendarDay[]);
      return;
    }

    if (this.pickMode === pickModes.RANGE) {
      if (this._date[0] === null) {
        this._date[0] = item;
        this.selectStart.emit(item);
      } else if (this._date[1] === null) {
        if (this._date[0].time < item.time) {
          this._date[1] = item;
          this.selectEnd.emit(item);
        } else {
          this._date[1] = this._date[0];
          this.selectEnd.emit(this._date[0]);
          this._date[0] = item;
          this.selectStart.emit(item);
        }
      } else if (this._date[0].time > item.time) {
        this._date[0] = item;
        this.selectStart.emit(item);
      } else if (this._date[1].time < item.time) {
        this._date[1] = item;
        this.selectEnd.emit(item);
      } else {
        this._date[0] = item;
        this.selectStart.emit(item);
        this._date[1] = null;
      }

      this.change.emit(this._date as CalendarDay[]);
      return;
    }

    // if (this.pickMode === pickModes.MULTI) {
    //   const index = this._date.findIndex(
    //     (e) => e !== null && e.time === item.time
    //   );

    //   if (index === -1) {
    //     this._date.push(item);
    //   } else {
    //     this._date.splice(index, 1);
    //   }
    //   this.change.emit((this._date as CalendarDay[]).filter((e) => e !== null));
    // }
    if (this.pickMode === pickModes.MULTI) {
      if (item.userDyspo === UserDyspoStatus.DYSPO) {
        item.userDyspo = UserDyspoStatus.DYSPOWITHKIDS;
      } else if (item.userDyspo === UserDyspoStatus.DYSPOWITHKIDS) {
        item.userDyspo = UserDyspoStatus.NODYSPO;
      } else {
        item.userDyspo = UserDyspoStatus.DYSPO;
      }
      this.change.emit([item]);
    }
  }

  async onDoubleTap(ev: any, day: CalendarDay) {
    console.log('doubletap ', ev, day);
    // if (day.userDyspo === UserDyspoStatus.DYSPOWITHKIDS) {
    //   day.userDyspo = UserDyspoStatus.DYSPO;

    //   day.subTitle = 'nokids';
    // } else {
    //   day.userDyspo = UserDyspoStatus.DYSPOWITHKIDS;
    //   day.subTitle = 'kids';
    // }
    // await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async onLongPress(ev: any, day: CalendarDay) {
    console.log('longpress ', ev, day);
    this.longPressedDay = day;

    await Haptics.vibrate();

    // Slide mode
  }
  onPan(ev: any) {
    console.log('pan ', ev);
    //console.log(day);
    console.log(ev.target);
  }

  getCalendarDayFromId(id: string): any {
    if (Array.isArray(this.month.days)) {
      const index = this.month.days.findIndex(
        (el: CalendarDay) => 'day-' + el.time === id
      );
      if (index >= 0) {
        return {
          index,
          day: this.month.days[index],
        };
      }
      return undefined;
    } else {
      return undefined; // Retourner un tableau vide ou une autre valeur par défaut si la propriété days n'est pas un tableau valide
    }
  }
}
