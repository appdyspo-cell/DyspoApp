import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { CreateGroupInfoPageRoutingModule } from './create-group-info-routing.module';

import { CreateGroupInfoPage } from './create-group-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
	TranslateModule,   
    CreateGroupInfoPageRoutingModule
  ],
  declarations: [CreateGroupInfoPage]
})
export class CreateGroupInfoPageModule {}
