import { Stack } from "expo-router";
import Sentry from "@/sentry";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { GlobalProvider } from "@/context/global-provider";
import GlobalLoader from "@/components/Loader";

import ErrorBoundary from "../components/ErrorBoundary";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

Sentry.init({
  dsn: "https://e8591e6cfdfaee9608dd7142e6891045@o4509895087423488.ingest.de.sentry.io/4509895089324112",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

Sentry;

// App Layout Component
const AppLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="crops" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

const RootLayout = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GlobalProvider>
          <PaperProvider>
            <AppLayout />
            <GlobalLoader />
          </PaperProvider>
        </GlobalProvider>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default RootLayout;
