import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { PictureComponent } from 'src/app/components/picture/picture.component';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.page.html',
  styleUrls: ['./group-info.page.scss'],
})
export class GroupInfoPage implements OnInit {
  constructor(
    private route: Router,
    private modalController: ModalController
  ) {}

  ngOnInit() {}

  create_group_info() {
    this.route.navigate(['./create-group-info']);
  }

  profilepicture() {
    this.modalController
      .create({ component: PictureComponent })
      .then((modalElement) => {
        modalElement.present();
      });
  }
}
