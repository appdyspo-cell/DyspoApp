import { NgModule } from '@angular/core';
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
})
export class UserStatusPageModule {}
