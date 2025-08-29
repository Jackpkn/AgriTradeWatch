import { Slot, Stack } from "expo-router";
import Sentry from "../sentry";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { GlobalProvider } from "../context/GlobalProvider";
import GlobalLoader from "../components/Loader";
import { LocationPermissionLoading } from "../components/getLocation";
import ErrorBoundary from "../components/ErrorBoundary";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useContext } from "react";
import { GlobalContext } from "../context/GlobalProvider";

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

// App Layout Component that handles location permission
const AppLayout = () => {
  const { isLoading, locationRequested } = useContext(GlobalContext);

  // Show loading screen while requesting location permission
  if (isLoading && !locationRequested) {
    return <LocationPermissionLoading />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="crops" options={{ headerShown: false }} />
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
        <StatusBar style="dark-content" />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default RootLayout;
