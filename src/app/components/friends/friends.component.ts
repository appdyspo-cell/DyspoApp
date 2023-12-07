import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { cloneDeep } from 'lodash';
import {
  AgendaEvent,
  Friend,
  FriendDyspo,
  FriendGroup,
  UserDyspoStatus,
} from 'src/app/models/models';
import { FriendSelectionType } from 'src/app/pages/agenda/create-event/create-event.page';
import { AgendaService } from 'src/app/services/agenda.service';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';

interface CheckedFriends {
  friend: Friend;
  isChecked: boolean;
  disable: boolean;
  dyspo?: UserDyspoStatus;
}

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
})
export class FriendsComponent implements OnInit {
  UserDyspoStatus = UserDyspoStatus;
  friendSelectionType = FriendSelectionType;
  selectSegment = FriendSelectionType.FRIENDS;
  friends: Friend[] = [];
  inputSearch = '';
  checkedFriends: CheckedFriends[] = [];
  friendGroups: FriendGroup[] = [];
  agendaEvent!: AgendaEvent;
  mode!: string;
  uid!: string;
  friendDyspos: FriendDyspo[] = [];

  constructor(
    private router: Router,
    private friendsSvc: FriendsService,
    private activatedRoute: ActivatedRoute,
    private agendaSvc: AgendaService,
    private userSvc: UserService,
    public utils: UtilsService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    console.log('init friendSelection');
    const friend_uids: string[] = [];
    this.uid = this.userSvc.userInfo?.uid!;
    this.friends = cloneDeep(this.friendsSvc.friends);
    this.friendGroups = cloneDeep(this.friendsSvc.friendGroups);

    const friendsToCheck = this.agendaEvent.members_uid.concat(
      this.agendaEvent.members_invited_uid
    );

    this.friends.forEach(async (friend) => {
      // Dyspos
      friend_uids.push(friend.friend_uid!);

      const dyspo = (
        await this.agendaSvc.getDyspos([friend.friend_uid!], this.agendaEvent)
      )[0];
      const dyspoStatus = dyspo.friend_dyspo;
      // Event members ?
      if (friendsToCheck.includes(friend.friend_uid!)) {
        this.checkedFriends.push({
          friend,
          isChecked: true,
          disable: true,
          dyspo: dyspoStatus,
        });
      } else {
        this.checkedFriends.push({
          friend,
          isChecked: false,
          disable: false,
          dyspo: dyspoStatus,
        });
      }
    });

    console.log(this.checkedFriends);

    // Get dyspos
    // this.friendDyspos = await this.agendaSvc.getDyspos(
    //   friend_uids,
    //   this.agendaEvent
    // );

    // for(let f of this.checkedFriends){

    // }

    // console.log(' Friend dyspos', this.friendDyspos);
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
    this.agendaEvent.members_invited_uid = friendsUid;

    for (let friendInvitedUid of friendsUid) {
      if (!this.agendaEvent.members_invited_uid.includes(friendInvitedUid)) {
        this.agendaEvent.members_invited_uid.push(friendInvitedUid);
      }
    }

    for (let frGrpUid of friendGroupsUid) {
      if (!this.agendaEvent.members_invited_uid.includes(frGrpUid)) {
        this.agendaEvent.members_invited_uid.push(frGrpUid);
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

  close() {
    this.modalCtrl.dismiss({}, 'cancel');
  }
}
