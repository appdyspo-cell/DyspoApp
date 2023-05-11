import { Injectable } from '@angular/core';
import { AppUser } from '../models/models';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _userInfo: AppUser | undefined;
  constructor(private firestore: Firestore) {}

  get userInfo(): AppUser | undefined {
    return this._userInfo;
  }
  set userInfo(val: AppUser | undefined) {
    this._userInfo = val;
  }

  async updateUser(userid: string, appUser: AppUser) {
    console.log('Update User');
    const appUserClone: any = { ...appUser };
    delete appUserClone.id;
    const ref = doc(this.firestore, `users/${userid}`);
    updateDoc(ref, appUserClone);
  }
}
