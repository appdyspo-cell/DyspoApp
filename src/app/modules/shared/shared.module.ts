import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendsComponent } from 'src/app/components/friends/friends.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PictureComponent } from 'src/app/components/picture/picture.component';
import { AgendaEventMiniComponent } from 'src/app/components/agenda-event-mini/agenda-event-mini.component';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';

@NgModule({
  declarations: [
    FriendsComponent,
    PictureComponent,
    AgendaEventMiniComponent,
    AgendaEventInfoComponent,
  ],
  imports: [CommonModule, IonicModule, FormsModule],
  exports: [
    FriendsComponent,
    PictureComponent,
    AgendaEventMiniComponent,
    AgendaEventInfoComponent,
  ],
})
export class SharedModule {}
