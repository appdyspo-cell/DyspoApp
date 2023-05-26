import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { CreateGroupPageRoutingModule } from './create-group-routing.module';

import { CreateGroupPage } from './create-group.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
	TranslateModule,   
    CreateGroupPageRoutingModule
  ],
  declarations: [CreateGroupPage]
})
export class CreateGroupPageModule {}
