import { Component, Input, OnInit } from '@angular/core';
import {
  AlertController,
  ModalController,
  PopoverController,
} from '@ionic/angular';
import { ChatService } from 'src/app/services/chat.service';
import { UtilsService } from 'src/app/services/utils.service';
import { ReportComponent } from '../report/report.component';
import { Chatroom, WarnReportGroup } from 'src/app/models/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat-menu',
  templateUrl: './chat-menu.component.html',
  styleUrls: ['./chat-menu.component.scss'],
})
export class ChatMenuComponent implements OnInit {
  @Input() friend_id!: string;
  @Input() username!: string;
  @Input() my_chatroom!: Chatroom;
  @Input() can_quit!: boolean;
  notificationsIcon: any;
  notifLabel: any;

  constructor(
    private popCtrl: PopoverController,
    private alertCtrl: AlertController,
    private utils: UtilsService,
    private modalCtrl: ModalController,
    private chatSvc: ChatService
  ) {}

  ngOnInit() {
    console.log('my chatroom ', this.my_chatroom);
  }

  async requestBlock() {
    this.popCtrl.dismiss();
    const alert = await this.alertCtrl.create({
      //cssClass: 'my-custom-class',
      header: 'Confirmation',
      message: 'Voulez-vous vraiment bloquer cet utilisateur ?',
      buttons: [
        {
          text: 'NON',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel: blah');
          },
        },
        {
          text: 'OUI',
          handler: () => {
            this.blockUser();
          },
        },
      ],
    });

    await alert.present();
  }

  blockUser() {
    console.log('block User');
    this.chatSvc
      .blockUser(this.friend_id)
      .then((res) => {
        this.utils.showToast("L'utilisateur a été bloqué");
      })
      .catch((err) => {
        this.utils.showToastError(err);
      });
  }

  requestDelete() {
    this.popCtrl.dismiss();
  }

  async quitEvent() {
    Swal.fire({
      title:
        "Voulez-vous vraiment quitter ce groupe ? Ceci effacera l'evenement de votre agenda",
      showDenyButton: true,
      heightAuto: false,
      confirmButtonText: 'Oui',
      denyButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmQuitEvent();
      } else {
        this.popCtrl.dismiss({ friend: undefined }, 'cancel');
      }
    });
  }

  async _quitEvent() {
    const alert = await this.alertCtrl.create({
      //cssClass: 'my-custom-class',
      header: 'Confirmation',
      message:
        "Voulez-vous vraiment quitter ce groupe ? Ceci effacera l'evenement de votre agenda",
      buttons: [
        {
          text: 'NON',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel: blah');
          },
        },
        {
          text: 'OUI',
          handler: () => {
            this.confirmQuitEvent();
          },
        },
      ],
    });

    await alert.present();
  }
  confirmQuitEvent() {
    this.popCtrl.dismiss({ friend: undefined }, 'quitevent');
  }

  async requestReport() {
    this.popCtrl.dismiss({ friend: undefined }, 'warnreportgroup');

    // const modal = await this.modalCtrl.create({
    //   component: ReportComponent,
    //   cssClass: 'transparent-modal',
    //   componentProps: {
    //     user_id: this.friend_id,
    //   },
    // });
    // modal.present();
    // const { data, role } = await modal.onWillDismiss();

    // console.log(data);
    // if (role === 'confirm') {
    // }
    //  modal.onDidDismiss().then(data=>{
    //   console.log(data.data.friendListDocReturned);
    //   friendListDoc = data.data.friendListDocReturned;
    //  });
  }

  toggleNotifications() {
    this.popCtrl.dismiss(
      { my_chatroom: this.my_chatroom },
      'togglenotifications'
    );
  }
}
