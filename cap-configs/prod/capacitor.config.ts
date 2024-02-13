/// <reference types="@capacitor-firebase/messaging" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rovincent.dyspo',
  appName: 'Dyspo!',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['sound'],
    },

    SplashScreen: {
      launchShowDuration: 5000,
      launchAutoHide: true,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: false,
      layoutName: 'launch_screen',
      useDialog: true,
    },
  },
  ios: {
    path: 'ios/prod',
    appendUserAgent: 'ios:application',
    webContentsDebuggingEnabled: true,
  },
  android: {
    path: 'android/prod',
    webContentsDebuggingEnabled: true,
  },
};

export default config;
