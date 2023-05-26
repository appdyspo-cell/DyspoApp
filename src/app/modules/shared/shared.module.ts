import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendsComponent } from 'src/app/components/friends/friends.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PictureComponent } from 'src/app/components/picture/picture.component';

@NgModule({
  declarations: [FriendsComponent, PictureComponent],
  imports: [CommonModule, IonicModule, FormsModule],
  exports: [FriendsComponent, PictureComponent],
})
export class SharedModule {}
