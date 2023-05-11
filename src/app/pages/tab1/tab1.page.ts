import { Component } from '@angular/core';
import { Contacts } from '@capacitor-community/contacts';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
  constructor() {
    this.fetchContacts();
  }

  async fetchContacts() {
    const result = await Contacts.getContacts({
      projection: {
        // Specify which fields should be retrieved.
        name: true,
        phones: true,
        postalAddresses: true,
      },
    });

    console.log(result.contacts);

    for (const contact of result.contacts) {
      const number = contact.phones?.[0]?.number;

      const street = contact.postalAddresses?.[0]?.street;

      console.log(number, street);
    }
  }
}
