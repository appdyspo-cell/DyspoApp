import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-create-group-info',
  templateUrl: './create-group-info.page.html',
  styleUrls: ['./create-group-info.page.scss'],
})
export class CreateGroupInfoPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  tabs() {
    this.navCtrl.navigateRoot(['./tabs']);
  }
}
