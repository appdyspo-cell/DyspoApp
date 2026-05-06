import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ParametresPageRoutingModule } from './parametres-routing.module';

import { ParametresPage } from './parametres.page';
import { NgCalendarModule } from 'src/app/components/calendar';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgCalendarModule,
    LazyLoadImageModule,
    ParametresPageRoutingModule,
  ],
  declarations: [ParametresPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ParametresPageModule {}
