import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NavController, SelectChangeEventDetail } from '@ionic/angular';
import { IonSelectCustomEvent } from '@ionic/core';

import {
  add,
  addDays,
  addHours,
  addMonths,
  addWeeks,
  format,
  formatISO,
  getDate,
  getDayOfYear,
  getHours,
  getMonth,
  getYear,
  isAfter,
  isEqual,
  isSameDay,
  parseISO,
  set,
  setHours,
  setMinutes,
} from 'date-fns';
import fr from 'date-fns/locale/fr';

import {
  AgendaEvent,
  AgendaEventRecurrence,
  AgendaEventStatus,
  AgendaEventType,
  AppUserWithEvents,
  Chatroom,
  CheckedFriends,
  Friend,
  FriendStatus,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { FriendsService } from 'src/app/services/friends.service';
import { MediaService } from 'src/app/services/media.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

export enum FriendSelectionType {
  FRIENDS = 'Amis',
  GROUP = 'Groupe',
}
@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
})
export class CreateEventPage implements OnInit {
  @ViewChild('popoverUserEvents') popoverUserEvents: any;
  UserDyspoStatus = UserDyspoStatus;
  FriendStatus = FriendStatus;
  AgendaEventRecurrence = AgendaEventRecurrence;
  isPopoverUserEventsOpen = false;
  selectedUserEvents: AgendaEvent[] | undefined;
  tsInputDate: any;
  start_date_formatted!: string;
  end_date_formatted!: string;
  start_time_formatted!: string;
  end_time_formatted!: string;
  min_time_ISO_start!: string;
  min_time_ISO_end!: string;
  max_time_ISO_end!: string;
  agendaEvent: AgendaEvent | undefined;
  agendaEventType = AgendaEventType;
  pageTitle = '';
  saveLabel = '';
  friendSelectionType = FriendSelectionType;
  friendSelection: FriendSelectionType = FriendSelectionType.FRIENDS;
  selectedUser: AppUserWithEvents | undefined;
  selectedUserFriendStatus: FriendStatus | undefined;
  selectedUserFriendStatusLabel = '';

  friends = [];
  members: AppUserWithEvents[] = [];

  autocompletePlaces: google.maps.places.AutocompletePrediction[] = [];
  inputSearch = '';

