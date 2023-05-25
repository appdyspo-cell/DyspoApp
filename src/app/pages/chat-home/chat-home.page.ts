import { Component, OnInit } from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-chat-home',
  templateUrl: './chat-home.page.html',
  styleUrls: ['./chat-home.page.scss'],
})
export class ChatHomePage implements OnInit {
  constructor(private chatSvc: ChatService) {}

  ngOnInit() {}

  createChatroom() {
    this.chatSvc.createChatroom();
  }
}
