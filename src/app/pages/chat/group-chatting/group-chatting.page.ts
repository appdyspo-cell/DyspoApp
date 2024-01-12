import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CameraSource } from '@capacitor/camera';
import {
  IonContent,
  ModalController,
  NavController,
  PopoverController,
} from '@ionic/angular';
import { format, isSameDay, parseISO } from 'date-fns';
import { cloneDeep, reduce } from 'lodash';
import { Subscription } from 'rxjs';
import { ChatMenuComponent } from 'src/app/components/chat-menu/chat-menu.component';
import { DyspoViewerComponent } from 'src/app/components/dyspo-viewer/dyspo-viewer.component';
import {
  AgendaEvent,
  AppUser,
  AppUserWithEvents,
  ChatMessage,
  Chatroom,
  UserDyspoStatus,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { MediaService } from 'src/app/services/media.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { Keyboard } from '@capacitor/keyboard';
import Swal from 'sweetalert2';
import { Device, DeviceInfo } from '@capacitor/device';
import { UtilsService } from 'src/app/services/utils.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { fr } from 'date-fns/locale';
@Component({
  selector: 'app-group-chatting',
  templateUrl: './group-chatting.page.html',
  styleUrls: ['./group-chatting.page.scss'],
})
export class GroupChattingPage implements OnInit, OnDestroy {
  UserDyspoStatus = UserDyspoStatus;

  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('txtInput') txtInput!: ElementRef;
  loading = false;

  allIsLoaded = false;
  //Maximum of messages per batch
  limit = 50;
  //Maximum of messages can be displayed
  maxMsg = 150;

  paramData: any;
  msgList: ChatMessage[] = [];
  viewType: string = '';
  agendaEvent: AgendaEvent;
  msgSelected: any;
  userInput = '';
  my_uid!: string;
  my_avatar!: string;
  messagesSubscription!: Subscription;
  member_infos: AppUser[] = [];
  member_infos_obj: Record<string, AppUser> = {};
  defaultAvatar = 'assets/img/user.png';
  pendingAttachment: string | undefined;
  deviceInfo!: DeviceInfo;
  display_date_1: string | undefined;
  display_date_2: string | undefined;

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private popCtrl: PopoverController,
    private router: Router,
    private chatSvc: ChatService,
    private userSvc: UserService,
    private agendaSvc: AgendaService,
    private friendsSvc: FriendsService,
    private mediaSvc: MediaService,
    private modalCtrl: ModalController,
    private utils: UtilsService,
    private notificationsSvc: NotificationService
  ) {
    this.agendaEvent =
      this.router.getCurrentNavigation()?.extras.state?.['agendaEvent'];
    console.log('Agenda Event', this.agendaEvent);
    this.my_uid = this.userSvc.userInfo?.uid!;
    this.my_avatar = this.userSvc.userInfo?.avatarPath!;
    //Display dates
    if (
      isSameDay(this.agendaEvent.start_date_ts, this.agendaEvent.end_date_ts)
    ) {
      this.display_date_1 =
        'Le ' +
        format(parseISO(this.agendaEvent.startISO), 'iii dd MMM', {
          locale: fr,
        }) +
        ' à ' +
        format(parseISO(this.agendaEvent.startISO), 'HH:mm', {
          locale: fr,
        });
    } else {
      this.display_date_1 =
        'Du ' +
        format(parseISO(this.agendaEvent.startISO), 'iii dd MMM HH:mm', {
          locale: fr,
        });
      this.display_date_2 =
        'Au ' +
        format(parseISO(this.agendaEvent.endISO), 'iii dd MMM HH:mm', {
          locale: fr,
        });
    }
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    this.deviceInfo = await Device.getInfo();
    // Messages
    this.chatSvc.removeListenMessages();
    this.msgList = await this.chatSvc.getMessages(this.agendaEvent);
    await this.chatSvc.resetCount(this.agendaEvent);
    // On pourrait ici tester si les messages ont été lus et les marquer comme lus si ce n'est pas le cas
    this.scrollDown();
    this.chatSvc.listenMessages(this.agendaEvent);

    this.messagesSubscription = this.chatSvc.messages$.subscribe((data) => {
      this.msgList = data.messages;

      //Wait the last message Set zero to unread msgs
      if (data.action === 'ADDED') {
        let lastMessage: ChatMessage | undefined;
        if (data.messages?.length > 0) {
          lastMessage = data.messages[data.messages.length - 1];
        }
        this.chatSvc.markLastMessageRead(this.agendaEvent, lastMessage);
        this.scrollDown();
      }
    });

    // Infos on members confirmed of the chat
    this.member_infos = await this.userSvc.getUserInfos(
      this.agendaEvent.members_uid
    );

    // transform
    this.member_infos_obj = this.member_infos.reduce((acc, user: AppUser) => {
      acc[user.uid as string] = user;
      return acc;
    }, {} as Record<string, AppUser>);

    // Get dyspos

    for (let member of this.member_infos) {
      // Dyspos
      const dyspo = (
        await this.agendaSvc.getDyspos([member.uid], this.agendaEvent)
      )[0];
      const dyspoStatus = dyspo.friend_dyspo;
      // Hydrate AppUser with dyspo status
      member.dyspoStatus = dyspoStatus;

      // Is he my friend ?
      for (let member of this.member_infos) {
        member.is_my_friend = this.friendsSvc.isMyFriend(member.uid);
      }
    }
  }

  async openMenu(ev: any) {
    const modal = await this.popCtrl.create({
      component: ChatMenuComponent,
      componentProps: {
        friend_id: null,
        username: null,
        my_chatroom: this.agendaEvent['user_' + this.my_uid] as Chatroom,
      },
      translucent: true,
      event: ev,
      mode: 'md',
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'quitevent') {
      if (this.agendaEvent.admin_uid === this.userSvc.userInfo?.uid) {
        this.utils.showAlert(
          "Vous devez d'abord désigner un nouvel administrateur avant de quitter cet événement"
        );
        return;
      }
      this.utils.showLoader();
      this.agendaSvc
        .quitEvent(this.agendaEvent)
        .then((res) => {
          this.utils.hideLoader();
          this.navCtrl.pop();
        })
        .catch((err) => {
          this.utils.showToastError(err);
        });
    } else if (role === 'togglenotifications') {
      const my_chatroom = data['my_chatroom'] as Chatroom;
      my_chatroom.isNotifications = !my_chatroom.isNotifications;
      console.log('My new chatroom', my_chatroom);
      console.log('My new chatroom', this.agendaEvent);
      this.chatSvc.toggleUserNotification(
        this.agendaEvent,
        my_chatroom.isNotifications
      );
    }
  }

  ionViewWillLeave() {
    this.chatSvc.removeListenMessages();
  }

  async sendMsg() {
    console.log('Send msg');

    if (this.userInput !== '') {
      const timeMoment = format(new Date(), 'dd/MM/yyyy HH:mm');
      const d = new Date();

      const message: ChatMessage = {
        sender: this.my_uid,
        time: timeMoment,
        time_ms: d.getTime(),
        message: this.userInput,
        uid: 'msg_' + d.getTime(),
        date_ISO: d.toISOString(),
        read_by: [],
      };

      if (this.pendingAttachment) {
        message.image = this.pendingAttachment;
      }

      this.chatSvc.sendMsg(message, this.agendaEvent);
      this.pendingAttachment = undefined;

      this.notificationsSvc.sendMessageInGroup(
        this.agendaEvent.uid!,
        this.userInput
      );
      this.userInput = '';
      if (this.deviceInfo.platform !== 'web') {
        Keyboard.hide();
      }
      //this.txtInput.nativeElement.blur();
      this.scrollDown();
      /*setTimeout(() => {
        this.senderSends();
      }, 500);*/
    }
    //this.show = false;
  }

  getMore() {
    // this.loading = true;
    // const previousMsgList = [];
    // const firstId = this.msgList[0].id;
    // let startAt = firstId - this.limit;
    // if (startAt < this.myChatroom.startMessageId) {
    //   startAt = this.myChatroom.startMessageId;
    // }
    // const firstMessage = this.msgList[0];
    // this.afDB
    //   .list('chatrooms_messages/' + this.chatroomKey + '/', (ref) =>
    //     ref.orderByChild('id').limitToFirst(this.limit).startAt(startAt)
    //   )
    //   .snapshotChanges(['child_added', 'child_changed'])
    //   .pipe(take(1))
    //   .subscribe((actions) => {
    //     actions.forEach((action) => {
    //       const incomingMessage = action.payload.val() as Message;
    //       if (firstMessage && firstMessage.id <= incomingMessage.id) {
    //       } else {
    //         previousMsgList.push(incomingMessage);
    //       }
    //     });
    //     if (previousMsgList.length === 0) {
    //       this.allIsLoaded = true;
    //     } else {
    //       this.msgList = previousMsgList.concat(this.msgList);
    //       //Set the scroll at the same y coord of the first Message before loading more
    //       setTimeout(() => {
    //         const yPosition = document
    //           .getElementById('msg_' + firstId)
    //           .getBoundingClientRect().y;
    //         console.log(yPosition);
    //         this.msgScrollableContainer.nativeElement.scrollTo({
    //           top: yPosition - 150,
    //           left: 0,
    //           behavior: 'auto',
    //         });
    //       }, 20);
    //     }
    //     console.log(previousMsgList);
    //     console.log(this.msgList);
    //     this.loading = false;
    //   });
  }

  onScroll(event: any): void {
    console.log('onScroll', event);
    if (
      this.loading ||
      this.msgList.length >= this.maxMsg ||
      this.allIsLoaded
    ) {
      console.log(
        'loading:' +
          this.loading +
          ' Msg:' +
          this.msgList.length +
          ' allIsLoaded:' +
          this.allIsLoaded
      );
      return;
    } else {
      if (event === 'top') {
        this.loading = true;
        setTimeout(() => {
          this.getMore();
        }, 200);
      }
    }
  }

  scrollDown() {
    setTimeout(() => {
      this.content.scrollToBottom(500);
    }, 350);
  }

  deleteMsg(ev: any) {
    // Swal.fire({
    //   title: 'Voulez-vous supprimer ce message ?',
    //   showDenyButton: true,
    //   heightAuto: false,
    //   confirmButtonText: 'Oui',
    //   denyButtonText: `Non`,
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     this.afDB
    //     .object(
    //       'chatrooms_messages/' + this.chatroomKey + '/' + this.msgSelected.message_key
    //     )
    //     .update({ is_deleted: true }).then(res=>{
    //       console.log('Msg deleted');
    //     })
    //     .catch(err=>{
    //       console.log(err);
    //     });
    //   }
    // });
  }

  reportMsg(ev: any) {
    // Swal.fire({
    //   title: 'Voulez-vous signaler ce message ?',
    //   showDenyButton: true,
    //   heightAuto: false,
    //   confirmButtonText: 'Oui',
    //   denyButtonText: `Non`,
    // }).then(async (result) => {
    //   if (result.isConfirmed) {
    //     console.log('Close modal');
    //     const my_id = this.utils.userInfo.id;
    //     const now = new Date();
    //     const now_ISO = now.toISOString();
    //     const report_data: ReportMsg = {
    //       report_chat_key: this.msgSelected.message_key,
    //       report_chatroom_key: this.chatroomKey,
    //       report_date_ms: now.getTime(),
    //       report_date_ISO: now_ISO,
    //       from_user_id: my_id,
    //       report_user_id: this.friend_id,
    //       report_text: this.msgSelected.message,
    //       status: environment.report_msg_status.CREATED,
    //       from_user_data: this.utils.userInfo,
    //       report_user_data: await this.firestoreService.getUserByID(this.friend_id)
    //     };
    //         this.firestoreService.reportMsg(report_data).then(res => {
    //           this.utils.swalSuccess('OK', 'Le message a été signalé. Votre requête sera examinée sous 48 heures.');
    //           this.modalCtrl.dismiss();
    //       }).catch( err => {
    //         this.utils.swalError(err);
    //       });
    //   }
    // });
  }

  setViewType(vt: string) {
    this.viewType = vt;
    console.log(this.viewType);
  }
  groupinfo() {
    //this.router.navigate(['./group-info']);
  }

  async takePhoto() {
    this.viewType = '';
    const { filepath } = await this.mediaSvc.takePhoto({
      firebasePath:
        environment.firebase_event_root + '/' + this.agendaEvent.uid,
      filename: 'att_' + new Date().getTime() + '.jpg',
      source: CameraSource.Camera,
      allowEditing: false,
    });
    this.pendingAttachment = filepath;
    this.scrollDown();
  }
  async openGallery() {
    this.viewType = '';
    const { filepath } = await this.mediaSvc.takePhoto({
      firebasePath:
        environment.firebase_event_root + '/' + this.agendaEvent.uid,
      filename: 'att_' + new Date().getTime() + '.jpg',
      source: CameraSource.Photos,
      allowEditing: false,
    });
    this.pendingAttachment = filepath;
    this.scrollDown();
  }

  async openImage(msg: ChatMessage) {
    const modal = await this.modalCtrl.create({
      component: DyspoViewerComponent,
      componentProps: {
        message: msg,
      },
    });
    modal.present();
  }

  onSelectUser(user: AppUserWithEvents, $event: MouseEvent) {
    if (!user.is_my_friend) {
      this.friendsSvc.invite(user, true).then(() => {
        user.is_my_friend = true;
      });
    }
  }

  async openEvent() {
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent: this.agendaEvent,
        isInvitation: false,
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
    }
  }
}
