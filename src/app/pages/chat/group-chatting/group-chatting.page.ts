import {
  ChangeDetectorRef,
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
import { Subscription, take } from 'rxjs';
import { ChatMenuComponent } from 'src/app/components/chat-menu/chat-menu.component';
import { DyspoViewerComponent } from 'src/app/components/dyspo-viewer/dyspo-viewer.component';
import {
  AgendaEvent,
  AppUser,
  AppUserWithEvents,
  ChatMessage,
  Chatroom,
  WarnReportMsg,
  WarnReportMsgStatus,
  UserDyspoStatus,
  WarnReportGroup,
  WarnReportGroupStatus,
  ReportType,
  AgendaEventType,
} from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { CalendarService } from 'src/app/services/calendar.service';
import { ChatService, GetMessagesResult } from 'src/app/services/chat.service';
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
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { UserInfoMenuComponent } from 'src/app/components/user-info-menu/user-info-menu.component';
import { StatusPickerComponent } from 'src/app/calendar/components/status-picker.component';
import { FriendProfileComponent } from 'src/app/components/friend-profile/friend-profile.component';
import { getDate, getMonth, getYear } from 'date-fns';
@Component({
    selector: 'app-group-chatting',
    templateUrl: './group-chatting.page.html',
    styleUrls: ['./group-chatting.page.scss'],
    standalone: false
})
export class GroupChattingPage implements OnInit, OnDestroy {
  UserDyspoStatus = UserDyspoStatus;
  AgendaEventType = AgendaEventType;

  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('txtInput') txtInput!: ElementRef;
  @ViewChild('popoverUserEvents') popoverUserEvents: any;
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
  msgSelected: ChatMessage | undefined;
  userInput = '';
  my_uid!: string;
  my_avatar!: string;
  messagesSubscription!: Subscription;
  member_infos: AppUser[] = [];
  member_infos_obj: Record<string, AppUser> = {};
  defaultAvatar = 'assets/img/user.jpg';
  pendingAttachment: string | undefined;
  deviceInfo!: DeviceInfo;
  display_date_1: string | undefined;
  display_date_2: string | undefined;
  firstVisibleMessageDoc:
    | QueryDocumentSnapshot<DocumentData, DocumentData>
    | undefined;
  
  principalEmojis = ['😂', '😍', '🤔', '👍', '❤️', '😊', '😭', '👏', '🔥', '🎉', '😎', '🙏', '💯', '✨'];
  emojiCategories = [
    {
      label: 'Smileys',
      icon: 'happy-outline',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '🥵', '🥶', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
    },
    {
      label: 'Gestes',
      icon: 'hand-left-outline',
      emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄', '💋', '🩸']
    },
    {
      label: 'Cœurs',
      icon: 'heart-outline',
      emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
    },
    {
      label: 'Animaux',
      icon: 'paw-outline',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔']
    },
    {
      label: 'Nourriture',
      icon: 'fast-food-outline',
      emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊']
    },
    {
      label: 'Activités',
      icon: 'football-outline',
      emojis: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️‍♀️', '🤼‍♂️', '🤸‍♀️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🏄‍♂️', '🏊‍♂️', '🤽‍♂️', '🚣‍♂️', '🧗‍♀️', '🚵‍♂️', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎫', '🎟', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩']
    },
    {
      label: 'Voyage',
      icon: 'car-outline',
      emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🏍', '🛺', '🚲', '🛴', '🛹', '🚏', '🛣', '🛤', '⛽️', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '⛵️', '🛶', '🚤', '🛳', '⛴', '🛥', '🚢', '✈️', '🛩', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰', '🚀', '🛸', '🪐', '🌠', '🌌', '⛱', '🎆', '🎇', '🎑', '🏙', '🌆', '🌅', '🌇', '🌃', '🌉', '🌁']
    }
  ];
  selectedEmojiCategory = 'Smileys';
  showEmojiPicker = false;
  lastClickTime = 0;
  lastClickedMsgUid = '';
  private singleClickTimer: any;

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
    private notificationsSvc: NotificationService,
    private changeDetectorRef: ChangeDetectorRef,
    private calendarSvc: CalendarService
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
    const fetchedMessages: GetMessagesResult = await this.chatSvc.getMessages(
      this.agendaEvent
    );
    this.msgList = fetchedMessages.messages;

    this.firstVisibleMessageDoc = fetchedMessages.firstVisibleMessageDoc;
    console.log('First visible msg ', this.firstVisibleMessageDoc?.data());
    await this.chatSvc.resetCount(this.agendaEvent);
    // On pourrait ici tester si les messages ont été lus et les marquer comme lus si ce n'est pas le cas
    this.scrollDown();
    this.chatSvc.listenMessages(this.agendaEvent);

    this.messagesSubscription = this.chatSvc.messages$.subscribe((data) => {
      this.msgList = data.messages;
      console.log('msg list', this.msgList);

      //Wait the last message Set zero to unread msgs
      if (data.action === 'ADDED') {
        let lastMessage: ChatMessage | undefined;
        if (data.messages?.length > 0) {
          lastMessage = data.messages[data.messages.length - 1];
        }
        this.chatSvc.markLastMessageRead(this.agendaEvent, lastMessage);
        this.scrollDown();
      } else if (data.action === 'MODIFIED') {
        console.log('Modified');
        console.log('New list ', this.msgList);
        // this.changeDetectorRef.detectChanges();
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
    const can_quit = this.agendaEvent.admin_uid !== this.userSvc.userInfo?.uid;

    const modal = await this.popCtrl.create({
      component: ChatMenuComponent,
      componentProps: {
        friend_id: null,
        username: null,
        can_quit,
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
    } else if (role === 'warnreportgroup') {
      this.reportGroup();
    }
  }

  ionViewWillLeave() {
    this.chatSvc.removeListenMessages();
  }

  async sendMsg() {
    console.log('Send msg');
    this.setViewType('');

    if (this.userInput !== '' || this.pendingAttachment !== undefined) {
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
        deleted_by: [],
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

  async getMore() {
    this.loading = true;

    console.log('Get More');

    if (!this.firstVisibleMessageDoc || this.allIsLoaded) return;

    const fetchedPreviousMessages: GetMessagesResult =
      await this.chatSvc.getPreviousMessages(
        this.agendaEvent,
        this.firstVisibleMessageDoc
      );

    this.loading = false;

    if (fetchedPreviousMessages.messages.length === 0) {
      this.allIsLoaded = true;
      this.firstVisibleMessageDoc = undefined;
      return;
    } else {
      if (this.msgList.length === 0) return;
      const firstMessageOfListUid = this.msgList[0].uid;
      this.msgList = fetchedPreviousMessages.messages.concat(this.msgList);
      this.firstVisibleMessageDoc =
        fetchedPreviousMessages.firstVisibleMessageDoc;

      // console.log('firstvisible ', this.firstVisibleMessageDoc?.data());
      setTimeout(() => {
        const elt = window.document.getElementById(firstMessageOfListUid);
        if (elt) {
          const yPosition = elt.getBoundingClientRect().y;
          // console.log(
          //   'yPosition of ' + firstMessageOfListUid + ' = ' + yPosition
          // );
          this.content.scrollToPoint(0, yPosition - 150, 250);
        }
      }, 20);
    }
  }

  onScroll(event: any): void {
    //console.log('onScroll', event);
    if (
      this.loading ||
      this.msgList.length >= this.maxMsg ||
      this.allIsLoaded
    ) {
      // console.log(
      //   'loading:' +
      //     this.loading +
      //     ' Msg:' +
      //     this.msgList.length +
      //     ' allIsLoaded:' +
      //     this.allIsLoaded
      // );
      return;
    } else {
      if (event.detail.scrollTop === 0) {
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
    //Is it the last message of the discussion ?
    const isLastMessage =
      this.msgList.indexOf(this.msgSelected!) === this.msgList.length - 1;

    console.log('is last message? ', isLastMessage);
    Swal.fire({
      title: 'Voulez-vous supprimer ce message ?',
      showDenyButton: true,
      heightAuto: false,
      confirmButtonText: 'Oui',
      denyButtonText: `Non`,
    }).then((result) => {
      if (result.isConfirmed && this.msgSelected) {
        this.chatSvc.deleteMessage(
          this.msgSelected,
          this.agendaEvent,
          isLastMessage
        );
        this.msgSelected = undefined;
      }
    });
  }

  onMsgSelected(msg: ChatMessage) {
    this.msgSelected = msg;
  }

  reportMsg(ev: any) {
    Swal.fire({
      title: 'Voulez-vous signaler ce message ?',
      showDenyButton: true,
      heightAuto: false,
      confirmButtonText: 'Oui',
      denyButtonText: `Non`,
    }).then(async (result) => {
      if (result.isConfirmed && this.msgSelected !== undefined) {
        const my_id = this.my_uid;
        const now = new Date();
        const now_ISO = now.toISOString();
        const senderInfo = (
          await this.userSvc.getUserInfos([this.msgSelected.sender])
        )[0];
        const report_data: WarnReportMsg = {
          uid: 'report_msg_' + new Date().getTime(),
          msg_uid: this.msgSelected.uid,
          msg_sender_uid: this.msgSelected.sender,
          agenda_event_uid: this.agendaEvent.uid!,
          date_ms: now.getTime(),
          date_ISO: now_ISO,
          from_user_id: my_id,
          report_text: this.msgSelected.message!,
          status: WarnReportMsgStatus.CREATED,
          from_user_data: this.userSvc.userInfo,
          msg_sender_data: senderInfo,
          report_type: ReportType.MSG,
        };
        this.msgSelected = undefined;

        this.chatSvc
          .warnReportMsg(report_data)
          .then((res) => {
            this.utils.swalSuccess(
              'OK',
              'Le message a été signalé. Votre requête va être examinée.'
            );
          })
          .catch((err) => {
            this.utils.swalError(err);
          });
      }
    });
  }

  async reportGroup() {
    const { value: text } = await Swal.fire({
      input: 'textarea',
      heightAuto: false,
      inputLabel: 'Signaler le groupe',
      inputPlaceholder: 'Decrivez ce qui vous dérange',
      inputAttributes: {
        'aria-label': 'Type your message here',
      },
      cancelButtonText: 'Annuler',
      confirmButtonText: 'Envoyer',
      showCancelButton: true,
    });
    if (text) {
      //const last_five_messages = this.m
      const now = new Date();
      const now_ISO = now.toISOString();
      const report_data: WarnReportGroup = {
        uid: 'report_group_' + new Date().getTime(),
        agenda_event_uid: this.agendaEvent.uid!,
        date_ms: now.getTime(),
        date_ISO: now_ISO,
        from_user_id: this.my_uid,
        report_text: text,
        status: WarnReportGroupStatus.CREATED,
        from_user_data: this.userSvc.userInfo,
        last_five_messages: [],
        members_uid: this.agendaEvent.members_uid,
        report_type: ReportType.GROUP,
      };
      this.chatSvc
        .warnReportGroup(report_data)
        .then((res) => {
          this.utils.swalSuccess(
            'OK',
            'Le groupe a été signalé. Votre requête va être examinée.'
          );
        })
        .catch((err) => {
          this.utils.swalError(err);
        });
    }
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

  async openImage(msg: ChatMessage, event: any) {
    event?.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: DyspoViewerComponent,
      componentProps: {
        image: msg.image,
      },
    });
    modal.present();
  }

  async onSelectUser(user: AppUserWithEvents, $event: MouseEvent) {
    if (user.uid === this.my_uid) {
      const modal = await this.modalCtrl.create({
        component: StatusPickerComponent,
        componentProps: { hasKids: !!this.userSvc.userInfo?.with_kids },
        cssClass: 'status-picker-modal',
      });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (data != null) {
        user.dyspoStatus = data as UserDyspoStatus;
        this.agendaSvc.saveDyspos([{
          time: this.agendaEvent.start_date_ts,
          userDyspo: data as UserDyspoStatus,
          month: getMonth(this.agendaEvent.start_date_ts),
          year: getYear(this.agendaEvent.start_date_ts),
          day: getDate(this.agendaEvent.start_date_ts),
        }]);
      }
      return;
    }

    const modal = await this.modalCtrl.create({
      component: FriendProfileComponent,
      componentProps: {
        user,
        isFriend: user.is_my_friend !== false,
      },
      initialBreakpoint: 0.75,
      breakpoints: [0, 0.75, 1],
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === 'requested') {
      user.is_my_friend = true;
    }
  }

  addToCalendar() {
    this.calendarSvc.promptAddToCalendar(this.agendaEvent);
  }

  async openEvent() {
    const modal = await this.modalCtrl.create({
      component: AgendaEventInfoComponent,
      componentProps: {
        agendaEvent: this.agendaEvent,
        isInvitation: false,
        isMulti: this.agendaEvent.is_multi,
      },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    console.log(data);
    if (role === 'confirm') {
    }
  }

  isMsgHiddenForMe(msg: ChatMessage): any {
    if (msg.deleted_by && msg.deleted_by.includes(this.my_uid)) {
      msg.message = 'Effacé';
      // return true;
    }

    //return true;
  }

  presentPopover(e: Event) {
    // this.popover.event = e;
    // this.isOpen = true;
  }

  getInputPlaceholder() {
    if (this.pendingAttachment) {
      return 'Ajoutez une légende';
    } else {
      return 'Tapez votre message';
    }
  }

  getUserInputAttachment() {
    if (this.userInput && this.userInput.length > 0) {
      return this.userInput;
    } else {
      return 'Ajoutez une légende';
    }
  }

  onMsgInputFocused() {
    console.log('on focus');
    this.setViewType('');
  }

  getSenderColor(senderId: string): string {
    const colors = [
      '#e542a3',
      '#9141ac',
      '#1f7aec',
      '#209308',
      '#ff8f2c',
      '#ffb900',
      '#6366f1',
      '#ec4899',
    ];
    let hash = 0;
    if (senderId) {
      for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.userInput += emoji;
  }

  handleMessageClick(msg: ChatMessage) {
    const now = Date.now();
    if (this.lastClickedMsgUid === msg.uid && now - this.lastClickTime < 300) {
      // Double tap — heart only, cancel the pending single-click
      clearTimeout(this.singleClickTimer);
      this.msgSelected = undefined;
      this.toggleLike(msg);
      this.lastClickTime = 0;
      this.lastClickedMsgUid = '';
    } else {
      this.lastClickTime = now;
      this.lastClickedMsgUid = msg.uid;
      // Delay single-click so a double-tap can cancel it
      clearTimeout(this.singleClickTimer);
      this.singleClickTimer = setTimeout(() => {
        this.onMsgSelected(msg);
      }, 300);
    }
  }

  toggleLike(msg: ChatMessage) {
    this.chatSvc.likeMessage(msg, this.agendaEvent);
  }

  addReaction(msg: ChatMessage, emoji: string, event: Event) {
    event.stopPropagation();
    // Note: Le backend Dyspo actuel supporte un tableau de likes (string[]).
    // Nous lions l'émoji cliqué à cette mécanique pour ne pas briser la DB.
    this.toggleLike(msg);
    this.msgSelected = undefined;
  }
}
