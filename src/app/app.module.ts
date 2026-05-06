import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
import { CalendarModule } from './calendar';
import { HammerModule } from '@angular/platform-browser';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({ declarations: [AppComponent],
    schemas: [NO_ERRORS_SCHEMA],
    bootstrap: [AppComponent], imports: [BrowserModule,
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
