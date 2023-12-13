import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Observable, Subscription } from 'rxjs';
import { AgendaEvent, Chatroom } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { ChatService } from 'src/app/services/chat.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.page.html',
  styleUrls: ['./group-list.page.scss'],
})
export class GroupListPage implements OnInit {
  agendaSubscription: Subscription;
  // chatrooms$: Observable<Chatroom[]>;
  agendaEvents: AgendaEvent[] = [];
  my_uid: string;
  chatrooms: Record<string, Chatroom> = {};

  constructor(
    private route: Router,
    private chatSvc: ChatService,
    private agendaSvc: AgendaService,
    private userSvc: UserService,
    private navCtrl: NavController
  ) {
    this.my_uid = this.userSvc.userInfo?.uid!;

    this.agendaSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        console.log('Chat group > agenda events', agendaEvents);
        this.agendaEvents = agendaEvents;
        agendaEvents.forEach((agEvent) => {
          this.chatrooms[agEvent.uid!] = agEvent[
            'user_' + this.my_uid
          ] as Chatroom;
        });

        console.log('Chatrooms ', this.chatrooms);
      }
    );
  }

  ngOnInit() {}

  goToChat(agendaEvent: AgendaEvent | undefined, ev: any) {
    const navigationExtras: NavigationExtras = {
      state: {
        agendaEvent,
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
}
