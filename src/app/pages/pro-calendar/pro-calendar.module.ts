import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProCalendarPageRoutingModule } from './pro-calendar-routing.module';

import { ProCalendarPage } from './pro-calendar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    IonicModule,
    ProCalendarPageRoutingModule,
  ],
  declarations: [ProCalendarPage],
})
export class ProCalendarPageModule {}
