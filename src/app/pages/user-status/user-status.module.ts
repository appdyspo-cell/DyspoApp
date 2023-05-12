import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserStatusPageRoutingModule } from './user-status-routing.module';

import { UserStatusPage } from './user-status.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserStatusPageRoutingModule
  ],
  declarations: [UserStatusPage]
})
export class UserStatusPageModule {}
