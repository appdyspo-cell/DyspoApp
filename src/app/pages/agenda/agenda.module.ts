import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AgendaPageRoutingModule } from './agenda-routing.module';

import { AgendaPage } from './agenda.page';
import { NgCalendarModule } from 'src/app/components/calendar';
import { CalendarModule } from 'src/app/calendar';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgCalendarModule,
    CalendarModule,
    IonicModule,
    AgendaPageRoutingModule,
  ],
  declarations: [AgendaPage],
})
export class AgendaPageModule {}
