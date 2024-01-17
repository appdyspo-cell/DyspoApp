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
        image: 'assets/warning.png',
        head: 'Signaler le groupe',
        desc: 'Ce groupe vous dérange? Dites nous pourquoi.',
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

  sendWarningReport() {
    console.log('sendWarningReport Group');
    this.chatSvc
      .warnReportUser(this.user_id, this.report_text)
      .then((res) => {
        this.utils.swalSuccess(
          'OK',
          'Le groupe a été signalé. Votre requête va être examinée.'
        );
        this.modalCtrl.dismiss();
      })
      .catch((err: any) => {
        this.utils.swalError(err);
      });
  }
}
