import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { ContactPayload } from '@capacitor-community/contacts';
import { Share } from '@capacitor/share';
import { IonItemGroup, Platform } from '@ionic/angular';
import { AppDeviceContact } from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { LoggerService } from 'src/app/services/logger.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-fix-contacts',
  templateUrl: './fix-contacts.page.html',
  styleUrls: ['./fix-contacts.page.scss'],
})
export class FixContactsPage implements OnInit, AfterViewInit {
  @ViewChild('mainContainer', { read: ViewContainerRef })
  container!: ViewContainerRef;
  @ViewChild('itemGroup', { read: TemplateRef })
  templateGroup!: TemplateRef<any>;
  @ViewChildren(IonItemGroup, { read: ElementRef }) itemGroups!: QueryList<any>;
  contacts: ContactPayload[] = [];
  appContacts: AppDeviceContact[] = [];
  appContactsGrouped: { letter: string; contacts: AppDeviceContact[] }[] = [];
  scroll = false;
  colors = [
    '#a2b9bc',
    '#6b5b95',
    '#feb236',
    '#d64161',
    '#ff7b25',
    '#b2ad7f',
    '#878f99',
  ];

  inputSearch = '';
  autocompleteItems: AppDeviceContact[] = [];

  constructor(
    private userSvc: UserService,
    private utils: UtilsService,
    private friendsSvc: FriendsService,
    private logger: LoggerService
  ) {}

  ngOnInit() {}

  async ngAfterViewInit() {
    this.appContactsGrouped = this.friendsSvc.appContactsGrouped;
    this.appContacts = this.friendsSvc.appContacts;

    console.log('Fix contacts');
    try {
      //Is my contact a member of Dyspo ?
      await this.userSvc.hydrateAppContacts(this.appContacts);
      //Is my contact a friend ?
      this.appContacts.forEach((contact) => {
        contact.is_my_friend = this.friendsSvc.isMyFriend(contact.uid!);
      });

      this.buildData(this.appContactsGrouped);
    } catch (err: any) {
      console.error(err);
      this.logger.sendError(
        err,
        'fetchContactsData',
        this.userSvc.userInfo?.uid!
      );
    }
  }

  scrollToLetter(letter: string) {
    for (let i = 0; i < this.appContactsGrouped.length; i++) {
      const group = this.appContactsGrouped[i];
      if (group.letter == letter) {
        const group = this.itemGroups.filter((element, index) => index === i);
        if (group) {
          const el: any = group[0];
          el.nativeElement.scrollIntoView();
        }
        return;
      }
    }
  }

  letterScrollActive(active: boolean) {
    this.scroll = active;
  }

  updateSearchResults() {
    const pattern = this.inputSearch;
    if (pattern === '') {
      this.autocompleteItems = [];
      return;
    } else if (pattern && pattern.length > 2) {
      this.autocompleteItems = this.appContacts.filter(
        (user) =>
          user.display!.toUpperCase().indexOf(pattern.toUpperCase()) >= 0
      );
      // this.autocompleteItems.forEach((user) => {
      //   user.is_my_friend = this.friendService.isMyFriend(user.uid);
      //   console.log(user);
      // });
      console.log('Results ', this.autocompleteItems);
    }
  }

  clearAutocomplete() {
    this.autocompleteItems = [];
    this.inputSearch = '';
  }

  async confirmFriendInvitation(contact: AppDeviceContact) {
    if (contact.is_my_friend) {
      this.utils.showToastError('Vous êtes déjà ami avec ' + contact.display);
      return;
    }
    if (contact.is_member) {
      contact.is_my_friend = true;
      this.friendsSvc.inviteFromDeviceContact(contact, true);
    } else {
      this.shareApp();
      // this.utils.showToastSuccess(
      //   "Non membre. Inviter à installer l'application"
      // );
    }
  }

  async shareApp() {
    await Share.share({
      text: "Rejoins moi sur dyspo! Installe l'application dyspo!, crée un compte et n'oublie pas de me demander en ami.",

      url: environment.stores_url,
    });
  }

  async buildData(groups: { letter: string; contacts: AppDeviceContact[] }[]) {
    const ITEMS_RENDERED_AT_ONCE = 2;
    const INTERVAL_IN_MS = 100;
    let currentIndex = 0;
    const length = groups.length;

    const interval = setInterval(() => {
      console.log('-------Create Next fragment . Index ' + currentIndex);
      const nextIndex = currentIndex + ITEMS_RENDERED_AT_ONCE;

      for (let n = currentIndex; n <= nextIndex; n++) {
        if (n >= length) {
          clearInterval(interval);
          break;
        }
        const appContactGrouped = groups[n];
        if (appContactGrouped) {
          console.log(appContactGrouped);
          this.container.createEmbeddedView(this.templateGroup, {
            $implicit: appContactGrouped,
          });
        }
      }

      currentIndex += ITEMS_RENDERED_AT_ONCE + 1;
      console.log('-------Fragment created . Next Index ' + currentIndex);
    }, INTERVAL_IN_MS);
  }
}
