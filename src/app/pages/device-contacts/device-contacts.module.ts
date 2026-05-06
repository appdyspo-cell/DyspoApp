import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeviceContactsPageRoutingModule } from './device-contacts-routing.module';

import { DeviceContactsPage } from './device-contacts.page';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    DeviceContactsPageRoutingModule,
  ],
  declarations: [DeviceContactsPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class DeviceContactsPageModule {}
