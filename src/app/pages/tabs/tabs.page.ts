import { Component, OnDestroy, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AgendaEvent, Chatroom } from 'src/app/models/models';
import { AgendaService } from 'src/app/services/agenda.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    standalone: false
})
export class TabsPage implements OnInit, OnDestroy {
  isIos: boolean;
  unreadMessagesCount = 0;
  private agendaSub!: Subscription;
  private myUid: string | undefined;
  private previousCounts: Record<string, number> = {};

  constructor(
    public platform: Platform, 
    private utils: UtilsService,
    private agendaSvc: AgendaService,
    private userSvc: UserService
  ) {
    this.isIos = this.platform.is('ios');
    console.log('platform ios ?', this.isIos);
  }

  async ngOnInit() {
    try {
      await LocalNotifications.requestPermissions();
    } catch(e) {}
    
    // Wait for user to be available
    this.userSvc.appUserInfoObs$.subscribe(user => {
      if (user && user.uid) {
        this.myUid = user.uid;
        this.listenToAgendaEvents();
      }
    });
  }

  listenToAgendaEvents() {
    if (this.agendaSub) return;
    
    this.agendaSub = this.agendaSvc.agendaEvents$.subscribe((events: AgendaEvent[]) => {
      let newTotalCount = 0;
      
      events.forEach(event => {
        const chatroom = event['user_' + this.myUid!] as Chatroom;
        if (chatroom) {
          const currentCount = chatroom.count || 0;
          newTotalCount += currentCount;
          
          const prevCount = this.previousCounts[event.uid!] || 0;
          
          if (currentCount > prevCount && event.last_message) {
             if (event.last_message.sender !== this.myUid) {
               this.triggerNotification(event.title || 'Dyspo', event.last_message.message || 'Nouveau message reçu');
             }
          }
          this.previousCounts[event.uid!] = currentCount;
        }
      });
      
      this.unreadMessagesCount = newTotalCount;
    });
  }

  async triggerNotification(title: string, body: string) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
          }
        ]
      });
    } catch(e) {}
  }

  ngOnDestroy() {
    if (this.agendaSub) this.agendaSub.unsubscribe();
  }
}
