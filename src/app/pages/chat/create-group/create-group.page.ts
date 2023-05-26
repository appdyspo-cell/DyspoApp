import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.page.html',
  styleUrls: ['./create-group.page.scss'],
})
export class CreateGroupPage implements OnInit {

  constructor(private route: Router) { }

  ngOnInit() {
  }

  creategroupinfo() {
    this.route.navigate(['./create-group-info']);
  }
}
