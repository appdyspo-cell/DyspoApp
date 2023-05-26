import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-picture',
  templateUrl: './picture.component.html',
  styleUrls: ['./picture.component.scss'],
})
export class PictureComponent implements OnInit {
  constructor(private modalController: ModalController) {}

  ngOnInit() {}
  dismiss() {
    this.modalController.dismiss();
  }
}
