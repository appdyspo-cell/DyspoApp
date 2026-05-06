import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CguPageRoutingModule } from './cgu-routing.module';

import { CguPage } from './cgu.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CguPageRoutingModule
  ],
  declarations: [CguPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class CguPageModule {}
