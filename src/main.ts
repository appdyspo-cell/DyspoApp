import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { register } from 'swiper/element/bundle';
import { SplashScreen } from '@capacitor/splash-screen';

import 'hammerjs';

register();

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => {
    console.error('Bootstrap error:', err);
    // Si Angular échoue au démarrage (ex: NG0201), on libère le splash screen
    // pour éviter un écran figé indéfiniment, et on navigue vers /login.
    SplashScreen.hide().catch(() => {});
    const root = document.querySelector('app-root');
    if (root) {
      (root as HTMLElement).innerHTML =
        '<div style="padding:24px;font-family:sans-serif;color:#c00">' +
        '<h2>Erreur au démarrage</h2>' +
        '<p>Redémarre l\'application. (' + (err?.message || err) + ')</p>' +
        '</div>';
    }
  });
