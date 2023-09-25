import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rovincent.starter',
  appName: 'dyspo',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    appendUserAgent: 'ios:application',
    webContentsDebuggingEnabled: true,
  },
};

export default config;
