import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UtilsService } from './utils.service';

import {
  AgendaEvent,
  AppUser,
  ChatMessage,
  Chatroom,
  DBUser,
  ReportMsg,
  ReportUser,
} from '../models/models';
import {
  Database,
  child,
  get,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  ref,
} from '@angular/fire/database';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
//import { Firestore, doc, getDoc } from '@firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  public chatrooms: Chatroom[] = [];
  public messages: ChatMessage[] = [];
  chatroomsOnSnapshotCancel!: import('@angular/fire/firestore').Unsubscribe;
  messagesOnSnapshotCancel!: import('@angular/fire/firestore').Unsubscribe;

  public chatroomsSubject = new BehaviorSubject<Chatroom[]>([]);
  public messagesSubject = new Subject<{
    action: 'MODIFIED' | 'ADDED' | 'REMOVED';
    messages: ChatMessage[];
  }>();
  chatrooms$: Observable<Chatroom[]>;
  messages$: Observable<{
    action: 'MODIFIED' | 'ADDED' | 'REMOVED';
    messages: ChatMessage[];
  }>;
  uid!: string;
  chatroomsCollectionRef!: string;

  constructor(
    public utils: UtilsService,
    private firestore: Firestore,
    private db: Database
  ) {
    //this.eventService.observeBlockChatroom().subscribe( data => {
    //this.blockChatroom(data.friendUid);
    //});
    this.chatrooms$ = this.chatroomsSubject.asObservable();
    this.messages$ = this.messagesSubject.asObservable();
  }

  /**************************************************
   ******************  Chatrooms ********************
   ***************************************************/

  async sendMsg(message: ChatMessage, agendaEvent: AgendaEvent) {
    try {
      const agendaDocRef = doc(
        this.firestore,
        `agenda_events`,
        agendaEvent.uid!
      );

      const messageCollectionRef = doc(
        this.firestore,
        `agenda_events/${agendaEvent.uid}/messages_list`,
        message.uid
      );

      await runTransaction(this.firestore, async (transaction) => {
        const agendaDoc = await transaction.get(agendaDocRef);
        if (!agendaDoc.exists()) {
          throw 'Document does not exist!';
        }

        //agenda fetched-> Write values
        const agendaFetched = agendaDoc.data() as AgendaEvent;

        for (let member_uid of agendaFetched.members_uid) {
          if (member_uid !== this.uid) {
            if (agendaFetched['user_' + member_uid]) {
              const chatroom = agendaFetched['user_' + member_uid] as Chatroom;
              const newCount = chatroom.count + 1;

              const updateObject: any = {};
              updateObject['user_' + member_uid + '.count'] = newCount;

              transaction.update(agendaDocRef, updateObject);
            }
          }
        }

        transaction.update(agendaDocRef, { last_message: message });
        transaction.set(messageCollectionRef, message);
      });
      console.log('Transaction successfully committed!');
    } catch (e) {
      console.log('Transaction failed: ', e);
    }
  }

  async markLastMessageRead(agendaEvent: AgendaEvent, message?: ChatMessage) {
    if (this.uid) {
      console.log(
        'Mark last message as read ' + message?.message + ' and reset count'
      );
      const agendaDocRef = doc(
        this.firestore,
        `agenda_events`,
        agendaEvent.uid!
      );

      await runTransaction(this.firestore, async (transaction) => {
        const agendaDoc = await transaction.get(agendaDocRef);
        if (!agendaDoc.exists()) {
          throw 'Document does not exist!';
        }

        //agenda fetched-> Write values
        const agendaFetched = agendaDoc.data() as AgendaEvent;
        const updateObject: any = {};

        if (agendaFetched['user_' + this.uid]) {
          updateObject['user_' + this.uid + '.count'] = 0;
          if (message) {
            updateObject['user_' + this.uid + '.last_message_read_uid'] =
              message.uid;
            updateObject['user_' + this.uid + '.last_message_read_time'] =
              message.time_ms;
          }

          transaction.update(agendaDocRef, updateObject);
        }
        // const lastMessage = agendaFetched.last_message;
        // if (lastMessage) {
        //   lastMessage.read_by.push(this.uid);
        //   updateObject.last_message.read_by = lastMessage.read_by;
        // }

        transaction.update(agendaDocRef, updateObject);
      });
    }
  }

  createUsersChatroom(newInvits: string[], agendaEvent: AgendaEvent) {
    newInvits.forEach((newInvitUid) => {
      //addDoc()
    });
  }

  getUnreadMessagesCount() {}

  createChatroom() {}

  async getMessages(agendaEvent: AgendaEvent): Promise<ChatMessage[]> {
    const messagesCollectionRef = collection(
      this.firestore,
      `agenda_events/${agendaEvent.uid}/messages_list`
    );

    const docs = await getDocs(messagesCollectionRef);
    docs.forEach((doc) => {
      this.messages.push(doc.data() as ChatMessage);
    });
    return this.messages;
  }

  listenMessages(agendaEvent: AgendaEvent) {
    if (this.messagesOnSnapshotCancel) {
      this.messagesOnSnapshotCancel();
    }
    const messagesCollectionRef = collection(
      this.firestore,
      `agenda_events/${agendaEvent.uid}/messages_list`
    );

    this.messagesOnSnapshotCancel = onSnapshot(
      messagesCollectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const msgFetched = change.doc.data() as ChatMessage;
          console.log('msg fetched', msgFetched);
          let foundItem = this.messages.find((elt) => {
            return elt.uid === msgFetched.uid;
          });
          if (change.type === 'modified' && foundItem) {
            foundItem = msgFetched;
            this.messagesSubject.next({
              action: 'MODIFIED',
              messages: this.messages,
            });
          }
          if (change.type === 'added' && !foundItem) {
            this.messages.push(msgFetched);
            console.log('Chat Svc messageSubject ADDED', msgFetched.message);
            this.messagesSubject.next({
              action: 'ADDED',
              messages: this.messages,
            });
          }
          if (change.type === 'removed') {
            const msgRemoved = change.doc.data() as ChatMessage;
            msgRemoved.uid = change.doc.id;
            const foundIndex = this.messages.findIndex(
              (elt) => elt.uid === msgRemoved.uid
            );
            if (foundIndex >= 0) {
              this.messages.splice(foundIndex, 1);
              this.messagesSubject.next({
                action: 'REMOVED',
                messages: this.messages,
              });
            }
          }
        });
      }
    );
  }

  removeListenMessages() {
    this.messages = [];
    if (this.messagesOnSnapshotCancel) {
      this.messagesOnSnapshotCancel();
    }
  }

  async initService(uid: string) {
    this.uid = uid;
    this.chatrooms = [];
    this.chatroomsCollectionRef = `chatrooms/${uid}/chatroom_list`;
    console.log('Init Chat Service...');
    //const usersCollectionRef = collection(this.firestore, 'users');
    const queryChats = collection(this.firestore, this.chatroomsCollectionRef);

    // Invitation evenement
    this.chatroomsOnSnapshotCancel = onSnapshot(queryChats, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const chatroomFetched = change.doc.data() as Chatroom;
        let foundItem = this.chatrooms.find((elt) => {
          return elt.uid === chatroomFetched.uid;
        });
        if (change.type === 'modified' && foundItem) {
          foundItem = chatroomFetched;
        }
        if (change.type === 'added' && !foundItem) {
          this.chatrooms.push(chatroomFetched);
        }
        if (change.type === 'removed') {
          const invitRemoved = change.doc.data() as Chatroom;
          invitRemoved.uid = change.doc.id;
          const foundIndex = this.chatrooms.findIndex(
            (elt) => elt.uid === invitRemoved.uid
          );
          if (foundIndex >= 0) {
            this.chatrooms.splice(foundIndex, 1);
          }
        }
        this.chatroomsSubject.next(this.chatrooms);
      });
    });
  }

  async deleteChatroom(chatroom: Chatroom) {
    await deleteDoc(
      doc(this.firestore, this.chatroomsCollectionRef + chatroom.uid)
    );

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

  async blockUser(uid: string) {
    return true;
    // return new Promise(async (resolve, reject) => {
    //   const user_id = this.utils.userInfo.id;
    //   const my_id = this.utils.userInfo.id;

    //   this.afs
    //     .collection<Friend>(`friends`)
    //     .doc(this.user_id)
    //     .collection('friend_list', (ref) =>
    //       ref.where('friend_id', '==', friend_id)
    //     )
    //     .get()
    //     .subscribe((snaps) => {
    //       const snap = snaps.docs[0];
    //       //On met le status de l'ami à 'BLOCKED' chez nous et 'BEENBLOCKED' chez lui
    //       this.afs
    //         .collection<Friend>(`friends`)
    //         .doc(this.user_id)
    //         .collection('friend_list')
    //         .doc(snap.id)
    //         .update({ status: 'BLOCKED', since: new Date().getTime() })
    //         .then(() => {
    //           console.log('Finish update my friend list');

    //           this.afs
    //             .collection<Friend>(`friends`)
    //             .doc(friend_id)
    //             .collection('friend_list', (ref) =>
    //               ref.where('friend_id', '==', this.user_id)
    //             )
    //             .get()
    //             .subscribe((snapsB) => {
    //               const snapB = snapsB.docs[0];
    //               this.afs
    //                 .collection<Friend>(`friends`)
    //                 .doc(friend_id)
    //                 .collection('friend_list')
    //                 .doc(snapB.id)
    //                 .update({
    //                   status: 'BEENBLOCKED',
    //                   since: new Date().getTime(),
    //                 })
    //                 .then(() => {
    //                   console.log('Finish update his friend list');
    //                   //this.eventService.publishReloadFriends(this.user_id);
    //                 });
    //             });
    //         });
    //     });
    // });
  }

  async reportUser(report_user_id: string, report_text: string) {
    return true;
    // return new Promise(async (resolve, reject) => {
    //   const my_id = this.utils.userInfo.id;
    //   const now = new Date();
    //   const now_ISO = now.toISOString();
    //   const report_data: ReportUser = {
    //     report_date_ms: now.getTime(),
    //     report_date_ISO: now_ISO,
    //     from_user_id: my_id,
    //     report_user_id,
    //     report_text,
    //   };

    //   const report_user_data = await this.getUserByID(report_user_id);

    //   report_data.report_user_data = report_user_data;
    //   report_data.from_user_data = this.utils.userInfo;
    //   this.afs
    //     .collection<ReportUser>(`report_users`)
    //     .add(report_data)
    //     .then((res) => {
    //       this.afs
    //         .collection('mail')
    //         .add({
    //           to: environment.email,
    //           message: {
    //             subject: 'Signalement utilisateur',
    //             html:
    //               this.utils.userInfo.firstname +
    //               ' ' +
    //               this.utils.userInfo.lastname +
    //               ' a signalé un utilisateur :<br><br><b>' +
    //               report_user_data.firstname +
    //               ' ' +
    //               report_user_data.lastname +
    //               ' (id: ' +
    //               report_user_id +
    //               ')</b><br><br>  Message :<br><br>' +
    //               report_text,
    //           },
    //         })
    //         .then(() => {
    //           resolve(true);
    //         })
    //         .catch((error: any) => {
    //           reject(error);
    //         });
    //       resolve(res);
    //     })
    //     .catch((err: any) => {
    //       reject(err);
    //     });
    // });
  }

  async reportMsg(report: ReportMsg) {
    return true;
    // return new Promise(async (resolve, reject) => {
    //   this.afs
    //     .collection<ReportMsg>(`report_msg`)
    //     .add(report)
    //     .then((res) => {
    //       this.afs
    //         .collection('mail')
    //         .add({
    //           to: environment.email,
    //           message: {
    //             subject: 'Signalement message',
    //             html:
    //               'Un message a été signalé. Contenu du message:<br><br>' +
    //               report.report_text,
    //           },
    //         })
    //         .then(() => {
    //           resolve(true);
    //         })
    //         .catch((error) => {
    //           reject(error);
    //         });
    //     });
    // });
  }

  unsubscribeAllAfterLogoutEvent() {
    this.chatrooms = [];
    if (this.chatroomsOnSnapshotCancel) this.chatroomsOnSnapshotCancel();
    this.chatroomsSubject.next([]);
    //off(ref(this.db, 'chats/' + chatroomKey))
  }
}
