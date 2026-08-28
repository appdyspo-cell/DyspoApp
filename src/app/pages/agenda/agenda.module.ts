import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AgendaPageRoutingModule } from './agenda-routing.module';

import { AgendaPage } from './agenda.page';
import { CalendarModule } from 'src/app/calendar';
import { SharedPipesModule } from 'src/app/modules/shared-pipes/shared-pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    IonicModule,
    AgendaPageRoutingModule,
    SharedPipesModule,
  ],

  declarations: [AgendaPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AgendaPageModule {}
