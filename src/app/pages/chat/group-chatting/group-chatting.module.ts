import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { GroupChattingPageRoutingModule } from './group-chatting-routing.module';

import { GroupChattingPage } from './group-chatting.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
	TranslateModule,  
    GroupChattingPageRoutingModule
  ],
  declarations: [GroupChattingPage]
})
export class GroupChattingPageModule {}
