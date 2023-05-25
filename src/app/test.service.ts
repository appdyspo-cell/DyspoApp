import { Injectable } from '@angular/core';
import { Database } from '@angular/fire/database';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  constructor(private dtb: Database) {}

  initService(uid: string) {
    console.log('init Test');
  }
}
