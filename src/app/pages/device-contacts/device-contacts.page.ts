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
    this.fetchContactsData();
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
        // Specify which fields should be retrieved.
        name: true,
        phones: true,
        postalAddresses: true,
      },
    });

    for (const contact of result.contacts) {
      try {
        if (!contact.name?.display?.startsWith('.')) {
          let appContact: AppDeviceContact = {
            uid: undefined,
            phone_number: '',
            is_member: undefined,
            is_my_friend: undefined,
            display: 'unknown',
            initials: '',
            avatar: undefined,
          };
          if (contact.name?.display && contact.name?.display.length >= 1) {
            appContact.display = contact.name?.display;
            if (contact.name?.display.length === 1) {
              appContact.initials = contact.name?.display[0].toUpperCase();
            } else {
              appContact.initials =
                contact.name?.display[0].toUpperCase() +
                contact.name?.display[1].toUpperCase();
            }
          }
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

          let number = contact.phones?.[0]?.number;
          if (number) {
            number = number.replace(/\s+/g, '');
            if (number.trim().length >= 9) {
              number = number.trim().slice(-9);
              appContact.phone_number = number;

              this.appContacts.push(appContact);
            }
          }
        }
      } catch (err: any) {
        this.logger.sendLog(err, 'fetchContactsData');
      }
    }

    this.appContactsGrouped = this.groupContactsByAlphabet(this.appContacts);
    console.log(this.appContactsGrouped);
    this.isLoading = false;
    // Is my contact a member of Dyspo and a friend ?
    await this.userSvc.hydrateAppContacts(this.appContacts);
    this.appContacts.forEach((contact) => {
      contact.is_my_friend = this.friendsSvc.isMyFriend(contact.uid!);
    });
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
      text: "Rejoins moi sur dyspo! Installe l'application dyspo!, crée un compte et n'oublie pas de me demander en ami",
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
