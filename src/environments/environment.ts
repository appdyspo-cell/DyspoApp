// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  debug: true,
  DEFAULT_AVATAR: './assets/img/user.png',
  dyspo_email: 'contact@dyspo.com',
  BIOMETRIC_KEY: 'dyspo_123456',
  firebaseConfig: {
    apiKey: 'AIzaSyB2Juhy49t_9N4d-aGfhcuQmC-o4ulvrwg',
    authDomain: 'dyspo-stg.firebaseapp.com',
    databaseURL:
      'https://dyspo-stg-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'dyspo-stg',
    storageBucket: 'dyspo-stg.appspot.com',
    messagingSenderId: '935331269385',
    appId: '1:935331269385:web:73394d7fb1e204e4f2e1d8',
  },
  googleMapsApiKey: 'AIzaSyB2Juhy49t_9N4d-aGfhcuQmC-o4ulvrwg',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
