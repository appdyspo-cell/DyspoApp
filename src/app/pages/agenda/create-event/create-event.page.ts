import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonDatetime, ModalController, NavController } from '@ionic/angular';

import {
  add,
  addHours,
  format,
  formatISO,
  getDate,
  getHours,
  getMonth,
  getYear,
  isAfter,
  isEqual,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { FriendsComponent } from 'src/app/components/friends/friends.component';
import {
  AgendaEvent,
  AgendaEventStatus,
  AgendaEventType,
  Chatroom,
  Friend,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { ChatService } from 'src/app/services/chat.service';
import { MediaService } from 'src/app/services/media.service';
import { UserService } from 'src/app/services/user.service';
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
  tsInputDate: any;
  start_date_formatted!: string;
  end_date_formatted!: string;
  start_time_formatted!: string;
  end_time_formatted!: string;
  min_time_ISO_start!: string;
  min_time_ISO_end!: string;
  agendaEvent: AgendaEvent | undefined;
  agendaEventType = AgendaEventType;
  pageTitle = '';
  saveLabel = '';
  friendSelectionType = FriendSelectionType;
  friendSelection: FriendSelectionType = FriendSelectionType.FRIENDS;

  friends = [];

  autocompletePlaces: google.maps.places.AutocompletePrediction[] = [];
  inputSearch = '';

  GoogleAutocompleteSvc: google.maps.places.AutocompleteService;
  autocompletePlaceInput!: { input: string };
  mode: any;
  uid = '';
  allCanEdit: boolean = false;

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private agendaSvc: AgendaService,
    private modalCtrl: ModalController,
    private mediaSvc: MediaService,
    private userSvc: UserService,
    private chatSvc: ChatService
  ) {
    this.uid = this.userSvc.userInfo?.uid!;
    this.GoogleAutocompleteSvc = new google.maps.places.AutocompleteService();
    this.autocompletePlaceInput = { input: '' };
    this.autocompletePlaces = [];
    this.activatedRoute.params.subscribe((params) => {
      this.mode = params['mode'];
      switch (this.mode) {
        case 'new':
          this.pageTitle = 'Créer un evenement';
          this.saveLabel = 'Sauvegarder';
          this.tsInputDate =
            this.router.getCurrentNavigation()?.extras.state?.['tsDate'];

          this.agendaEvent = {
            admin_uid: this.uid,
            members_uid: [this.uid],
            members_invited_uid: [],
            uid: 'agev_' + new Date().getTime(),
            startISO: formatISO(
              setHours(
                new Date(this.tsInputDate),
                getHours(add(new Date(), { hours: 1 }))
              )
            ),
            endISO: formatISO(
              setHours(
                new Date(this.tsInputDate),
                getHours(add(new Date(), { hours: 2 }))
              )
            ),
            title: '',
            type: AgendaEventType.FREE,
            status: AgendaEventStatus.ACTIVE,
            all_can_edit: false,
            day: getDate(new Date(this.tsInputDate)),
            month: getMonth(new Date(this.tsInputDate)),
            year: getYear(new Date(this.tsInputDate)),
          };

          // Hydrate agendaEvent
          this.agendaEvent.start_date_formatted = this.formatDate(
            this.agendaEvent.startISO
          );
          this.agendaEvent.end_date_formatted = this.formatDate(
            this.agendaEvent.endISO
          );
          this.agendaEvent.start_time_formatted = this.formatTime(
            this.agendaEvent.startISO
          );
          this.agendaEvent.end_time_formatted = this.formatTime(
            this.agendaEvent.endISO
          );

          if (isSameDay(this.tsInputDate, new Date())) {
            this.min_time_ISO_start = this.agendaEvent.startISO;
            this.min_time_ISO_end = this.agendaEvent.startISO;
          }

          break;
        case 'edit':
          this.saveLabel = 'Mettre à jour';
          this.pageTitle = 'Editer un evenement';
          this.agendaEvent =
            this.router.getCurrentNavigation()?.extras.state?.['agendaEvent'];
          if (this.agendaEvent?.place_description) {
            this.autocompletePlaceInput.input =
              this.agendaEvent?.place_description;
          }

          this.allCanEdit = this.agendaEvent!.all_can_edit;

          break;
      }
    });
  }

  ngOnInit() {}

  selectFriend(friend: Friend) {}

  saveOrUpdateEvent() {
    console.log(this.agendaEvent);
    if (this.agendaEvent?.title) {
      console.log('Événement créé :', this.agendaEvent);
      this.agendaEvent.all_can_edit = this.allCanEdit;
      this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!);
      this.navCtrl.pop();
    } else {
      Swal.fire({
        title: 'Veuillez donner un titre à l evt',
        heightAuto: false,
      });
      return;
    }
    // if (this.mode === 'new') {
    // } else if (this.mode === 'edit') {
    // }
  }

  removeEvent() {
    this.agendaSvc.removeEvent(this.agendaEvent!);
  }

  onStartTimeChanged(ev: any) {
    console.log(ev);
    this.agendaEvent!.start_date_formatted = this.formatDate(ev.detail.value);
    this.agendaEvent!.start_time_formatted = this.formatTime(ev.detail.value);
    this.agendaEvent!.startISO = ev.detail.value;
    this.agendaEvent!.day = getDate(parseISO(this.agendaEvent!.startISO));
    this.agendaEvent!.month = getMonth(parseISO(this.agendaEvent!.startISO));
    this.agendaEvent!.year = getYear(parseISO(this.agendaEvent!.startISO));

    this.min_time_ISO_end = ev.detail.value;
    if (
      isAfter(
        parseISO(this.agendaEvent!.startISO),
        parseISO(this.agendaEvent!.endISO)
      )
    ) {
      this.agendaEvent!.endISO = formatISO(
        addHours(new Date(parseISO(ev.detail.value)), 1)
      );

      this.agendaEvent!.end_date_formatted = this.formatDate(
        this.agendaEvent!.endISO
      );
      this.agendaEvent!.end_time_formatted = this.formatTime(
        this.agendaEvent!.endISO
      );
    }
  }

  onEndTimeChanged(ev: any) {
    this.agendaEvent!.end_date_formatted = this.formatDate(ev.detail.value);
    this.agendaEvent!.end_time_formatted = this.formatTime(ev.detail.value);
    this.agendaEvent!.endISO = ev.detail.value;
  }

  formatDate(value: string) {
    console.log(parseISO(value));
    const dateTime = parseISO(value).getTime();
    console.log(dateTime);
    return format(parseISO(value), 'iii dd MMM yyyy', { locale: fr });
  }

  formatTime(dateISO: string) {
    console.log(dateISO);
    return format(parseISO(dateISO), 'HH:mm');
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

  async openFriendsModal() {
    const modal = await this.modalCtrl.create({
      component: FriendsComponent,
      componentProps: {
        agendaEvent: this.agendaEvent,
        mode: this.mode,
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
      this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!);
      if (data.newInvits.length > 0) {
        const userChatroom: Chatroom = {
          count: 0,
          lastMessageRead: '',
          startMessageId: 0,
          nextMessageId: 0,
        };
        this.agendaEvent!['user_' + this.uid] = userChatroom;
        // data.newInvits.forEach((newInvit: string) => {
        //   const userChatroom: Chatroom = {
        //     count: 0,
        //     lastMessageRead: '',
        //     startMessageId: 0,
        //     nextMessageId: 0,
        //   };
        //   this.agendaEvent!['user_' + newInvit] = userChatroom;
        // });
      }
    }
  }

  async takePhotoPrompt() {
    const { filepath } = await this.mediaSvc.takePhotoPrompt({
      firebasePath: environment.firebase_avatar_event_storage_path,
      filename: 'avatar_event_' + this.agendaEvent!.uid + '.jpg',
    });

    if (filepath) {
      this.agendaEvent!.avatar = filepath;
      if (this.mode === 'edit') {
        this.agendaSvc.saveOrUpdateEvent(this.agendaEvent!);
      }
    }
  }

  goToFriendSelection() {
    this.openFriendsModal();
    return;
  }

  // getNbFriendsInvited() {
  //   const nbFriends = this.agendaEvent?.members_uid.filter(
  //     (member_uid) => member_uid != this.uid
  //   ).length;

  //   if (nbFriends === 0) {
  //     return '';
  //   } else if (nbFriends === 1) {
  //     return '1 ami invité';
  //   } else {
  //     return nbFriends + ' amis invités';
  //   }
  // }

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
}
