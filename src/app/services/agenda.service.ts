import { Injectable } from '@angular/core';
import { AgendaEvent, AgendaEventStatus } from '../models/models';
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

  public agendaEvents$!: Observable<AgendaEvent[]>;

  constructor(private firestore: Firestore) {
    this.agendaEvents$ = this.agendaEventsSubject.asObservable();
  }

  initService(uid: string) {
    console.log('Init Agenda Service...');
    this.uid = uid;
    const that = this;
    this.agendaEvents = [];
    const agendaEventsCollectionRef = collection(
      this.firestore,
      `agenda_events/${uid}/event_list`
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
