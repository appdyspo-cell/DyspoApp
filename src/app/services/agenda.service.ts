import { Injectable } from '@angular/core';
import {
  AgendaDyspoItem,
  AgendaEvent,
  AgendaEventStatus,
  CrudFBAction,
} from '../models/models';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgendaService {
  private uid!: string;
  public agendaEvents: AgendaEvent[] = [];
  public agendaEventsSubject = new BehaviorSubject<AgendaEvent[]>([]);
  public agendaDyspos: AgendaDyspoItem[] = [];
  public agendaDysposSubject = new BehaviorSubject<{
    action: 'MODIFIED' | 'ADDED' | 'REMOVED';
    items: AgendaDyspoItem[];
  }>({ action: 'ADDED', items: [] });

  public agendaEvents$!: Observable<AgendaEvent[]>;
  public agendaDyspos$!: Observable<{
    action: 'MODIFIED' | 'ADDED' | 'REMOVED';
    items: AgendaDyspoItem[];
  }>;
  public isModified = false;
  eventsOnSnapshotCancel!: import('@angular/fire/firestore').Unsubscribe;
  dysposOnSpnashotCancel!: import('@angular/fire/firestore').Unsubscribe;

  constructor(private firestore: Firestore) {
    this.agendaEvents$ = this.agendaEventsSubject.asObservable();
    this.agendaDyspos$ = this.agendaDysposSubject.asObservable();
  }

  initService(uid: string) {
    console.log('Init Agenda Service...');
    this.uid = uid;
    const that = this;
    this.agendaEvents = [];
    this.agendaDyspos = [];
    const agendaEventsCollectionRef = collection(
      this.firestore,
      `agenda_events/${uid}/event_list`
    );

    const agendaDysposCollectionRef = collection(
      this.firestore,
      `agenda_dyspos/${uid}/dyspo_list`
    );

    this.eventsOnSnapshotCancel = onSnapshot(
      agendaEventsCollectionRef,
      (snapshot) => {
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
      }
    );

    //Dyspos
    this.dysposOnSpnashotCancel = onSnapshot(
      agendaDysposCollectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log('Dyspo changed');
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

  async saveOrUpdateEvent(agendaEvent: AgendaEvent) {
    setDoc(
      doc(
        this.firestore,
        `agenda_events/${this.uid}/event_list/`,
        agendaEvent.uid!
      ),
      agendaEvent
    );

    // Send notif ?
    // this.notification-service.sendConfirmFriend()
  }

  async removeEvent(agendaEvent: AgendaEvent) {
    setDoc(
      doc(
        this.firestore,
        `agenda_events/${this.uid}/event_list`,
        agendaEvent.uid!
      ),
      agendaEvent
    );
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
      console.log(item);
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

  unsubscribeAllAfterLogoutEvent() {
    if (this.dysposOnSpnashotCancel) this.dysposOnSpnashotCancel();
    if (this.eventsOnSnapshotCancel) this.eventsOnSnapshotCancel();
    this.agendaEvents = [];
    this.agendaDyspos = [];
    this.agendaEventsSubject.next(this.agendaEvents);
    this.agendaDysposSubject.next({
      action: 'REMOVED',
      items: this.agendaDyspos,
    });
  }
}
