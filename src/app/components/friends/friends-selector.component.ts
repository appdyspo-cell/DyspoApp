import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { cloneDeep } from 'lodash';
import {
  AgendaEvent,
  CheckedFriends,
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

@Component({
  selector: 'app-friends-selector',
  templateUrl: './friends-selector.component.html',
  styleUrls: ['./friends-selector.component.scss'],
})
export class FriendsSelectorComponent implements OnInit {
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

    await this.fillCheckedFriends();

    console.log('Set group friends');
    this.friendGroups.forEach(async (group) => {
      group.checked_friends = this.checkedFriends.filter((checkedFriend) => {
        return group.members_uid.includes(checkedFriend.friend.friend_uid!);
      });
    });
  }

  fillCheckedFriends() {
    return new Promise(async (resolve, reject) => {
      const friendsToCheck = this.agendaEvent.members_uid.concat(
        this.agendaEvent.members_invited_uid
      );

      for (let friend of this.friends) {
        // Dyspos
        const dyspo = (
          await this.agendaSvc.getDyspos([friend.friend_uid!], this.agendaEvent)
        )[0];

        // Fetch events of members
        const events = await this.agendaSvc.getUserAgendaEvents(
          friend.friend_uid!,
          this.agendaEvent
        );

        const dyspoStatus = dyspo.friend_dyspo;
        if (friendsToCheck.includes(friend.friend_uid!)) {
          this.checkedFriends.push({
            friend,
            isChecked: true,
            disable: true,
            dyspo: dyspoStatus,
            agendaEvents: events.agendaEvents,
          });
        } else {
          this.checkedFriends.push({
            friend,
            isChecked: false,
            disable: false,
            dyspo: dyspoStatus,
            agendaEvents: events.agendaEvents,
          });
        }
      }
      resolve(this.checkedFriends);
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
      if (item.isChecked && !item.disable) {
        uids.push(item.friend.friend_uid!);
      }
    }
    return uids;
  }

  save() {
    console.log('save invits');
    const friends_uid = this.getCheckedFriendsUid();
    const newInvits: string[] = [];

    for (let uid of friends_uid) {
      if (!this.agendaEvent.members_invited_uid.includes(uid)) {
        newInvits.push(uid);
        this.agendaEvent.members_invited_uid.push(uid);

        //
      }
    }

    console.log('Agenda event ', this.agendaEvent);
    this.modalCtrl.dismiss(
      {
        friendsUid: friends_uid,
        newInvits,
      },
      'confirm'
    );
  }

  addGroup(group: FriendGroup) {
    this.checkedFriends.forEach((item) => {
      if (group.members_uid.includes(item.friend.friend_uid!)) {
        item.isChecked = true;
      }
    });
  }

  close() {
    this.modalCtrl.dismiss({}, 'cancel');
  }
}
