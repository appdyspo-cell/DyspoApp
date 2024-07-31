import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { GroupChattingPageRoutingModule } from './group-chatting-routing.module';

import { GroupChattingPage } from './group-chatting.page';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { SharedPipesModule } from 'src/app/modules/shared-pipes/shared-pipes.module';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    LazyLoadImageModule,
    SharedPipesModule,
    SharedModule,
    GroupChattingPageRoutingModule,
  ],
  declarations: [GroupChattingPage],
})
export class GroupChattingPageModule {}
