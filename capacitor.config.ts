import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.blackfox43.memeai",
  appName: "MemeAI",
  webDir: "dist",
  server: {
    // Use https scheme on Android so secure cookies / APIs work cleanly
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
