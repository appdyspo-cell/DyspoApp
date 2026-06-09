import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreateEventPageRoutingModule } from './create-event-routing.module';

import { CreateEventPage } from './create-event.page';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { TimePickerClockComponent } from 'src/app/components/time-picker-clock/time-picker-clock.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    CreateEventPageRoutingModule,
  ],
  declarations: [CreateEventPage, TimePickerClockComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class CreateEventPageModule {}
