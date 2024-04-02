import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { ModalController, NavController } from '@ionic/angular';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Subscription } from 'rxjs';
import { HelperComponent } from 'src/app/components/helper/helper.component';
import {
  AgendaEvent,
  AgendaEventType,
  Chatroom,
  DiscussionType,
  ShowHelper,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.page.html',
  styleUrls: ['./group-list.page.scss'],
})
export class GroupListPage implements OnInit {
  agendaEventType = AgendaEventType;
  agendaSubscription: Subscription;
  discussionType = DiscussionType;
  // chatrooms$: Observable<Chatroom[]>;
  agendaEvents: AgendaEvent[] = [];
  agendaEventsArchived: AgendaEvent[] = [];
  my_uid: string;
  chatrooms: Record<string, Chatroom> = {};
  selectDiscussionsType: DiscussionType;
  isLoading = true;
  showHelper = false;

  constructor(
    private route: Router,
    private modalCtrl: ModalController,
    private agendaSvc: AgendaService,
    private userSvc: UserService,
    private navCtrl: NavController
  ) {
    this.selectDiscussionsType = DiscussionType.ACTIVE;
    this.my_uid = this.userSvc.userInfo?.uid!;

    console.log('Chatrooms ', this.chatrooms);
    this.agendaSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        this.isLoading = false;
        this.agendaEvents = agendaEvents.filter((ev) => {
          return (
            ev.members_uid.length > 1 &&
            isAfter(parseISO(ev.endISO), new Date().getTime())
          );
        });
        this.agendaEventsArchived = agendaEvents.filter((ev) => {
          return (
            ev.members_uid.length > 1 &&
            isBefore(parseISO(ev.endISO), new Date().getTime())
          );
        });
        agendaEvents.forEach((agEvent) => {
          this.chatrooms[agEvent.uid!] = agEvent[
            'user_' + this.my_uid
          ] as Chatroom;
        });
      }
    );
  }

  async ngOnInit() {
    const { value } = await Preferences.get({ key: ShowHelper.CHATS });
    if (!value) {
      this.showHelper = true;
      const modal = await this.modalCtrl.create({
        component: HelperComponent,
        componentProps: {
          showHelper: ShowHelper.CHATS,
        },
      });
      modal.present();

      await Preferences.set({
        key: ShowHelper.CHATS,
        value: 'SHOWN',
      });
    }
  }

  goToChat(
    agendaEvent: AgendaEvent | undefined,
    discussionType: DiscussionType,
    ev: any
  ) {
    const navigationExtras: NavigationExtras = {
      state: {
        agendaEvent,
        discussionType,
      },
    };
    this.navCtrl.navigateForward('/group-chatting', navigationExtras);
  }
  create_group() {
    this.route.navigate(['./create-group']);
  }

  getLastMessageDate(agendaEvent: AgendaEvent) {
    let formattedLastMessageDate = '';
    if (agendaEvent.last_message) {
      formattedLastMessageDate = format(
        parseISO(agendaEvent.last_message.date_ISO),
        'HH:mm dd MMM',
        {
          locale: fr,
        }
      );
    }
    return formattedLastMessageDate;
  }

  getLastMessageMessage(agendaEvent: AgendaEvent) {
    let lastMessage = '';
    if (agendaEvent.last_message) {
      lastMessage = agendaEvent.last_message.message!;
      if (agendaEvent.last_message.deleted_by.includes(this.my_uid)) {
        lastMessage = 'Message effacé';
      } else if (agendaEvent.last_message.is_deleted) {
        lastMessage = 'Message effacé';
      }
    }

    return lastMessage;
  }

  getDelayClass(index: number): string {
    if (index <= 11) {
      return 'animated delay_' + index;
    } else {
      return 'animated delay_12';
    }
  }
}
