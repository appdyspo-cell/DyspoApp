import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { UtilsService } from './utils.service';

import { AppUser, Chatroom, DBUser } from '../models/models';
import {
  Database,
  child,
  get,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  ref,
} from '@angular/fire/database';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
//import { Firestore, doc, getDoc } from '@firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  public chatrooms: Chatroom[] = [];

  public chatroomsSubject = new BehaviorSubject<any[]>([]);
  chatrooms$: Observable<Chatroom[]>;

  constructor(
    public utils: UtilsService,
    private firestore: Firestore,
    private db: Database
  ) {
    //this.eventService.observeBlockChatroom().subscribe( data => {
    //this.blockChatroom(data.friendUid);
    //});
    this.chatrooms$ = this.chatroomsSubject.asObservable();
  }

  /**************************************************
   ******************  Chatrooms ********************
   ***************************************************/

  getUnreadMessagesCount() {}

  createChatroom() {}

  async initService(idUser: string) {
    this.chatrooms = [];
    // on recupere les chatrooms du user
    console.log('chatroomService => initService');

    const chat_user = (
      await get(child(ref(this.db), 'chat_users/' + idUser))
    ).val() as DBUser;

    chat_user?.chatIds?.forEach(async (chatroomKey) => {
      // Get Chatroom
      const chatroom = (
        await get(child(ref(this.db), 'chats/' + chatroomKey))
      ).val() as Chatroom;
      this.chatrooms.push(chatroom);
      this.chatroomsSubject.next(this.chatrooms);

      // Listeners
      onChildChanged(ref(this.db, 'chats/' + chatroomKey), (snapshot) => {
        const chatroom = snapshot.val() as Chatroom;
        const foundIndex = this.chatrooms.findIndex(
          (chat) => chat.chatroomKey === chatroomKey
        );
        if (foundIndex >= 0) {
          this.chatrooms[foundIndex] = chatroom;
        } else {
          this.chatrooms.push(chatroom);
        }
        this.chatroomsSubject.next(this.chatrooms);
      });

      onChildAdded(ref(this.db, 'chats/' + chatroomKey), (snapshot) => {
        const chatroom = snapshot.val() as Chatroom;
        this.chatrooms.push(chatroom);
        this.chatroomsSubject.next(this.chatrooms);
      });

      onChildRemoved(ref(this.db, 'chats/' + chatroomKey), (snapshot) => {
        const chatroom = snapshot.val() as Chatroom;
        const foundIndex = this.chatrooms.findIndex(
          (ch) => ch.chatroomKey === snapshot.key
        );
        if (foundIndex >= 0) {
          this.chatrooms.splice(foundIndex, 1);
          this.chatroomsSubject.next(this.chatrooms);
        }
      });
    });

    // -------------------------------
  }

  deleteChatroom(chatroom: Chatroom) {
    const chatroomRef = ref(this.db, 'chats/' + chatroom.chatroomKey);

    //On cache uniquement le salon de celui qui veut supprimer le chatroom
    // this.afDB
    //   .object(
    //     'users_chatrooms/' +
    //       this.userSvc.userInfo!.uid +
    //       '/' +
    //       chatroom.chatroomKey
    //   )
    //   .update({
    //     isArchived: true,
    //     description: '',
    //     startMessageId: chatroom.nextMessageId,
    //   });
    //On le laisse visible le chatroom chez l'ami
    //this.afDB.object('users_chatrooms/' + chatroom.friend_uid + '/' + chatroom.chatroomKey).remove();
  }

  public getUserByUID(uid: string): Promise<AppUser> {
    return new Promise(async (resolve, reject) => {
      const docRef = doc(this.firestore, `users`, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('Document data:', docSnap.data());
        const userData = docSnap.data() as AppUser;
        userData.uid = docSnap.id;

        resolve(userData);
      } else {
        reject('USER_NOT_FOUND');
      }
    });
  }

  unsubscribeAllAfterLogoutEvent() {
    this.chatrooms = [];
    //off(ref(this.db, 'chats/' + chatroomKey))
  }
}
