/// <reference types="@capacitor-firebase/messaging" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liaisongraphique.dyspo',
  appName: 'dyspo!',
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
      providers: ['google.com'],
    },

    SplashScreen: {
      launchShowDuration: 5000,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
    },
  },
  ios: {
    path: 'ios/prod',
    appendUserAgent: 'ios:application',
    webContentsDebuggingEnabled: false,
  },
  android: {
    path: 'android/prod',
    webContentsDebuggingEnabled: false,
  },
};

export default config;
