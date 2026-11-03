import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CustodyRenewalModalComponent } from './components/custody-renewal/custody-renewal-modal.component';
import { CalendarOnboardingModalComponent } from './components/calendar-onboarding/calendar-onboarding-modal.component';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';

//Firebase
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import {
  provideAuth,
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
} from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { Capacitor } from '@capacitor/core';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideAppCheck } from '@angular/fire/app-check';
import { initializeAppCheck, CustomProvider } from 'firebase/app-check';
import { FirebaseAppCheck } from '@capacitor-firebase/app-check';
import { CalendarModule } from './calendar';
import { HammerModule } from '@angular/platform-browser';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({ declarations: [AppComponent, CustodyRenewalModalComponent, CalendarOnboardingModalComponent],
    schemas: [NO_ERRORS_SCHEMA],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        IonicModule.forRoot(),
        HammerModule,
        CalendarModule.forRoot({
            doneLabel: 'Save',
            closeIcon: true,
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient],
            },
        }),
        AppRoutingModule], providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideAppCheck(() => {
            const app = getApp();
            if (Capacitor.isNativePlatform()) {
                // Android: Play Integrity — iOS: App Attest (via @capacitor-firebase/app-check)
                return initializeAppCheck(app, {
                    provider: new CustomProvider({
                        getToken: () =>
                            FirebaseAppCheck.getToken().then((r: { token: string; expireTimeMillis?: number }) => ({
                                token: r.token,
                                expireTimeMillis: r.expireTimeMillis ?? Date.now() + 3_600_000,
                            })),
                    }),
                    isTokenAutoRefreshEnabled: true,
                });
            }
            // Web: token de debug (App Check en mode monitoring — non enforced)
            if (environment.appCheckDebugToken) {
                (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = environment.appCheckDebugToken;
            }
            return initializeAppCheck(app, {
                provider: new CustomProvider({
                    getToken: async () => ({
                        token: environment.appCheckDebugToken || 'web-debug',
                        expireTimeMillis: Date.now() + 3_600_000,
                    }),
                }),
                isTokenAutoRefreshEnabled: false,
            });
        }),
        provideAuth(() => {
            if (Capacitor.isNativePlatform()) {
                return initializeAuth(getApp(), { persistence: indexedDBLocalPersistence });
            }
            return getAuth();
        }),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideFunctions(() => getFunctions()),
        provideDatabase(() => getDatabase()),
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {
  constructor() {
    registerLocaleData(localeEn, 'en');
    registerLocaleData(localeFr, 'fr');
  }
}
