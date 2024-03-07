import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ContactPayload, Contacts } from '@capacitor-community/contacts';
import { Share } from '@capacitor/share';
import { IonItemGroup } from '@ionic/angular';
import { AppDeviceContact } from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { LoggerService } from 'src/app/services/logger.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-device-contacts',
  templateUrl: './device-contacts.page.html',
  styleUrls: ['./device-contacts.page.scss'],
})
export class DeviceContactsPage implements OnInit {
  @ViewChildren(IonItemGroup, { read: ElementRef }) itemGroups!: QueryList<any>;
  colors = [
    '#a2b9bc',
    '#6b5b95',
    '#feb236',
    '#d64161',
    '#ff7b25',
    '#b2ad7f',
    '#878f99',
  ];
  contacts: ContactPayload[] = [];
  appContacts: AppDeviceContact[] = [];
  appContactsGrouped: { letter: string; contacts: AppDeviceContact[] }[] = [];
  scroll = false;
  isLoading = false;
  inputSearch = '';
  autocompleteItems: AppDeviceContact[] = [];
  constructor(
    private userSvc: UserService,
    private utils: UtilsService,
    private friendsSvc: FriendsService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    try {
      this.fetchContactsData();
    } catch (err: any) {
      this.utils.showToastError(err.message);
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

  fetchContactsData = async () => {
    const result = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
      },
    });

    const debug_data = [];
    for (const contact of result.contacts) {
      debug_data.push(JSON.stringify(contact));
    }
    // this.logger.sendDebugData({
    //   msg: 'Contacts for ' + this.userSvc.userInfo?.uid,
    //   data: { contacts: debug_data },
    //   dataString: JSON.stringify(debug_data),
    //   user_id: this.userSvc.userInfo?.uid,
    // });

    // const res = (await this.userSvc.getMartinContacts()) as any;
    // const martinContacts = [];

    // for (let contact of res.data.contacts) {
    //   contact = JSON.parse(contact);
    //   martinContacts.push(contact);
    // }

    // console.log(martinContacts);

    for (const contact of result.contacts) {
      //for (const contact of martinContacts) {
      try {
        if (!contact.name?.display?.startsWith('.')) {
          let canAdd = false;
          let appContact: AppDeviceContact = {
            uid: undefined,
            phone_number: '',
            is_member: undefined,
            is_my_friend: undefined,
            display: 'unknown',
            initials: '',
            avatar: undefined,
            contactId: contact.contactId,
          };

          if (contact.name?.display) {
            if (contact.name.display.length === 0) {
              canAdd = false;
            } else if (contact.name.display.length === 1) {
              canAdd = true;
              appContact.display = contact.name?.display;
              appContact.initials = contact.name.display.toUpperCase();
            } else if (contact.name.display.length > 1) {
              canAdd = true;
              appContact.display = contact.name.display;
              appContact.initials =
                contact.name?.display[0]?.toUpperCase() +
                contact.name?.display[1]?.toUpperCase();
            }
          } else {
            canAdd = false;
          }

          // Old version
          // if (contact.name?.display && contact.name?.display.length >= 1) {
          //   appContact.display = contact.name?.display;
          //   if (contact.name?.display.length === 1) {
          //     appContact.initials = contact.name?.display[0].toUpperCase();
          //   } else {
          //     appContact.initials =
          //       contact.name?.display[0].toUpperCase() +
          //       contact.name?.display[1].toUpperCase();
          //   }
          // }

          // if (
          //   contact.name?.family &&
          //   contact.name.given &&
          //   contact.name.given.length > 0 &&
          //   contact.name.family.length > 0
          // ) {
          //   appContact.initials =
          //     contact.name?.given[0].toUpperCase() +
          //     contact.name?.family[0].toUpperCase();
          // }

          let number = contact.phones?.[0]?.number;
          if (number && canAdd) {
            //Initials
            if (
              contact.name?.family &&
              contact.name.given &&
              contact.name.given.length > 0 &&
              contact.name.family.length > 0
            ) {
              appContact.initials =
                contact.name?.given[0].toUpperCase() +
                contact.name?.family[0].toUpperCase();
            }

            let chiffresTrouves = number.match(/[0-9]/g);
            if (chiffresTrouves) {
              number = chiffresTrouves.join('');
              if (number.trim().length >= 9) {
                number = number.trim().slice(-9);
                appContact.phone_number = number;

                this.appContacts.push(appContact);
              }
            }
          }
        } else {
          console.log('Skip contact ', contact);
        }
      } catch (err: any) {
        console.error(err);
        this.logger.sendError(
          err,
          'fetchContactsData',
          this.userSvc.userInfo?.uid!
        );
      }
    }

    this.appContactsGrouped = this.groupContactsByAlphabet(this.appContacts);
    console.log(this.appContactsGrouped);
    //Is my contact a member of Dyspo and a friend ?
    await this.userSvc.hydrateAppContacts(this.appContacts);
    //Is my contact a friend ?
    this.appContacts.forEach((contact) => {
      contact.is_my_friend = this.friendsSvc.isMyFriend(contact.uid!);
    });

    this.isLoading = false;
  };

  async confirmFriendInvitation(
    contact: AppDeviceContact,
    index: number,
    $event: MouseEvent
  ) {
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
      //text: "Rejoins moi sur dyspo! Installe l'application dyspo!, crée un compte et n'oublie pas de me demander en ami." + environment.stores_url,
      url: environment.stores_url,
    });
  }

  groupContactsByAlphabet(contacts: AppDeviceContact[]) {
    const groups: any = {};
    contacts.forEach((contact) => {
      const letter = contact.display.charAt(0).toUpperCase();
      groups[letter] = groups[letter] || [];
      groups[letter].push(contact);
    });
    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        contacts: groups[letter].sort(
          (a: AppDeviceContact, b: AppDeviceContact) =>
            a.display.localeCompare(b.display)
        ),
      }));
  }

  clearAutocomplete() {
    this.autocompleteItems = [];
    this.inputSearch = '';
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
}
