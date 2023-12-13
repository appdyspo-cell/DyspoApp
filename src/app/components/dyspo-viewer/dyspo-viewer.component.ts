import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ChatMessage } from 'src/app/models/models';

@Component({
  selector: 'app-dyspo-viewer',
  templateUrl: './dyspo-viewer.component.html',
  styleUrls: ['./dyspo-viewer.component.scss'],
})
export class DyspoViewerComponent implements OnInit {
  message!: ChatMessage;
  url: any;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.url = this.message.image;
  }

  close() {
    console.log('close');
    this.modalCtrl.dismiss();
  }
}
