import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AppUser } from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-friend-profile',
    templateUrl: './friend-profile.component.html',
    styleUrls: ['./friend-profile.component.scss'],
    standalone: false
})
export class FriendProfileComponent implements OnInit {
  @Input() user!: AppUser;
  @Input() isFriend: boolean = true;

  defaultAvatar = 'assets/logo.svg';
  sending = false;
  requested = false;

  constructor(
    private modalCtrl: ModalController,
    private friendsSvc: FriendsService,
    private utils: UtilsService
  ) {}

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }

  async sendRequest() {
    if (this.sending || this.requested) return;
    this.sending = true;
    await this.friendsSvc.invite(this.user, true);
    this.sending = false;
    this.requested = true;
  }

  closeWithResult() {
    this.modalCtrl.dismiss(this.requested ? 'requested' : null);
  }
}
