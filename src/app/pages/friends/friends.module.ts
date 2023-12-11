import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FriendsPageRoutingModule } from './friends-routing.module';

import { FriendsPage } from './friends.page';
import { NgCalendarModule } from 'src/app/components/calendar';

import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgCalendarModule,
    IonicModule,
    LazyLoadImageModule,
    FriendsPageRoutingModule,
  ],
  declarations: [FriendsPage],
})
export class FriendsPageModule {}
