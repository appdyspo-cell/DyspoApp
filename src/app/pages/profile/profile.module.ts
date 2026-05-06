import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';
import { TranslateModule } from '@ngx-translate/core';
import { MaskitoModule } from '@maskito/angular';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    MaskitoModule,
    LazyLoadImageModule,
    ProfilePageRoutingModule,
  ],
  declarations: [ProfilePage],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ProfilePageModule {}
