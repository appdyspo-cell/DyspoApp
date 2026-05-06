import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { GroupListPageRoutingModule } from './group-list-routing.module';

import { GroupListPage } from './group-list.page';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    LazyLoadImageModule,
    GroupListPageRoutingModule,
  ],
  declarations: [GroupListPage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class GroupListPageModule {}
