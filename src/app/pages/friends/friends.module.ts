import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FriendsPageRoutingModule } from './friends-routing.module';

import { FriendsPage } from './friends.page';
import { NgCalendarModule } from 'src/app/components/calendar';

import { LazyLoadImageModule } from 'ng-lazyload-image';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgCalendarModule,
    IonicModule,
    LazyLoadImageModule,
    FriendsPageRoutingModule,
    SharedModule,
  ],
  declarations: [FriendsPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class FriendsPageModule {}
