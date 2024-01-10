import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ContactPayload, Contacts } from '@capacitor-community/contacts';
import { IonItemGroup } from '@ionic/angular';
import { AppDeviceContact, Friend } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
})
export class ContactsComponent implements OnInit {
  @ViewChildren(IonItemGroup, { read: ElementRef }) itemGroups!: QueryList<any>;
  contacts: ContactPayload[] = [];
  appContacts: AppDeviceContact[] = [];
  appContactsGrouped: { letter: string; contacts: AppDeviceContact[] }[] = [];
  scroll = false;
  isLoading: boolean;
  constructor(private userSvc: UserService) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.isLoading = true;
    this.printContactsData();
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

  printContactsData = async () => {
    const result = await Contacts.getContacts({
      projection: {
        // Specify which fields should be retrieved.
        name: true,
        phones: true,
        postalAddresses: true,
      },
    });

    for (const contact of result.contacts) {
      let appContact: AppDeviceContact = {
        phone_number: '',
        is_member: false,
        display: '',
        uid: undefined,
        is_my_friend: undefined,
        initials: undefined,
        avatar: undefined,
      };
      if (contact.name?.display) {
        appContact.display = contact.name?.display;
      }
      this.appContacts.push(appContact);
      let number = contact.phones?.[0]?.number;
      if (number) {
        if (number.trim().length >= 9) {
          number = number.trim().slice(-9);
          appContact.phone_number = number;
          //const isMember = await this.userSvc.getUserInfosByPhone('0' + number);
          const isMember = false;
          if (isMember) {
            console.log('is Memeber ?', isMember);
            appContact.is_member = true;
          }
        } else {
        }
      }
    }
    this.appContactsGrouped = this.groupContactsByAlphabet(this.appContacts);
    console.log(this.appContactsGrouped);
    this.isLoading = false;
  };

  confirmFriendInvitation(
    contact: AppDeviceContact,
    _t17: number,
    $event: MouseEvent
  ) {
    throw new Error('Method not implemented.');
  }
  showProfile(arg0: any, $event: MouseEvent) {
    throw new Error('Method not implemented.');
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
        contacts: groups[letter],
      }));
  }
}
