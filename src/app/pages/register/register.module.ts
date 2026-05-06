import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegisterPageRoutingModule } from './register-routing.module';

import { RegisterPage } from './register.page';
import { TranslateModule } from '@ngx-translate/core';
import { MaskitoModule } from '@maskito/angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    MaskitoModule,
    RegisterPageRoutingModule,
  ],
  declarations: [RegisterPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class RegisterPageModule {}