  GoogleAutocompleteSvc: google.maps.places.AutocompleteService;
  autocompletePlaceInput!: { input: string };
  mode: any;
  uid = '';
  allCanEdit: boolean = false;
  allCanSeeTitle: boolean = true;
  startTime: any;
  endTime: any;
  is_multi = false;
  new_members: string[] = [];

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private agendaSvc: AgendaService,
    private mediaSvc: MediaService,
    private userSvc: UserService,
    private utils: UtilsService,
    private friendsSvc: FriendsService,
    private notificationsSvc: NotificationService
  ) {
    this.uid = this.userSvc.userInfo?.uid!;
    this.GoogleAutocompleteSvc = new google.maps.places.AutocompleteService();
    this.autocompletePlaceInput = { input: '' };
    this.autocompletePlaces = [];
    this.activatedRoute.params.subscribe((params) => {
      this.mode = params['mode'];
      console.log('Create ev');
      switch (this.mode) {
        case 'new':
          this.tsInputDate =
            this.router.getCurrentNavigation()?.extras.state?.['tsDate'];
          this.is_multi =
            this.router.getCurrentNavigation()?.extras.state?.['is_multi'];
          const is_kids =
            this.router.getCurrentNavigation()?.extras.state?.['is_kids'];
          const dateHPlus1 = setHours(
            new Date(this.tsInputDate),
            getHours(add(new Date(), { hours: 1 }))
          );
          const dateHPlus2 = setHours(
            new Date(this.tsInputDate),
            getHours(add(new Date(), { hours: 2 }))
          );
          const start_date_day_of_year = getDayOfYear(dateHPlus1);
          const end_date_day_of_year = getDayOfYear(dateHPlus2);
          const refStart = set(dateHPlus1, {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          });
          const refEnd = set(dateHPlus2, {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          });

          this.pageTitle = 'Créer un événement';
          this.saveLabel = 'Sauvegarder';

          let eventType;
          if (!this.is_multi) {
            eventType = AgendaEventType.SOLO;
          } else {
            if (is_kids) {
              eventType = AgendaEventType.KIDS;
            } else {
              eventType = AgendaEventType.NOKIDS;
            }
          }

          this.agendaEvent = {
            admin_uid: this.uid,
            members_uid: [this.uid],
            members_invited_uid: [],
            uid: 'agev_' + new Date().getTime(),
            startISO: formatISO(dateHPlus1),
            endISO: formatISO(dateHPlus2),
            title: '',
            type: eventType,
            status: AgendaEventStatus.ACTIVE,
            all_can_edit: false,
            all_can_see_title: true,
            // day: getDate(new Date(this.tsInputDate)),
            // month: getMonth(new Date(this.tsInputDate)),
            // year: getYear(new Date(this.tsInputDate)),
            avatar: 'assets/newimg/ajout_photo.jpg',
            is_multi: this.is_multi,
            recurrence: AgendaEventRecurrence.ONE,
            recurrence_nb: '0',
            start_date_day_of_year,
            end_date_day_of_year,
            start_date_year: getYear(dateHPlus1),
            end_date_year: getYear(dateHPlus2),
            start_date_ts: refStart.getTime(),
            end_date_ts: refEnd.getTime(),
          };
          //   start_date_index:
          //     getDate(new Date(this.tsInputDate)).toString() +
          //     '_' +
          //     getMonth(new Date(this.tsInputDate)).toString() +
          //     '_' +
          //     getYear(new Date(this.tsInputDate)).toString(),

          //   end_date_index:
          //     getDate(new Date(this.tsInputDate)).toString() +
          //     '_' +
          //     getMonth(new Date(this.tsInputDate)).toString() +
          //     '_' +
          //     getYear(new Date(this.tsInputDate)).toString(),
          // };

          // Hydrate agendaEvent
          this.agendaEvent.start_date_formatted = this.utils.formatISODate(
            this.agendaEvent.startISO
          );
          this.agendaEvent.end_date_formatted = this.utils.formatISODate(
            this.agendaEvent.endISO
          );
          this.agendaEvent.start_time_formatted = this.utils.formatTime(
            this.agendaEvent.startISO
          );
          this.agendaEvent.end_time_formatted = this.utils.formatTime(
            this.agendaEvent.endISO
          );

          // Create chatroom
          const userChatroom: Chatroom = {
            count: 0,
            lastMessageRead: '',
            startMessageId: 0,
            nextMessageId: 0,
            isNotifications: true,
          };
          this.agendaEvent!['user_' + this.uid] = userChatroom;

          //if (isSameDay(this.tsInputDate, new Date())) {

          // Le minimum c aujourdhui
          // this.min_time_ISO_start = this.agendaEvent.startISO;
          // this.min_time_ISO_end = this.agendaEvent.startISO;
          this.min_time_ISO_start = formatISO(new Date().getTime());
          this.min_time_ISO_end = formatISO(new Date().getTime());

          //}
          this.max_time_ISO_end = formatISO(
            addDays(new Date(parseISO(this.min_time_ISO_end)), 30)
          );
          console.log('min time ', this.min_time_ISO_start);
          console.log('max time ', this.max_time_ISO_end);

          break;
        case 'edit':
          this.saveLabel = 'Mettre à jour';
          this.pageTitle = 'Éditer un événement';
          this.agendaEvent =
            this.router.getCurrentNavigation()?.extras.state?.['agendaEvent'];
          this.is_multi = this.agendaEvent!.is_multi;
          if (this.agendaEvent?.place_description) {
            this.autocompletePlaceInput.input =
              this.agendaEvent?.place_description;
          }

          this.allCanEdit = this.agendaEvent!.all_can_edit;
          this.allCanSeeTitle = this.agendaEvent!.all_can_see_title;

          console.log('Sert min values');
          this.min_time_ISO_start = formatISO(addHours(new Date(), 1));

          //this.min_time_ISO_end = this.min_time_ISO_start;

          this.min_time_ISO_end = this.agendaEvent!.startISO;
          this.max_time_ISO_end = formatISO(
            addDays(new Date(parseISO(this.min_time_ISO_end)), 30)
          );
          break;
      }
      if (this.is_multi) {
        this.getMembersInfo();
      }
    });
  }

  async hydrateMemberDysposAndEvents(member: AppUserWithEvents) {
    // Is he my friend ?
    member.is_my_friend = this.friendsSvc.isMyFriend(member.uid);

    // Dyspos
    const dyspo = (
      await this.agendaSvc.getDyspos([member.uid], this.agendaEvent!)
    )[0];
    const dyspoStatus = dyspo.friend_dyspo;
    // Hydrate AppUser with dyspo status
    member.dyspoStatus = dyspoStatus;

    // Fetch events of members
    const events = await this.agendaSvc.getUserAgendaEvents(
      member.uid,
      this.agendaEvent!
    );

    member.agendaEvents = events.agendaEvents;
  }

  async getMembersInfo() {
    this.members = await this.userSvc.getUserInfos(
      this.agendaEvent!.members_uid.concat(
        this.agendaEvent!.members_invited_uid
      )
    );

    for (let member of this.members) {
      await this.hydrateMemberDysposAndEvents(member);
    }
  }

  ngOnInit() {}

  saveOrUpdateEvent() {
    if (this.agendaEvent?.title) {
      this.agendaEvent.all_can_edit = this.allCanEdit;
      this.agendaEvent.all_can_see_title = this.allCanSeeTitle;
      //Recurrence
      if (
        this.mode === 'new' &&
        this.agendaEvent.recurrence !== AgendaEventRecurrence.ONE
      ) {
        const recurrence_period_int = parseInt(this.agendaEvent.recurrence_nb);
        if (this.agendaEvent.recurrence === AgendaEventRecurrence.WEEKLY) {
          this.agendaEvent.recurrence_end_ISO = formatISO(
            addMonths(
              parseISO(this.agendaEvent.startISO),
              recurrence_period_int
            )
          );
        } else {
          this.agendaEvent.recurrence_end_ISO = formatISO(
            addWeeks(parseISO(this.agendaEvent.startISO), recurrence_period_int)
          );
        }
        this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!, true);
      }
      // Non recurrent
      else {
        this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!, false);
        // If New members -> send Notif
        if (this.new_members.length > 0) {
          this.notificationsSvc.sendInviteAgendaEvent(
            this.new_members,
            this.agendaEvent
          );
        }
      }

      this.navCtrl.pop();
    } else {
      this.utils.showToastError("Veuillez donner un titre à l'événement");
      return;
    }
  }

  selectFriend(friend: Friend) {}

  removeEvent() {
    this.agendaSvc.removeEvent(this.agendaEvent!);
  }

  onStartTimeChanged(ev: any) {
    console.log(ev);
    this.startTime = ev.detail.value;
    this.agendaEvent!.start_date_formatted = this.utils.formatDate(
      ev.detail.value
    );
    this.agendaEvent!.start_time_formatted = this.utils.formatTime(
      ev.detail.value
    );
    this.agendaEvent!.startISO = ev.detail.value;
    this.min_time_ISO_end = ev.detail.value;
    this.max_time_ISO_end = formatISO(
      addDays(new Date(parseISO(ev.detail.value)), 30)
    );
    // this.agendaEvent!.day = getDate(parseISO(this.agendaEvent!.startISO));
    // this.agendaEvent!.month = getMonth(parseISO(this.agendaEvent!.startISO));
    // this.agendaEvent!.year = getYear(parseISO(this.agendaEvent!.startISO));
    // this.agendaEvent!.start_date_index =
    //   this.agendaEvent!.day +
    //   '_' +
    //   this.agendaEvent!.month +
    //   '_' +
    //   this.agendaEvent!.year;
    this.agendaEvent!.start_date_day_of_year = getDayOfYear(
      parseISO(this.agendaEvent!.startISO)
    );
    this.agendaEvent!.start_date_year = getYear(
      parseISO(this.agendaEvent!.startISO)
    );

    const refStart = set(parseISO(this.agendaEvent!.startISO), {
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });

    this.agendaEvent!.start_date_ts = refStart.getTime();

    this.agendaEvent!.endISO = formatISO(
      addHours(new Date(parseISO(ev.detail.value)), 1)
    );

    this.agendaEvent!.end_date_formatted = this.utils.formatISODate(
      this.agendaEvent!.endISO
    );
    this.agendaEvent!.end_time_formatted = this.utils.formatTime(
      this.agendaEvent!.endISO
    );
    const refEnd = set(parseISO(this.agendaEvent!.endISO), {
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    });
    this.agendaEvent!.end_date_ts = refEnd.getTime();
    this.agendaEvent!.end_date_day_of_year = getDayOfYear(
      parseISO(this.agendaEvent!.endISO)
    );
    this.agendaEvent!.end_date_year = getYear(
      parseISO(this.agendaEvent!.endISO)
    );
    //}

    //Reload members info
    this.getMembersInfo();
  }

  onEndTimeChanged(ev: any) {
    this.endTime = ev.detail.value;
    this.agendaEvent!.end_date_formatted = this.utils.formatDate(
      ev.detail.value
    );
    this.agendaEvent!.end_time_formatted = this.utils.formatTime(
      ev.detail.value
    );
    this.agendaEvent!.endISO = ev.detail.value;
    const refEnd = set(parseISO(this.agendaEvent!.endISO), {
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    });
    this.agendaEvent!.end_date_ts = refEnd.getTime();
    this.agendaEvent!.end_date_day_of_year = getDayOfYear(
      parseISO(this.agendaEvent!.endISO)
    );
    this.agendaEvent!.end_date_year = getYear(
      parseISO(this.agendaEvent!.endISO)
    );
    console.log('Reload infos');
    //Reload members info
    this.getMembersInfo();
  }

  selectSearchResult(prediction: google.maps.places.AutocompletePrediction) {
    ///WE CAN CONFIGURE MORE COMPLEX FUNCTIONS SUCH AS UPLOAD DATA TO FIRESTORE OR LINK IT TO SOMETHING
    //alert(JSON.stringify(item))
    console.log(prediction);
    this.autocompletePlaceInput.input = prediction.description;
    this.agendaEvent!.place_id = prediction.place_id;
    this.agendaEvent!.place_description = prediction.description;
    this.autocompletePlaces = [];
  }

  clearAutocomplete() {
    this.autocompletePlaces = [];
    this.autocompletePlaceInput.input = '';
    this.agendaEvent!.place_id = '';
  }

  //AUTOCOMPLETE, SIMPLY LOAD THE PLACE USING GOOGLE PREDICTIONS AND RETURNING THE ARRAY.
  updateSearchResults() {
    if (this.autocompletePlaceInput.input == '') {
      this.autocompletePlaces = [];
      return;
    }
    this.GoogleAutocompleteSvc.getPlacePredictions(
      { input: this.autocompletePlaceInput.input },
      (predictions, status) => {
        this.autocompletePlaces = [];
        //this.zone.run(() => {
        if (predictions) {
          predictions.forEach((prediction) => {
            this.autocompletePlaces.push(prediction);
          });
        }
        //});
      }
    );
  }

  async takePhotoPrompt() {
    const { filepath } = await this.mediaSvc.takePhotoPrompt({
      firebasePath: environment.firebase_avatar_event_storage_path,
      filename: 'avatar_event_' + this.agendaEvent!.uid + '.jpg',
      allowEditing: false,
    });

    if (filepath) {
      this.agendaEvent!.avatar = filepath;
      if (this.mode === 'edit') {
        this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!);
      }
    }
  }

  getNbMembers() {
    const nbMembers =
      this.agendaEvent!.members_uid.length +
      this.agendaEvent!.members_invited_uid.length;

    if (nbMembers === 0) {
      return '';
    } else if (nbMembers === 1) {
      return '1 participant';
    } else {
      return nbMembers + ' participants';
    }
  }

  getCheckedFriendsUid(checkedFriends: CheckedFriends[]): {
    uids_checked: string[];
    uids_unchecked: string[];
  } {
    const uids_checked: string[] = [];
    const uids_unchecked: string[] = [];
    for (const item of checkedFriends) {
      if (item.isChecked && !item.disable) {
        uids_checked.push(item.friend.friend_uid!);
      }
      if (!item.isChecked && !item.disable) {
        uids_unchecked.push(item.friend.friend_uid!);
      }
    }
    return { uids_checked, uids_unchecked };
  }

  invite(user: AppUserWithEvents) {
    this.isPopoverUserEventsOpen = false;
    if (!user) return;
    this.friendsSvc.invite(user, true).then(() => {
      user.is_my_friend = true;
    });
  }

  // showUserEvents(user: AppUserWithEvents, e: Event) {
  //   this.selectedUserEvents = user.agendaEvents;
  //   if (this.selectedUserEvents && this.selectedUserEvents?.length > 0) {
  //     this.popoverUserEvents.event = e;
  //     this.isPopoverUserEventsOpen = true;
  //   }
  // }

  // onShowEvents(data: { agendaEvents: AgendaEvent[]; ev: Event }) {
  //   this.selectedUserEvents = data.agendaEvents;
  //   if (this.selectedUserEvents && this.selectedUserEvents?.length > 0) {
  //     this.popoverUserEvents.event = data.ev;
  //     this.isPopoverUserEventsOpen = true;
  //   }
  // }

  onSelectUser(user: AppUserWithEvents, e?: Event) {
    if (user.uid === this.userSvc.userInfo?.uid) return;
    this.selectedUserEvents = user.agendaEvents;
    this.selectedUser = user;
    console.log('get friend status');
    this.selectedUserFriendStatus = this.friendsSvc.getFriendStatus(user.uid);
    this.selectedUserFriendStatusLabel = this.getSelectedFriendStatusLabel(
      this.selectedUserFriendStatus!
    );
    //if (this.selectedUserEvents && this.selectedUserEvents?.length > 0) {
    if (e) this.popoverUserEvents.event = e;
    this.isPopoverUserEventsOpen = true;
    //}
  }

  async onFriendSelected(data: {
    friendSelected: CheckedFriends;
    checkedFriends: CheckedFriends[];
  }) {
    this.tagCheckedFriends(data.checkedFriends);
  }

  async onGroupSelected(checkedFriends: CheckedFriends[]) {
    this.tagCheckedFriends(checkedFriends);
  }

  async tagCheckedFriends(checkedFriends: CheckedFriends[]) {
    for (let item of checkedFriends) {
      if (item.isChecked && !item.disable) {
        if (
          !this.agendaEvent!.members_invited_uid.includes(
            item.friend.friend_uid!
          )
        ) {
          this.agendaEvent!.members_invited_uid.push(item.friend.friend_uid!);
          this.new_members.push(item.friend.friend_uid!);
          const newMember = (
            await this.userSvc.getUserInfos([item.friend.friend_uid!])
          )[0];
          await this.hydrateMemberDysposAndEvents(newMember);
          // Push in members info bar
          this.members.push(newMember);
        }
      }
      if (!item.isChecked && !item.disable) {
        const foundIndex = this.agendaEvent!.members_invited_uid!.findIndex(
          (e) => {
            return e === item.friend.friend_uid!;
          }
        );
        if (foundIndex >= 0) {
          this.agendaEvent!.members_invited_uid.splice(foundIndex, 1);
        }

        //Remove from members info bar
        const foundIndexMembers = this.members.findIndex((e) => {
          return e.uid === item.friend.friend_uid!;
        });
        if (foundIndexMembers >= 0) {
          this.members.splice(foundIndexMembers, 1);
        }

        //Remove from new members
        const foundIndexNewMembers = this.new_members.findIndex((uid) => {
          return uid === item.friend.friend_uid!;
        });
        if (foundIndexNewMembers >= 0) {
          this.new_members.splice(foundIndexNewMembers, 1);
        }
      }
    }
  }

  onRecurrenceChanged(ev: IonSelectCustomEvent<SelectChangeEventDetail<any>>) {
    console.log('Recuurence cahnged');
    if (ev.detail.value === AgendaEventRecurrence.ONE) {
      this.agendaEvent!.recurrence_nb = '0';
    } else {
      this.agendaEvent!.recurrence_nb = '1';
    }
  }

  getSelectedFriendStatusLabel(status: FriendStatus): string {
    let label = '';
    switch (status) {
      case FriendStatus.FRIEND:
        label = 'Vous êtes amis';
        break;
      case FriendStatus.NOFRIEND:
        label = "Vous n'êtes pas amis";
        break;
      case FriendStatus.INVITED:
        label = 'Invitation envoyée';
        break;
      case FriendStatus.SUGGESTED:
        label = 'Invitation reçue';
        break;
    }
    return label;
  }

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

  getIconTypeEvent(): string {
    let path = '';
    if (this.agendaEvent?.type === AgendaEventType.KIDS) {
      path = 'assets/newimg/picto_discussion_kid.png';
    } else if (this.agendaEvent?.type === AgendaEventType.NOKIDS) {
      path = 'assets/newimg/picto_discussion_nokid.png';
    } else if (this.agendaEvent?.type === AgendaEventType.FREE) {
      path = 'assets/newimg/picto_discussion_kidnokid.png';
    }
    return path;
  }

  getSemaineLabel(s: number) {
    if (s > 1) {
      return s + ' semaines';
    } else {
      return s + ' semaine';
    }
  }
}
