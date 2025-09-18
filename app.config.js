export default {
  expo: {
    name: "kiflow",
    slug: "kiflow",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "kiflow",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    owner: "kiflowmobile",
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./src/assets/images/favicon.png",
      meta: {
        "disable-remote-playback": "true",
        "google-cast-sdk-enabled": "false"
      }
    },
    plugins: [
      "expo-router",
      "expo-video",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Додаток використовує фото для встановлення аватара профілю.",
          cameraPermission: "Додаток використовує камеру для створення фото профілю."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    updates: {
      url: "https://u.expo.dev/b46e19cd-4233-46c8-afb8-dd3de497c66b"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "b46e19cd-4233-46c8-afb8-dd3de497c66b"
      }
    }
  }
};
