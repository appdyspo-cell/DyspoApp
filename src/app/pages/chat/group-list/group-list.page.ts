import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    private userSvc: UserService
  ) {
    // this.chatrooms$ = this.chatSvc.chatrooms$;

    // this.chatroomsSubscrition = this.chatrooms$.subscribe((chatrooms) => {
    //   this.chatrooms = chatrooms;
    //   console.log(this.chatrooms);
    // });
    this.my_uid = this.userSvc.userInfo?.uid!;

    this.agendaSubscription = this.agendaSvc.agendaEvents$.subscribe(
      (agendaEvents) => {
        this.agendaEvents = agendaEvents;
        agendaEvents.forEach((agEvent) => {
          //const chatroom = agEvent['user_' + this.my_uid] as Chatroom;
          this.chatrooms[agEvent.uid!] = agEvent[
            'user_' + this.my_uid
          ] as Chatroom;
        });

        console.log(this.agendaEvents);
      }
    );
  }

  ngOnInit() {}

  GroupChatting() {
    this.route.navigate(['./group-chatting']);
  }
  create_group() {
    this.route.navigate(['./create-group']);
  }
}
