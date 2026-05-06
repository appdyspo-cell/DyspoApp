import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserStatusPageRoutingModule } from './user-status-routing.module';

import { UserStatusPage } from './user-status.page';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    UserStatusPageRoutingModule,
  ],
  declarations: [UserStatusPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class UserStatusPageModule {}
