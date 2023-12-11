import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ChatService } from 'src/app/services/chat.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit {
  @Input() user_id!: string;
  @Input() username!: string;
  reportData: any;
  report_text = '';
  constructor(
    public modalCtrl: ModalController,
    public translate: TranslateService,
    public chatSvc: ChatService,
    public utils: UtilsService
  ) {
    this.reportData = [
      {
        image: '../../assets/images/warning.png',
        head: "Signaler l'utilisateur",
        desc: 'Cette personne vous dérange? Dites nous pourquoi.',
        items: [
          {
            icon: 'camera',
            code: 'photo',
            detail: 'Photos inappropriées',
            color: '#5E35B1',
          },
          {
            icon: 'american-football',
            code: 'spam',
            detail: 'Ressemble à du Spam',
            color: 'orange',
          },
          {
            icon: 'paw',
            code: 'other',
            detail: 'Autre',
            color: '#43A047',
          },
          {
            icon: 'close',
            code: 'cancel',
            detail: 'Annuler',
            color: '#cf3c4f',
          },
        ],
      },
    ];
  }

  ngOnInit() {}

  sendReport() {
    console.log('Close modal');
    this.chatSvc
      .reportUser(this.user_id, this.report_text)
      .then((res) => {
        this.utils.swalSuccess(
          'OK',
          "L'utilisateur a été signalé. Votre requête sera examinée sous 48 heures."
        );
        this.modalCtrl.dismiss();
      })
      .catch((err: any) => {
        this.utils.swalError(err);
      });
  }
}
