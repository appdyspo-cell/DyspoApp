import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Friend, AppUser, UserDyspoStatus } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { FriendsService } from 'src/app/services/friends.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-friend-profile',
    templateUrl: './friend-profile.component.html',
    styleUrls: ['./friend-profile.component.scss'],
    standalone: false
})
export class FriendProfileComponent implements OnInit {
  @Input() user!: AppUser;
  @Input() isFriend: boolean = true;
  /** true quand on visualise quelqu'un qui NOUS a envoyé une invitation */
  @Input() isPendingInvitation = false;

  defaultAvatar = 'assets/logo.svg';
  sending = false;
  requested = false;
  removing = false;
  accepting = false;
  declining = false;

  todayDyspo: UserDyspoStatus | undefined;
  commonFriendsCount = 0;
  loadingDyspo = true;

  /** Exposé au template pour les comparaisons ngIf */
  readonly UserDyspoStatus = UserDyspoStatus;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private friendsSvc: FriendsService,
    private agendaSvc: AgendaService,
    private utils: UtilsService
  ) {}

  async ngOnInit() {
    if (!this.user?.uid) return;

    // Statut dyspo du jour (en parallèle avec les amis communs)
    const [dyspoMap, commonCount] = await Promise.all([
      this.agendaSvc.getTodayDyspos([this.user.uid]),
      (this.isFriend || this.isPendingInvitation)
        ? this.friendsSvc.getCommonFriendsCount(this.user.uid)
        : Promise.resolve(0),
    ]);

    const status = dyspoMap.get(this.user.uid);
    // N'afficher que si vraiment rempli
    this.todayDyspo = (status && status !== UserDyspoStatus.UNDEFINED)
      ? status
      : undefined;

    this.commonFriendsCount = commonCount ?? 0;
    this.loadingDyspo = false;
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async sendRequest() {
    if (this.sending || this.requested) return;
    this.sending = true;
    await this.friendsSvc.invite(this.user, true);
    this.sending = false;
    this.requested = true;
  }

  async removeFriend() {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer cet ami ?',
      message: `${this.user.firstname} sera retiré de votre liste d'amis.`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            this.removing = true;
            try {
              await this.friendsSvc.deleteFriend(
                { friend_uid: this.user.uid } as Friend,
                null
              );
              this.modalCtrl.dismiss('removed');
            } catch (err) {
              this.removing = false;
              this.utils.showToastError('Erreur lors de la suppression');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /** Accepter la demande d'ami reçue */
  async acceptInvitation() {
    if (this.accepting || this.declining) return;
    this.accepting = true;
    try {
      await this.friendsSvc.addFriend({ friend_uid: this.user.uid } as Friend);
      this.modalCtrl.dismiss('accepted');
    } catch {
      this.accepting = false;
      this.utils.showToastError("Erreur lors de l'acceptation");
    }
  }

  /** Refuser la demande d'ami reçue */
  async declineInvitation() {
    if (this.declining || this.accepting) return;
    this.declining = true;
    try {
      await this.friendsSvc.deleteFriend({ friend_uid: this.user.uid } as Friend, null);
      this.modalCtrl.dismiss('declined');
    } catch {
      this.declining = false;
      this.utils.showToastError('Erreur lors du refus');
    }
  }

  closeWithResult() {
    this.modalCtrl.dismiss(this.requested ? 'requested' : null);
  }
}
