import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AgendaEvent } from 'src/app/models/models';
@Component({
  selector: 'app-group-chatting',
  templateUrl: './group-chatting.page.html',
  styleUrls: ['./group-chatting.page.scss'],
})
export class GroupChattingPage implements OnInit {
  viewType: string = '';
  agendaEvent: AgendaEvent;
  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.agendaEvent =
      this.router.getCurrentNavigation()?.extras.state?.['agendaEvent'];
    console.log('Event uid', this.agendaEvent);
  }

  ngOnInit() {}

  setViewType(vt: string) {
    this.viewType = vt;
  }
  groupinfo() {
    this.router.navigate(['./group-info']);
  }
}
