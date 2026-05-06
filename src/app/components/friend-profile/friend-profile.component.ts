import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AppUser } from 'src/app/models/models';

@Component({
    selector: 'app-friend-profile',
    templateUrl: './friend-profile.component.html',
    styleUrls: ['./friend-profile.component.scss'],
    standalone: false
})
export class FriendProfileComponent implements OnInit {
  @Input() user!: AppUser;

  defaultAvatar = 'assets/logo.svg';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }
}
