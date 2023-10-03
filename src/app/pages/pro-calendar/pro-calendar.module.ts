import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProCalendarPageRoutingModule } from './pro-calendar-routing.module';

import { ProCalendarPage } from './pro-calendar.page';
import { NgCalendarModule  } from 'ionic2-calendar';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgCalendarModule,
    IonicModule,
    ProCalendarPageRoutingModule
  ],
  declarations: [ProCalendarPage]
})
export class ProCalendarPageModule {}
