import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rahul.napkin', // can NEVER change after the first install
  appName: 'Napkin',
  webDir: 'dist',
  android: {
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    backgroundColor: '#F6F3EE',
  },
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 400,
      launchFadeOutDuration: 240,
      backgroundColor: '#F6F3EE',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
    },
    StatusBar: { overlaysWebView: false, style: 'DEFAULT' },
  },
};

export default config;
