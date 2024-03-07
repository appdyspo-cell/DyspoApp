import { Component } from '@angular/core';
import { Auth, User, authState, user } from '@angular/fire/auth';
import { NavController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { UserService } from './services/user.service';
import { LoggerService } from './services/logger.service';
import { FriendsService } from './services/friends.service';
import { ChatService } from './services/chat.service';
import { AgendaService } from './services/agenda.service';
import { NotificationService } from './services/notification.service';
import { environment } from 'src/environments/environment';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { UtilsService } from './services/utils.service';
import { Contacts } from '@capacitor-community/contacts';

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
    public platform: Platform,
    private translate: TranslateService,
    private navController: NavController,

    private userSvc: UserService,
    private logger: LoggerService,
    private friendsSvc: FriendsService,
    private agendaSvc: AgendaService,
    private chatSvc: ChatService,
    private notificationSvc: NotificationService,
    private utils: UtilsService
  ) {
    const that = this;
    // window.onerror = function (msg, url, lineNo, columnNo, error) {
    //   that.logger.sendUncaughtError(
    //     msg,
    //     url,
    //     lineNo,
    //     columnNo,
    //     error,
    //     that.userSvc.userInfo?.uid
    //   );
    //   return false;
    // };
    //Lang

    this.translate.setDefaultLang('fr');
    this.loadScripts();

    this.translate.use('fr');

    this.user$ = user(this.auth);
    this.authState$ = authState(this.auth);

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
              setTimeout(() => {
                SplashScreen.hide();
              }, 800);
            })
            .catch((err) => {
              this.logger.logDebug('ERR validateAuthState ', err);
              this.navController.navigateRoot('/login');
              this.utils.showToastError(err.msg);
              SplashScreen.hide();
            });
        } else {
          setTimeout(() => {
            SplashScreen.hide();
          }, 800);
          this.logger.logDebug(
            'authStateSubscription NOUSER -> navigateRoot: Login'
          );
          this.navController.navigateRoot('/login');

          this.killAllServices();
          this.userSvc.unsubscribeUserInfo();
        }
      }
    );
  }

  ngOnDestroy() {
    this.authStateSubscription.unsubscribe();
    //this.userSubscription.unsubscribe();
  }

  async initAllServices(uid: string) {
    await Contacts.requestPermissions();
    this.friendsSvc.initService(uid);
    this.agendaSvc.initService(uid);
    this.chatSvc.initService(uid);
    this.notificationSvc.initService(uid);

    // Bug Android. Authorization is not prompted at launch time. Init on Contacts page for Android
    //if (this.platform.is('ios')) {
    this.friendsSvc.initContacts();
    //}
  }

  killAllServices() {
    this.friendsSvc.unsubscribeAllAfterLogoutEvent();
    this.agendaSvc.unsubscribeAllAfterLogoutEvent();
    this.chatSvc.unsubscribeAllAfterLogoutEvent();
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
