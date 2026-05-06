import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FixContactsPageRoutingModule } from './fix-contacts-routing.module';

import { FixContactsPage } from './fix-contacts.page';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    FixContactsPageRoutingModule,
  ],
  declarations: [FixContactsPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class FixContactsPageModule {}
