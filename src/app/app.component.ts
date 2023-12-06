import { Component } from '@angular/core';
import { Auth, User, authState, user } from '@angular/fire/auth';
import { MenuController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { UserService } from './services/user.service';
import { LoggerService } from './services/logger.service';
import { FriendsService } from './services/friends.service';
import { ChatService } from './services/chat.service';
import { AgendaService } from './services/agenda.service';
import { NotificationService } from './services/notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  //userSubscription: Subscription;
  user$: Observable<User | null>;
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;

  constructor(
    private auth: Auth,
    private translate: TranslateService,
    private navController: NavController,
    private menuCtrl: MenuController,
    private userSvc: UserService,
    private logger: LoggerService,
    private friendsSvc: FriendsService,
    private agendaSvc: AgendaService,
    private chatSvc: ChatService,
    private notificationSvc: NotificationService
  ) {
    //Lang
    this.translate.setDefaultLang('fr');
    this.loadScripts();
    const preferredLang = localStorage.getItem('lang');
    if (!preferredLang) {
      this.translate.use('fr');
    } else {
      this.translate.use(preferredLang);
    }
    this.user$ = user(this.auth);
    this.authState$ = authState(this.auth);

    // this.userSubscription = this.user$.subscribe((aUser: User | null) => {
    //   //handle user state changes here. Note, that user will be null if there is no currently logged in user.
    //   console.log(aUser);
    //   if (aUser) {
    //     this.navController.navigateRoot('/tabs');
    //   }
    // });
    this.authStateSubscription = this.authState$.subscribe(
      (aUser: User | null) => {
        //handle auth state changes here. Note, that user will be null if there is no currently logged in user.

        if (aUser) {
          this.logger.logDebug('authStateSubscription', aUser);
          // Init user svc
          this.userSvc
            .subscribeUserInfo(aUser.uid)
            .then((appUser) => {
              this.initAllServices(appUser.uid!);
              this.logger.logDebug('validateAuthState userInfo ---> ', appUser);
              this.navController.navigateRoot('/tabs');
              //SplashScreen.hide();
            })
            .catch((err) => {
              this.logger.logDebug('ERR validateAuthState ', err);
              this.navController.navigateRoot('/login');
              //SplashScreen.hide();
            });
        } else {
          this.logger.logDebug(
            'authStateSubscription NOUSER -> navigateRoot: Login'
          );
          this.navController.navigateRoot('/login');

          this.menuCtrl.enable(false);
          localStorage.clear();
          this.killAllServices();
          this.userSvc.unsubscribeUserInfo();
        }
      }
    );
  }

  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.authStateSubscription.unsubscribe();
    //this.userSubscription.unsubscribe();
  }

  initAllServices(uid: string) {
    this.friendsSvc.initService(uid);
    this.agendaSvc.initService(uid);
    this.chatSvc.initService(uid);
    this.notificationSvc.initService(uid);
    // this.kdoSvc.initService(uid);
  }

  killAllServices() {
    this.friendsSvc.unsubscribeAllAfterLogoutEvent();
    this.agendaSvc.unsubscribeAllAfterLogoutEvent();
    //this.notifSvc.unsubscribeAllAfterLogoutEvent();
  }

  loadScripts() {
    const node = document.createElement('script');
    node.src =
      'https://maps.googleapis.com/maps/api/js?key=' +
      environment.googleMapsApiKey +
      '&libraries=places&lang=fr-FR';
    node.type = 'text/javascript';
    node.async = false;
    document.getElementsByTagName('head')[0].appendChild(node);
  }
}
