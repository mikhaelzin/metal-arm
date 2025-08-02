import FontAwesome from "@expo/vector-icons/FontAwesome";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { PostHogProvider } from 'posthog-react-native'

import { useColorScheme } from "@/components/useColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PostHogProvider apiKey="phc_LjM9iseEcRPltGCHksRQDVZdhjgoPhP1NtsBdwPLntp" autocapture={true} options={{
      host: 'https://us.i.posthog.com',
      enableSessionReplay: true,
  }}>
    <GluestackUIProvider mode="light">
      <RootLayoutNav />
    </GluestackUIProvider>
  </PostHogProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GluestackUIProvider mode="light">
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerTitle: "Metal Arm" }} />
          <Stack.Screen
            name="bluetooth"
            options={{ headerTitle: "Bluetooth", headerBackVisible: false }}
          />
          <Stack.Screen
            name="sequences"
            options={{
              headerTitle: "Sequências",
              headerBackTitle: "Bluetooth",
            }}
          />
        </Stack>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
