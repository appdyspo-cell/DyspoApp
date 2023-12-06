import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { cloneDeep } from 'lodash';
import { AgendaEvent, Friend, FriendGroup } from 'src/app/models/models';
import { FriendSelectionType } from 'src/app/pages/agenda/create-event/create-event.page';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';

interface CheckedFriends {
  friend: Friend;
  isChecked: boolean;
}

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
})
export class FriendsComponent implements OnInit {
  friendSelectionType = FriendSelectionType;
  selectSegment = FriendSelectionType.FRIENDS;
  friends: Friend[] = [];
  inputSearch = '';
  checkedFriends: CheckedFriends[] = [];
  friendGroups: FriendGroup[] = [];
  agendaEvent!: AgendaEvent;
  mode!: string;
  uid!: string;

  constructor(
    private router: Router,
    private friendsSvc: FriendsService,
    private activatedRoute: ActivatedRoute,
    private userSvc: UserService,
    public utils: UtilsService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    console.log('init friendSelection');
    this.uid = this.userSvc.userInfo?.uid!;
    this.friends = cloneDeep(this.friendsSvc.friends);
    this.friendGroups = cloneDeep(this.friendsSvc.friendGroups);

    this.friends.forEach((friend) => {
      if (this.agendaEvent.members_uid.includes(friend.friend_uid!)) {
        this.checkedFriends.push({ friend, isChecked: true });
      } else {
        this.checkedFriends.push({ friend, isChecked: false });
      }
    });
  }

  segmentChanged(ev: any) {
    // if(ev.detail.value ==='club'){
    //   try{
    //     if(this.map){
    //       this.map.remove();
    //     }
    //   }catch(err){
    //     console.log(err);
    //   };
    //   setTimeout(()=>{
    //     this.leafletMap();
    //   },100);
    // }
  }

  onCheckedFriendChange($event: Event) {
    console.log($event);
    console.log(this.checkedFriends);
  }

  getCheckedFriendsUid(): string[] {
    const uids: string[] = [];
    for (const item of this.checkedFriends) {
      if (item.isChecked) {
        uids.push(item.friend.friend_uid!);
      }
    }
    return uids;
  }

  getCheckedFriendGroupsUid(): string[] {
    const uids: string[] = [];
    for (const item of this.checkedFriends) {
      if (item.isChecked) {
        uids.push(item.friend.friend_uid!);
      }
    }
    return uids;
  }

  save() {
    const friendsUid = this.getCheckedFriendsUid();
    const friendGroupsUid = this.getCheckedFriendGroupsUid();
    this.agendaEvent.members_uid = friendsUid;
    this.agendaEvent.members_uid.push(this.uid);

    for (let frGrpUid of friendGroupsUid) {
      if (!this.agendaEvent.members_uid.includes(frGrpUid)) {
        this.agendaEvent.members_uid.push(frGrpUid);
      }
    }

    console.log('Agenda event ', this.agendaEvent);
    this.modalCtrl.dismiss(
      {
        friendsUid,
        friendGroupsUid,
      },
      'confirm'
    );
  }
}
