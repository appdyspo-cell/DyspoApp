import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Friend, FriendGroup, FriendGroupStatus } from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { cloneDeep } from 'lodash';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { MediaService } from 'src/app/services/media.service';

interface CheckedFriends {
  friend: Friend;
  isChecked: boolean;
}

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.page.html',
  styleUrls: ['./create-group.page.scss'],
})
export class CreateGroupPage implements OnInit {
  friends: Friend[] = [];
  checkedFriends: CheckedFriends[] = [];
  friendGroup!: FriendGroup;
  pageTitle = '';
  saveLabel = '';
  mode = '';

  constructor(
    private router: Router,
    private friendsSvc: FriendsService,
    private activatedRoute: ActivatedRoute,
    private userSvc: UserService,
    public utils: UtilsService,
    private navCtrl: NavController,
    private mediaSvc: MediaService
  ) {
    const uid = this.userSvc.userInfo?.uid!;
    this.friends = cloneDeep(this.friendsSvc.friends);

    this.activatedRoute.params.subscribe((params) => {
      this.mode = params['mode'];
      switch (this.mode) {
        case 'new':
          this.pageTitle = 'Créer un groupe';
          this.saveLabel = 'Sauvegarder';

          const now = new Date().getTime();
          this.friendGroup = {
            uid: 'frgrp_' + now,
            sinceDate: now,
            label: '',
            admin_uid: uid,
            members_uid: [],
            avatarPath: environment.DEFAULT_AVATAR_GROUP,
            status: FriendGroupStatus.ACTIVE,
          };

          this.friends.forEach((friend) => {
            this.checkedFriends.push({ friend, isChecked: false });
          });

          break;
        case 'edit':
          this.saveLabel = 'Mettre à jour';
          this.pageTitle = 'Editer un Groupe';
          this.friendGroup =
            this.router.getCurrentNavigation()?.extras.state?.['friendGroup'];

          console.log('edit group');
          this.friends.forEach((friend) => {
            if (this.friendGroup.members_uid.includes(friend.friend_uid!)) {
              this.checkedFriends.push({ friend, isChecked: true });
            } else {
              this.checkedFriends.push({ friend, isChecked: false });
            }
          });
          break;
      }
    });
  }

  ngOnInit() {}

  // creategroupinfo() {
  //   this.route.navigate(['./create-group-info']);
  // }

  onCheckedFriendChange($event: Event) {
    console.log($event);
    console.log(this.checkedFriends);
  }

  countCheckedItems(): number {
    return this.checkedFriends.filter((item) => item.isChecked).length;
  }

  getCheckedItems(): string[] {
    const namesOfCheckedItems: string[] = [];

    for (const item of this.checkedFriends) {
      if (item.isChecked) {
        namesOfCheckedItems.push(item.friend.friend_uid!);
      }
    }

    return namesOfCheckedItems;
  }

  addFriendGroup() {
    const checkedItems = this.getCheckedItems();
    if (checkedItems.length <= 0) {
      this.utils.showToastError('Vous devez sélectionner au moins 1 ami');
      return;
    }
    const uid = this.userSvc.userInfo?.uid!;

    this.friendGroup.members_uid = checkedItems;
    this.friendGroup.members_uid.push(uid);
    console.log('Add friend group ', this.friendGroup);
    this.friendsSvc.addFriendGroup(this.friendGroup);
    this.navCtrl.pop();
  }

  async takePhotoPrompt() {
    const { filepath } = await this.mediaSvc.takePhotoPrompt({
      firebasePath: environment.firebase_avatar_group_storage_path,
      filename: 'avatar_group_' + this.friendGroup.uid + '.jpg',
      allowEditing: false,
    });

    if (filepath) {
      this.friendGroup.avatarPath = filepath;
      if (this.mode === 'edit') {
        this.friendsSvc.updateFriendGroup(this.friendGroup);
      }
    }
  }
}
