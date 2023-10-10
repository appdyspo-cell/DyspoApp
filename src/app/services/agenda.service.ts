import { Injectable } from '@angular/core';
import { AgendaDyspo, AgendaEvent, AgendaEventStatus } from '../models/models';
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
  public agendaDyspos: AgendaDyspo[] = [];
  public agendaDysposSubject = new BehaviorSubject<AgendaDyspo[]>([]);

  public agendaEvents$!: Observable<AgendaEvent[]>;
  public agendaDyspos$!: Observable<AgendaDyspo[]>;

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

    onSnapshot(agendaEventsCollectionRef, (snapshot) => {
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

    //Dyspos
    onSnapshot(agendaEventsCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const agendaDyspoModified = change.doc.data() as AgendaDyspo;

          const foundIndex = this.agendaDyspos.findIndex(
            (elt) => elt.uid === agendaDyspoModified.uid
          );
          if (foundIndex >= 0) {
            this.agendaDyspos[foundIndex] = agendaDyspoModified;
            this.agendaDysposSubject.next(this.agendaDyspos);
          }
        }
        if (change.type === 'added') {
          const agendaDyspoAdded = change.doc.data() as AgendaDyspo;
          agendaDyspoAdded.uid = change.doc.id;
          const foundIndex = this.agendaDyspos.findIndex(
            (elt) => elt.uid === agendaDyspoAdded.uid
          );
          if (foundIndex >= 0) {
            //Do nothing
          } else {
            const agendaDyspo = change.doc.data() as AgendaDyspo;
            agendaDyspo.uid = change.doc.id;

            this.agendaDyspos.push(agendaDyspo);
            this.agendaDysposSubject.next(this.agendaDyspos);
            // this.getagendaDyspoAndPush(agendaDyspo)
            //   .then((resPromise: any) => {
            //     console.log('agendaDyspo Hydrated ', resPromise);
            //     that.agendaDysposSubject.next(that.agendaDyspos);
            //   })
            //   .catch((err: any) => {
            //     console.log(err);
            //   });
          }
        }
        if (change.type === 'removed') {
          const agendaDyspoRemoved = change.doc.data() as AgendaDyspo;
          agendaDyspoRemoved.uid = change.doc.id;
          const foundIndex = this.agendaDyspos.findIndex(
            (elt) => elt.uid === agendaDyspoRemoved.uid
          );
          if (foundIndex >= 0) {
            this.agendaDyspos.splice(foundIndex, 1);
          }
          this.agendaDysposSubject.next(this.agendaDyspos);
        }
      });
    });
  }

  async addEvent(agendaEvent: AgendaEvent) {
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

  async addDyspo(agendaDyspo: AgendaDyspo) {
    setDoc(
      doc(
        this.firestore,
        `agenda_dyspos/${this.uid}/dyspo_list/`,
        agendaDyspo.uid!
      ),
      agendaDyspo
    );
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
}
