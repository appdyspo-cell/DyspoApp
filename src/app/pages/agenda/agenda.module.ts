import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, NavParams } from '@ionic/angular';

import { AgendaPageRoutingModule } from './agenda-routing.module';

import { AgendaPage } from './agenda.page';
import { NgCalendarModule } from 'src/app/components/calendar';
import { CalendarModule } from 'src/app/calendar';
import { SharedPipesModule } from 'src/app/modules/shared-pipes/shared-pipes.module';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgCalendarModule,
    CalendarModule,
    IonicModule,
    AgendaPageRoutingModule,
    LazyLoadImageModule,
    SharedPipesModule,
  ],

  declarations: [AgendaPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AgendaPageModule {}
