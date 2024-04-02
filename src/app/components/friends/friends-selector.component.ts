import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { cloneDeep } from 'lodash';
import {
  AgendaEvent,
  CheckedFriends,
  Friend,
  FriendDyspo,
  FriendGroup,
  FriendStatus,
  UserDyspoStatus,
} from 'src/app/models/models';
import { FriendSelectionType } from 'src/app/pages/agenda/create-event/create-event.page';
import { AgendaService } from 'src/app/services/agenda.service';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-friends-selector',
  templateUrl: './friends-selector.component.html',
  styleUrls: ['./friends-selector.component.scss'],
})
export class FriendsSelectorComponent implements OnInit {
  selectedFriend: CheckedFriends | undefined;

  @Input() agendaEvent!: AgendaEvent;
  @Input() startTime!: any;
  @Input() endTime!: any;
  @Input() mode!: any;
  @Output() friendSelected = new EventEmitter<{
    friendSelected: CheckedFriends;
    checkedFriends: CheckedFriends[];
  }>();
  @Output() groupSelected = new EventEmitter<CheckedFriends[]>();

  @ViewChild('popoverConfirmInvitEvent') popoverConfirmInvitEvent: any;

  UserDyspoStatus = UserDyspoStatus;
  isPopoverConfirmInvitEventOpen = false;
  selectedUserEvents: AgendaEvent[] | undefined;
  friendSelectionType = FriendSelectionType;
  selectSegment = FriendSelectionType.FRIENDS;
  friends: Friend[] = [];
  inputSearch = '';
  checkedFriends: CheckedFriends[] = [];
  friendGroups: FriendGroup[] = [];

  uid!: string;
  friendDyspos: FriendDyspo[] = [];
  level = 0;
  friendsAlreadyInvited!: string[];
  isInit = false;

  constructor(
    private friendsSvc: FriendsService,
    private agendaSvc: AgendaService,
    private userSvc: UserService,
    public utils: UtilsService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (!this.isInit) return;
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
    this.checkedFriends = [];
    console.log('on changes ev', this.agendaEvent);
    await this.fillCheckedFriends(true);

    this.friendGroups.forEach(async (group) => {
      group.checked_friends = this.checkedFriends.filter((checkedFriend) => {
        return group.members_uid.includes(checkedFriend.friend.friend_uid!);
      });
    });
  }

  async ngOnInit() {
    this.isInit = true;
    console.log('init friendSelection');

    this.uid = this.userSvc.userInfo?.uid!;
    this.friends = cloneDeep(this.friendsSvc.friends);
    this.friends = this.friends.filter((friend) => {
      return friend.friend_status === FriendStatus.FRIEND;
    });
    this.friendGroups = cloneDeep(this.friendsSvc.friendGroups);

    this.friendsAlreadyInvited = this.agendaEvent.members_uid.concat(
      this.agendaEvent.members_invited_uid
    );

    await this.fillCheckedFriends();

    this.friendGroups.forEach(async (group) => {
      group.checked_friends = this.checkedFriends.filter((checkedFriend) => {
        return group.members_uid.includes(checkedFriend.friend.friend_uid!);
      });
    });
  }

  fillCheckedFriends(fromChanges = false) {
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
            isCheckedPending: false,
            disable: this.friendsAlreadyInvited.includes(friend.friend_uid!),
            dyspo: dyspoStatus,
            agendaEvents: events.agendaEvents,
          });
        } else {
          this.checkedFriends.push({
            friend,
            isChecked: false,
            isCheckedPending: false,
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
    ev.stopPropagation();
  }

  onClick(checkedFriend: CheckedFriends, $event: Event) {
    $event.stopPropagation();
    if (checkedFriend.disable) return;
    this.selectedFriend = checkedFriend;
    if (checkedFriend.isChecked) {
      this.selectedFriend.isChecked = false;
      this.friendSelected.emit({
        friendSelected: this.selectedFriend!,
        checkedFriends: this.checkedFriends,
      });
    } else {
      // Check if some events
      if (this.selectedFriend.agendaEvents.length > 0) {
        this.popoverConfirmInvitEvent.event = $event;
        this.isPopoverConfirmInvitEventOpen = true;
      } else {
        this.selectedFriend.isChecked = true;
        this.friendSelected.emit({
          friendSelected: this.selectedFriend!,
          checkedFriends: this.checkedFriends,
        });
      }
    }
  }

  confirmInviteToEvent() {
    if (!this.selectedFriend) return;
    this.isPopoverConfirmInvitEventOpen = false;
    this.selectedFriend.isChecked = true;
    this.friendSelected.emit({
      friendSelected: this.selectedFriend!,
      checkedFriends: this.checkedFriends,
    });
  }

  addGroup(group: FriendGroup, $event: Event) {
    $event.stopPropagation();
    this.checkedFriends.forEach((item) => {
      if (group.members_uid.includes(item.friend.friend_uid!)) {
        item.isChecked = true;
      }
    });
    this.groupSelected.emit(this.checkedFriends);
  }

  getDelayClass(index: number): string {
    if (index <= 11) {
      return 'animated delay_' + index;
    } else {
      return 'animated delay_12';
    }
  }

  // showAgenda(friend: AppUser, event: any) {
  //   event.stopPropagation();
  //   //this.utils.showModalPage(AmiFicheComponent, {friendListDoc: friend, userData: friend.userData});
  //   const navigationExtras: NavigationExtras = {
  //     state: {
  //       friend,
  //     },
  //   };
  //   this.level = 1;
  //   this.myNav.push(AgendaPage, { friend });

  //   //this.navCtrl.navigateForward('agenda/friend', navigationExtras);
  // }

  getOtherEventLabel(ev: AgendaEvent) {
    // Event long
    if (ev.start_date_day_of_year !== ev.end_date_day_of_year) {
      return (
        format(parseISO(ev.startISO), 'dd MMM HH:mm', { locale: fr }) +
        ' - ' +
        format(parseISO(ev.endISO), 'dd MMM HH:mm', { locale: fr })
      );
    }
    // Event sur une journee
    else {
      return (
        format(parseISO(ev.endISO), 'dd MMM', { locale: fr }) +
        ' ' +
        ev.start_time_formatted +
        ' - ' +
        ev.end_time_formatted
      );
    }
  }
}
