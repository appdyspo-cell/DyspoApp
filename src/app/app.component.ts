import { Component } from '@angular/core';
import { Auth, User, authState, user } from '@angular/fire/auth';
import { ModalController, NavController, Platform } from '@ionic/angular';
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
import { AppUser } from './models/models';
import { CustodyRenewalModalComponent, CustodyRenewalResult } from './components/custody-renewal/custody-renewal-modal.component';
import { CalendarOnboardingModalComponent, CalendarOnboardingResult } from './components/calendar-onboarding/calendar-onboarding-modal.component';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    standalone: false
})
export class AppComponent {
  //userSubscription: Subscription;
  user$: Observable<User | null>;
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;
  isLoading = true;

  constructor(
    private auth: Auth,
    public platform: Platform,
    private translate: TranslateService,
    private navController: NavController,
    private modalCtrl: ModalController,

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

    // Cacher immédiatement le splash screen natif (launchShowDuration: 0 dans capacitor.config.ts).
    // L'overlay Angular startup-loader (fond blanc + logo texte + bulles) est l'unique écran de chargement visible.
    // Sur navigateur web, SplashScreen.hide() est un no-op.
    SplashScreen.hide();

    this.user$ = user(this.auth);
    this.authState$ = authState(this.auth);

    this.authStateSubscription = this.authState$.subscribe(
      (aUser: User | null) => {
        //handle auth state changes here. Note, that user will be null if there is no currently logged in user.

        if (aUser) {
          this.logger.logDebug('authStateSubscription', aUser);

          // Filet de sécurité : si subscribeUserInfo ne résout ni ne rejette
          // dans les 10s (réseau coupé, règles Firestore, etc.), on libère quand même
          // le splash et on renvoie vers le login.
          const splashSafetyTimer = setTimeout(() => {
            this.logger.logDebug('WARN: splashSafetyTimer déclenché — Firestore trop lent');
            this.hideStartupLoader();
            this.navController.navigateRoot('/login');
          }, 10000);

          // Init user svc
          this.userSvc
            .subscribeUserInfo(aUser.uid)
            .then((appUser) => {
              clearTimeout(splashSafetyTimer);
              this.initAllServices(appUser.uid!);
              this.logger.logDebug('validateAuthState userInfo ---> ', appUser);
              this.navController.navigateRoot('/tabs');
              setTimeout(() => {
                this.hideStartupLoader();
                // Popup unique de 1ère configuration (utilisateurs existants sans calendrier)
                // checkFirstCalendarSetup s'enchaîne avec checkCustodyRenewal si besoin.
                this.checkFirstCalendarSetup(appUser).then(() => {
                  this.checkCustodyRenewal(appUser);
                });
              }, 1200);
            })
            .catch(async (err) => {
              clearTimeout(splashSafetyTimer);
              // Première connexion via un provider social (Google/Apple/Facebook) :
              // l'utilisateur Firebase Auth existe mais n'a pas encore de profil Firestore.
              if (err?.msg === 'Utilisateur non trouvé' && aUser.email) {
                try {
                  await this.userSvc.createMinimalUserDoc(aUser);
                  const appUser = await this.userSvc.subscribeUserInfo(aUser.uid);
                  this.initAllServices(appUser.uid!);
                  this.navController.navigateRoot('/tabs');
                  setTimeout(() => {
                    this.hideStartupLoader();
                  }, 1200);
                  return;
                } catch (provisionErr) {
                  this.logger.logDebug(
                    'ERR createMinimalUserDoc ',
                    provisionErr
                  );
                }
              }
              this.logger.logDebug('ERR validateAuthState ', err);
              this.navController.navigateRoot('/login');
              this.utils.showToastError(err.msg);
              this.hideStartupLoader();
            });
        } else {
          setTimeout(() => {
            this.hideStartupLoader();
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

    // Fin de la "première connexion" : dès que l'app passe en arrière-plan,
    // on arrête de proposer les popups tutoriel (ShowHelper) même sur les
    // pages jamais visitées.
    App.addListener('appStateChange', (state) => {
      if (!state.isActive && this.userSvc.userInfo?.firstConnexion) {
        this.userSvc.endFirstConnexion();
      }
    });

    // Deep links : dyspo://event/<uid>
    App.addListener('appUrlOpen', (event) => {
      const match = event.url.match(/^dyspo:\/\/event\/(.+)$/);
      if (!match) return;
      this.agendaSvc.pendingDeepLinkEventUid = match[1];
      this.navController.navigateRoot('/tabs');
    });
  }

  ngOnDestroy() {
    this.authStateSubscription.unsubscribe();
    //this.userSubscription.unsubscribe();
  }

  /**
   * Popup unique affiché une seule fois aux utilisateurs existants qui n'ont
   * jamais configuré leur calendrier de disponibilités (dyspo_fill_end_date_ms absent).
   *
   * - Sans enfants → remplit tout en vert (DYSPO) pour 1 an.
   * - Avec enfants → affiche la grille de garde 2 semaines, puis remplit le calendrier.
   *
   * La clé localStorage `dyspo_cal_setup_<uid>` évite de ré-afficher le popup.
   */
  private async checkFirstCalendarSetup(user: AppUser): Promise<void> {
    // Déjà configuré → rien à faire
    if (user.dyspo_fill_end_date_ms) return;

    // Déjà montré lors d'une session précédente
    const storageKey = `dyspo_cal_setup_${user.uid}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, '1');

    const modal = await this.modalCtrl.create({
      component: CalendarOnboardingModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      backdropDismiss: false,      // l'utilisateur doit répondre
      cssClass: 'calendar-onboarding-modal',
    });
    await modal.present();

    const { data } = await modal.onWillDismiss<CalendarOnboardingResult>();
    if (!data) return;

    try {
      await this.utils.showLoader();

      // Sans enfants → tableau vide → applyCustodySchedule remplit tout en DYSPO
      // Avec enfants → tableau de garde → alternance DYSPOWITHKIDS / DYSPO
      const custodyDays = data.withKids && data.custodyDays
        ? data.custodyDays
        : new Array(14).fill(false);

      await this.agendaSvc.applyCustodySchedule(user.uid!, custodyDays);

      // Mettre à jour le profil : with_kids + custody_schedule
      await this.userSvc.updateUser({
        ...user,
        with_kids: data.withKids,
        custody_schedule: custodyDays,
      });

      this.utils.hideLoader();
      this.utils.showToastSuccess('Calendrier rempli pour un an !');
    } catch (err) {
      this.utils.hideLoader();
      this.utils.showToastError(err as string);
    }
  }

  private async checkCustodyRenewal(user: AppUser) {
    if (!user.with_kids || !user.custody_schedule || !user.dyspo_fill_end_date_ms) return;

    const daysLeft = Math.ceil(
      (user.dyspo_fill_end_date_ms - Date.now()) / 86400000
    );
    if (daysLeft > 7) return;

    // Avoid showing the popup more than once per day
    const todayKey = new Date().toISOString().split('T')[0];
    const storageKey = `dyspo_renewal_shown_${user.uid}`;
    if (localStorage.getItem(storageKey) === todayKey) return;
    localStorage.setItem(storageKey, todayKey);

    const modal = await this.modalCtrl.create({
      component: CustodyRenewalModalComponent,
      componentProps: {
        currentCustodyDays: user.custody_schedule,
        daysLeft: Math.max(0, daysLeft),
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      cssClass: 'custody-renewal-modal',
    });
    await modal.present();

    const { data } = await modal.onWillDismiss<CustodyRenewalResult>();
    if (!data || data.action === 'later') return;

    const custodyDays =
      data.action === 'update' && data.newCustodyDays
        ? data.newCustodyDays
        : user.custody_schedule;

    try {
      await this.utils.showLoader();
      await this.agendaSvc.applyCustodySchedule(user.uid!, custodyDays, {
        refMondayMs: user.dyspo_ref_monday_ms!,
        startFromMs: user.dyspo_fill_end_date_ms!,
      });
      this.utils.hideLoader();
      this.utils.showToastSuccess('Calendrier renouvelé pour un an !');
    } catch (err) {
      this.utils.hideLoader();
      this.utils.showToastError(err as string);
    }
  }

  private hideStartupLoader() {
    this.isLoading = false;
    // SplashScreen.hide() déjà appelé au boot (200ms) — pas besoin ici
  }

  async initAllServices(uid: string) {
    this.friendsSvc.initService(uid);
    this.agendaSvc.initService(uid);
    this.chatSvc.initService(uid);
    this.notificationSvc.initService(uid);

    if (this.platform.is('ios') || this.platform.is('android')) {
      try {
        await Contacts.requestPermissions();
      } catch (err) {
        console.log(err);
      }
      this.friendsSvc.initContacts();
    }
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
