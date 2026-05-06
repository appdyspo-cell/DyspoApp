import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MonthViewComponent } from './monthview';
import { WeekViewComponent } from './weekview';
import { DayViewComponent } from './dayview';
import { CalendarComponent } from './calendar';
import { initPositionScrollComponent } from './init-position-scroll';

@NgModule({
    declarations: [
        MonthViewComponent, WeekViewComponent, DayViewComponent, CalendarComponent, initPositionScrollComponent
    ],
    imports: [IonicModule, CommonModule],
    exports: [CalendarComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class NgCalendarModule {}
