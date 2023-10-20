import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FriendsSelectionPageRoutingModule } from './friends-selection-routing.module';

import { FriendsSelectionPage } from './friends-selection.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FriendsSelectionPageRoutingModule
  ],
  declarations: [FriendsSelectionPage]
})
export class FriendsSelectionPageModule {}
