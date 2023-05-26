import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-group-chatting',
  templateUrl: './group-chatting.page.html',
  styleUrls: ['./group-chatting.page.scss'],
})
export class GroupChattingPage implements OnInit {
  viewType: string = '';
  constructor(private route: Router) {}

  ngOnInit() {}

  setViewType(vt: string) {
    this.viewType = vt;
  }
  groupinfo() {
    this.route.navigate(['./group-info']);
  }
}
