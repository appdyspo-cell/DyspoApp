import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.page.html',
  styleUrls: ['./group-list.page.scss'],
})
export class GroupListPage implements OnInit {

  constructor(private route: Router) { }

  ngOnInit() {
  }

  GroupChatting() {
    this.route.navigate(['./group-chatting']);
  }
  create_group() {
    this.route.navigate(['./create-group']);
  }

}
