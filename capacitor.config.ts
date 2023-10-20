/// <reference types="@capacitor-firebase/messaging" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rovincent.dyspo',
  appName: 'dyspo',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    path: 'ios/prod',
    appendUserAgent: 'ios:application',
    webContentsDebuggingEnabled: true,
  },
  android: {
    path: 'android/prod',
  },
};

export default config;
