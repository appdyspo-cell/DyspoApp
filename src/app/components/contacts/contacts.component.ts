import { Component, OnInit } from '@angular/core';
import { ContactPayload, Contacts } from '@capacitor-community/contacts';
import { AppContact } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
})
export class ContactsComponent implements OnInit {
  contacts: ContactPayload[] = [];
  appContacts: AppContact[] = [];
  isLoading: boolean;
  constructor(private userSvc: UserService) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.isLoading = true;
    this.printContactsData();
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
      let appContact: AppContact = {
        phone_number: '',
        is_member: false,
        display: '',
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
          const isMember = await this.userSvc.getUserInfosByPhone('0' + number);

          if (isMember) {
            console.log('is Memeber ?', isMember);
            appContact.is_member = true;
          }
        } else {
        }
      }
    }

    this.isLoading = false;
  };

  confirmFriendInvitation(
    contact: AppContact,
    _t17: number,
    $event: MouseEvent
  ) {
    throw new Error('Method not implemented.');
  }
  showProfile(arg0: any, $event: MouseEvent) {
    throw new Error('Method not implemented.');
  }

  groupContactsByAlphabet(contacts: AppContact[]) {
    return contacts.reduce((groups: any, contact) => {
      const letter = contact.display.charAt(0).toUpperCase();
      groups[letter] = groups[letter] || [];
      groups[letter].push(contact);
      return groups;
    }, {});
  }
}
