import { Injectable } from '@angular/core';
import {
  AgendaDyspoItem,
  AgendaEvent,
  AgendaEventRecurrence,
  AgendaEventStatus,
  AgendaEventType,
  AppUser,
  Chatroom,
  CrudFBAction,
  FriendDyspo,
  UserAgendaEventsByDay,
  UserDyspoStatus,
} from '../models/models';
import {
  Firestore,
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
  writeBatch,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  add,
  addMonths,
  formatISO,
  getDate,
  getDayOfYear,
  getHours,
  getMonth,
  getYear,
  isBefore,
  parseISO,
  set,
  setDate,
  setHours,
} from 'date-fns';
import { UtilsService } from './utils.service';
import { cloneDeep } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class AgendaService {
  private uid!: string;
  public agendaEvents: AgendaEvent[] = [];
  public agendaEventInvitations: AgendaEvent[] = [];
  public agendaEventsSubject = new BehaviorSubject<AgendaEvent[]>([]);
  public agendaEventInvitationsSubject = new BehaviorSubject<AgendaEvent[]>([]);
  public agendaDyspos: AgendaDyspoItem[] = [];
  public agendaDysposSubject = new BehaviorSubject<{
    action: 'MODIFIED' | 'ADDED' | 'REMOVED';
    items: AgendaDyspoItem[];
  }>({ action: 'ADDED', items: [] });

  public agendaEvents$!: Observable<AgendaEvent[]>;
  public agendaEventInvitations$!: Observable<AgendaEvent[]>;
  public agendaDyspos$!: Observable<{
    action: 'MODIFIED' | 'ADDED' | 'REMOVED';
    items: AgendaDyspoItem[];
  }>;
  public isModified = false;
  eventsOnSnapshotCancel!: import('@angular/fire/firestore').Unsubscribe;
  eventInvitationsOnSnapshotCancel!: import('@angular/fire/firestore').Unsubscribe;
  dysposOnSpnashotCancel!: import('@angular/fire/firestore').Unsubscribe;

  constructor(private firestore: Firestore, private utils: UtilsService) {
    this.agendaEvents$ = this.agendaEventsSubject.asObservable();
    this.agendaEventInvitations$ =
      this.agendaEventInvitationsSubject.asObservable();
    this.agendaDyspos$ = this.agendaDysposSubject.asObservable();
  }

  initService(uid: string) {
    console.log('Init Agenda Service...');
    this.uid = uid;
    const that = this;
    this.agendaEvents = [];
    this.agendaEventInvitations = [];
    this.agendaDyspos = [];

    const agendaEventsCollectionRef = collection(
      this.firestore,
      `agenda_events/`
    );

    const queryAgendaEvents = query(
      agendaEventsCollectionRef,
      where('members_uid', 'array-contains', uid)
    );
    const queryAgendaEventInvitations = query(
      agendaEventsCollectionRef,
      where('members_invited_uid', 'array-contains', uid)
    );

    const agendaDysposCollectionRef = collection(
      this.firestore,
      `agenda_dyspos/${uid}/dyspo_list`
    );

    this.eventsOnSnapshotCancel = onSnapshot(queryAgendaEvents, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const agendaEventModified = change.doc.data() as AgendaEvent;

          const foundIndex = this.agendaEvents.findIndex(
            (elt) => elt.uid === agendaEventModified.uid
          );
          if (foundIndex >= 0) {
            this.agendaEvents[foundIndex] = agendaEventModified;
            this.agendaEventsSubject.next(this.agendaEvents);
          }
        }
        if (change.type === 'added') {
          const agendaEventAdded = change.doc.data() as AgendaEvent;
          agendaEventAdded.uid = change.doc.id;
          const foundIndex = this.agendaEvents.findIndex(
            (elt) => elt.uid === agendaEventAdded.uid
          );
          if (foundIndex >= 0) {
            //Do nothing
          } else {
            const agendaEvent = change.doc.data() as AgendaEvent;
            agendaEvent.uid = change.doc.id;

            this.agendaEvents.push(agendaEvent);
            this.agendaEventsSubject.next(this.agendaEvents);
            // this.getAgendaEventAndPush(agendaEvent)
            //   .then((resPromise: any) => {
            //     console.log('agendaEvent Hydrated ', resPromise);
            //     that.agendaEventsSubject.next(that.agendaEvents);
            //   })
            //   .catch((err: any) => {
            //     console.log(err);
            //   });
          }
        }
        if (change.type === 'removed') {
          const agendaEventRemoved = change.doc.data() as AgendaEvent;
          agendaEventRemoved.uid = change.doc.id;
          const foundIndex = this.agendaEvents.findIndex(
            (elt) => elt.uid === agendaEventRemoved.uid
          );
          if (foundIndex >= 0) {
            this.agendaEvents.splice(foundIndex, 1);
          }
          this.agendaEventsSubject.next(this.agendaEvents);
        }
      });
    });

    // Invitation evenement
    this.eventInvitationsOnSnapshotCancel = onSnapshot(
      queryAgendaEventInvitations,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const invitFetched = change.doc.data() as AgendaEvent;
          let foundIndex = this.agendaEventInvitations.findIndex((elt) => {
            return elt.uid === invitFetched.uid;
          });
          if (change.type === 'modified' && foundIndex > -1) {
            this.agendaEventInvitations[foundIndex] = invitFetched;
          }
          if (change.type === 'added' && foundIndex < 0) {
            this.agendaEventInvitations.push(invitFetched);
          }
          if (change.type === 'removed') {
            const invitRemoved = change.doc.data() as AgendaEvent;
            invitRemoved.uid = change.doc.id;
            const foundIndex = this.agendaEventInvitations.findIndex(
              (elt) => elt.uid === invitRemoved.uid
            );
            if (foundIndex >= 0) {
              this.agendaEventInvitations.splice(foundIndex, 1);
            }
          }
          this.agendaEventInvitationsSubject.next(this.agendaEventInvitations);
        });
      }
    );

    //Dyspos
    this.dysposOnSpnashotCancel = onSnapshot(
      agendaDysposCollectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const agendaDyspoFetched = change.doc.data() as AgendaDyspoItem;
          let foundItem = this.agendaDyspos.find((elt) => {
            return elt.time === agendaDyspoFetched.time;
          });
          if (change.type === 'modified' && foundItem) {
            foundItem.userDyspo = agendaDyspoFetched.userDyspo;
            this.agendaDysposSubject.next({
              action: 'MODIFIED',
              items: this.agendaDyspos,
            });
          }
          if (change.type === 'added' && !foundItem) {
            this.agendaDyspos.push(agendaDyspoFetched);
            this.agendaDysposSubject.next({
              action: 'ADDED',
              items: this.agendaDyspos,
            });
          }
          if (change.type === 'removed') {
            const foundIndex = this.agendaDyspos.findIndex(
              (elt) => elt.time === agendaDyspoFetched.time
            );
            if (foundIndex >= 0) {
              this.agendaDyspos.splice(foundIndex, 1);
            }
            this.agendaDysposSubject.next({
              action: 'REMOVED',
              items: this.agendaDyspos,
            });
          }
        });
      }
    );
  }

  async saveOrUpdateEvent(agendaEvent: AgendaEvent, saveRecurrences = false) {
    //Evt RECURRENT
    if (
      saveRecurrences &&
      agendaEvent.recurrence !== AgendaEventRecurrence.ONE
    ) {
      const batch = writeBatch(this.firestore);
      let docRef = doc(this.firestore, `agenda_events/`, agendaEvent.uid!);

      // Add original event
      batch.set(docRef, agendaEvent);

      let addPeriod;

      if (agendaEvent.recurrence === AgendaEventRecurrence.DAILY) {
        addPeriod = 1;
      } else {
        addPeriod = 7;
      }

      let nextCloneDateStart = add(parseISO(agendaEvent.startISO), {
        days: addPeriod,
      });
      let nextCloneDateEnd = add(parseISO(agendaEvent.endISO), {
        days: addPeriod,
      });

      let cloneIsBeforeRecEndDate = isBefore(
        nextCloneDateStart,
        parseISO(agendaEvent.recurrence_end_ISO!)
      );

      while (cloneIsBeforeRecEndDate) {
        const agendaClone = cloneDeep(agendaEvent);
        agendaClone.uid = 'agev_rec_' + new Date().getTime();
        docRef = doc(this.firestore, `agenda_events/`, agendaClone.uid!);
        agendaClone.parent_agenda_event_uid = agendaEvent.uid;

        agendaClone.startISO = formatISO(nextCloneDateStart);
        agendaClone.endISO = formatISO(nextCloneDateEnd);

        agendaClone.start_date_day_of_year = getDayOfYear(nextCloneDateStart);
        agendaClone.start_date_year = getYear(nextCloneDateStart);
        agendaClone.end_date_day_of_year = getDayOfYear(nextCloneDateEnd);
        agendaClone.end_date_year = getYear(nextCloneDateEnd);

        const refStart = set(nextCloneDateStart, {
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        const refEnd = set(nextCloneDateEnd, {
          hours: 23,
          minutes: 59,
          seconds: 59,
          milliseconds: 999,
        });

        console.log(refStart, refEnd);
        agendaClone.start_date_ts = refStart.getTime();
        agendaClone.end_date_ts = refEnd.getTime();

        // agendaClone.day = getDate(nextCloneDateStart);
        // agendaClone.month = getMonth(nextCloneDateStart);
        // agendaClone.year = getYear(nextCloneDateStart);

        // agendaClone.date_index = [
        //   agendaClone.day.toString() +
        //     '_' +
        //     agendaClone.month.toString() +
        //     '_' +
        //     agendaClone.year.toString(),
        // ];

        // Hydrate agendaEvent
        agendaClone.start_date_formatted = this.utils.formatISODate(
          agendaClone.startISO
        );
        agendaClone.end_date_formatted = this.utils.formatISODate(
          agendaClone.endISO
        );
        agendaClone.start_time_formatted = this.utils.formatTime(
          agendaClone.startISO
        );
        agendaClone.end_time_formatted = this.utils.formatTime(
          agendaClone.endISO
        );
        console.log('Save rec event ', agendaClone);
        batch.set(docRef, agendaClone);

        nextCloneDateStart = add(parseISO(agendaClone.startISO), {
          days: addPeriod,
        });
        nextCloneDateEnd = add(parseISO(agendaClone.endISO), {
          days: addPeriod,
        });
        cloneIsBeforeRecEndDate = isBefore(
          nextCloneDateStart,
          parseISO(agendaEvent.recurrence_end_ISO!)
        );
      }

      await batch.commit();
    }
    //NON RECURRENT
    else {
      setDoc(
        doc(this.firestore, `agenda_events/`, agendaEvent.uid!),
        agendaEvent
      )
        .then(() => {
          //this.utils.showToastSuccess("L'événement a été sauvegardé");
          return true;
        })
        .catch((err) => {
          //this.utils.showToastError("Une erreur s'est produite");
          return false;
        });
    }
  }

  async removeEvent(agendaEvent: AgendaEvent) {
    deleteDoc(doc(this.firestore, `agenda_events/`, agendaEvent.uid!));
  }

  public getAgendaEvents() {
    return new Promise<AgendaEvent[]>(async (resolve, reject) => {
      const agendaEvents: AgendaEvent[] = [];
      const usersCollectionRef = collection(this.firestore, 'users');

      const querySnapshot = await getDocs(usersCollectionRef);
      querySnapshot.forEach((snap) => {
        const agendaEvt = snap.data() as AgendaEvent;

        if (agendaEvt.status === AgendaEventStatus.ACTIVE) {
          agendaEvt.uid = snap.id;
          this.agendaEvents.push(agendaEvt);
        }
      });
      resolve(agendaEvents);
    });
  }

  public saveDyspos(agendaDyspos: AgendaDyspoItem[]) {
    agendaDyspos.forEach((item) => {
      //console.log(item);
      setDoc(
        doc(
          this.firestore,
          `agenda_dyspos/${this.uid}/dyspo_list/`,
          item.year + '_' + item.month + '_' + item.day
        ),
        item
      );
    });
  }

  public updateOrCreateDyspo(agendaDyspo: AgendaDyspoItem) {
    const agendaDyspoClone: any = { ...agendaDyspo };
    const ref = doc(
      this.firestore,
      `agenda_dyspos/${this.uid}/dyspo_list`,
      agendaDyspo.year + '_' + agendaDyspo.month + '_' + agendaDyspo.day
    );
    setDoc(ref, agendaDyspoClone);
  }

  public acceptEventInvitation(invitation: AgendaEvent) {
    const foundIndex = invitation.members_invited_uid.findIndex(
      (uid) => uid === this.uid
    );
    if (foundIndex >= 0) {
      invitation.members_invited_uid.splice(foundIndex, 1);
      invitation.members_uid.push(this.uid);
      //Add chatroom info for me
      const userChatroom: Chatroom = {
        count: 0,
        lastMessageRead: '',
        startMessageId: 0,
        nextMessageId: 0,
        isNotifications: true,
      };
      invitation!['user_' + this.uid] = userChatroom;

      this.saveOrUpdateEvent(invitation);
    } else {
      console.error('Can not find invitation uid in members invited');
    }
  }

  public declineEventInvitation(invitation: AgendaEvent) {
    const foundIndex = invitation.members_invited_uid.findIndex(
      (uid) => uid === this.uid
    );
    if (foundIndex >= 0) {
      invitation.members_invited_uid.splice(foundIndex, 1);
      this.saveOrUpdateEvent(invitation);
    } else {
      console.error('Can not find invitation uid in members invited');
    }
  }

  public async quitEvent(agendaEvent: AgendaEvent, newAdminUid?: string) {
    return new Promise(async (resolve, reject) => {
      // Evt solo
      const isSoloEvent =
        agendaEvent.admin_uid === this.uid &&
        agendaEvent.members_uid.length === 1 &&
        agendaEvent.members_uid[0] === this.uid;

      if (isSoloEvent) {
        console.log('Remove solo event ', agendaEvent);
        this.removeEvent(agendaEvent);
        resolve(true);
      }
      // Evt multi
      else {
        console.log('Quit Event myId => ', this.uid);
        console.log('Event before I quit ', agendaEvent);
        const foundIndex = agendaEvent.members_uid.findIndex(
          (uid) => uid === this.uid
        );
        if (foundIndex >= 0) {
          const updatedAgendaEvent = cloneDeep(agendaEvent);
          // Remove me from chatroom

          const chatroom = agendaEvent!['user_' + this.uid] as Chatroom;
          chatroom.quit_chatroom_at = new Date().getTime();

          //Remove me from list
          updatedAgendaEvent.members_uid.splice(foundIndex, 1);

          // Change admin
          if (newAdminUid) {
            // Check in BD before setting new Admin (He should had left the event)
            const docSnap = await getDoc(
              doc(this.firestore, `agenda_events/`, agendaEvent.uid!)
            );
            if (docSnap.exists()) {
              const eventFetched = docSnap.data() as AgendaEvent;
              if (eventFetched.members_uid.includes(newAdminUid)) {
                updatedAgendaEvent.admin_uid = newAdminUid;
                console.log('Set new admin before quit ', newAdminUid);
              }
              // Error, can not update => Future New admin has quit the event !!
              else {
                reject('Future new admin has left the event');
              }
            } else {
              reject('Can not find agenda event');
            }
          }
          console.log('Quit event ', updatedAgendaEvent);
          await this.saveOrUpdateEvent(updatedAgendaEvent);
          resolve(true);
        } else {
          reject('Can not find uid in agenda event members');
          console.error('Can not find uid in agenda event members');
        }
      }
    });
  }

  async getDyspos(
    uids: string[],
    agendaEvent: AgendaEvent
  ): Promise<FriendDyspo[]> {
    const dateToCheck = new Date(agendaEvent.startISO);
    const agenda_dyspo_uid =
      getYear(dateToCheck) +
      '_' +
      getMonth(dateToCheck) +
      '_' +
      getDate(dateToCheck);
    const dyspos: FriendDyspo[] = [];
    for (let uid of uids) {
      const docRef = doc(
        this.firestore,
        `agenda_dyspos/${uid}/dyspo_list`,
        agenda_dyspo_uid
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        //console.log('Document data:', docSnap.data());
        const agendaDyspo = docSnap.data() as AgendaDyspoItem;
        dyspos.push({
          friend_dyspo: agendaDyspo.userDyspo,
          friend_uid: uid,
          dyspo_date_ISO: agendaEvent.startISO,
        });
      } else {
        dyspos.push({
          friend_dyspo: UserDyspoStatus.UNDEFINED,
          friend_uid: uid,
          dyspo_date_ISO: agendaEvent.startISO,
        });
      }
    }
    return dyspos;
  }

  async getUserAgendaEvents(
    uid: string,
    agendaEventToCompare: AgendaEvent
  ): Promise<UserAgendaEventsByDay> {
    console.log('Get user events ', uid);
    const agendaEventsCollectionRef = collection(
      this.firestore,
      `agenda_events/`
    );

    console.log('Get user events ', uid);
    console.log('startDateRef', formatISO(agendaEventToCompare.start_date_ts));
    console.log('endDateRef', formatISO(agendaEventToCompare.end_date_ts));
    const queryAgendaEvents = query(
      agendaEventsCollectionRef,
      where('members_uid', 'array-contains', uid),
      where('start_date_ts', '>=', agendaEventToCompare.start_date_ts)
    );

    const querySnapshots = await getDocs(queryAgendaEvents);

    const events: AgendaEvent[] = [];
    querySnapshots.forEach((snapshot) => {
      const eventResult = snapshot.data() as AgendaEvent;

      if (eventResult.uid !== agendaEventToCompare.uid) {
        if (eventResult.end_date_ts <= agendaEventToCompare.end_date_ts) {
          events.push(eventResult);
        }
      }
    });

    const result: UserAgendaEventsByDay = {
      uid,
      agendaEvents: events,
      // day: agendaEventToCompare.day,
      // month: agendaEventToCompare.month,
      // year: agendaEventToCompare.year,
    };

    // console.log(
    //   'Get ' +
    //     events.length +
    //     'user events for uid ' +
    //     uid +
    //     '=>' +
    //     result.day +
    //     '_' +
    //     result.month +
    //     '_' +
    //     result.year,
    //   result
    // );
    return result;
  }

  async getUserAgendaEventsAndDyspos(
    uid: string,
    checkUserShare: boolean
  ): Promise<{
    agendaEvents: AgendaEvent[];
    dyspos: AgendaDyspoItem[];
    allowShare: boolean;
  }> {
    let allowShare = true;
    if (checkUserShare) {
      const docRef = doc(this.firestore, `users`, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const result = docSnap.data() as AppUser;
        allowShare = result.appSettings?.shareAgenda!;
        if (!allowShare) {
          return {
            agendaEvents: [],
            dyspos: [],
            allowShare: false,
          };
        }
      }
    }
    const agendaEventsCollectionRef = collection(
      this.firestore,
      `agenda_events/`
    );

    const queryAgendaEvents = query(
      agendaEventsCollectionRef,
      where('members_uid', 'array-contains', uid)
    );

    const agendaDysposCollectionRef = collection(
      this.firestore,
      `agenda_dyspos/${uid}/dyspo_list`
    );

    const querySnapshotsEvents = await getDocs(queryAgendaEvents);
    const querySnapshotsDyspos = await getDocs(agendaDysposCollectionRef);

    const events: AgendaEvent[] = [];
    const dyspos: AgendaDyspoItem[] = [];

    querySnapshotsEvents.forEach((snapshot) => {
      events.push(snapshot.data() as AgendaEvent);
    });

    querySnapshotsDyspos.forEach((snapshot) => {
      dyspos.push(snapshot.data() as AgendaDyspoItem);
    });

    return {
      agendaEvents: events,
      dyspos,
      allowShare,
    };
  }

  unsubscribeAllAfterLogoutEvent() {
    if (this.dysposOnSpnashotCancel) this.dysposOnSpnashotCancel();
    if (this.eventsOnSnapshotCancel) this.eventsOnSnapshotCancel();
    this.agendaEvents = [];
    this.agendaDyspos = [];
    this.agendaEventInvitations = [];
    this.agendaEventInvitationsSubject.next(this.agendaEventInvitations);
    this.agendaEventsSubject.next(this.agendaEvents);
    this.agendaDysposSubject.next({
      action: 'REMOVED',
      items: this.agendaDyspos,
    });
  }
}
