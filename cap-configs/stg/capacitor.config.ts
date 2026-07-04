/// <reference types="@capacitor-firebase/messaging" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rovincent.dyspo.staging',
  appName: 'Dyspo! stg',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['sound'],
    },

    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'apple.com', 'facebook.com'],
    },

    SplashScreen: {
      launchShowDuration: 5000,
      launchAutoHide: false,
    },
  },
  ios: {
    path: 'ios/stg',
    appendUserAgent: 'ios:application',
    webContentsDebuggingEnabled: true,
  },
  android: {
    path: 'android/stg',
    webContentsDebuggingEnabled: true,
  },
};

export default config;
