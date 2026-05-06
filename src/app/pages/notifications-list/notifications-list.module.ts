import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificationsListPageRoutingModule } from './notifications-list-routing.module';

import { NotificationsListPage } from './notifications-list.page';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    NotificationsListPageRoutingModule,
  ],
  declarations: [NotificationsListPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class NotificationsListPageModule {}
