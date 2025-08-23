import { Slot, Stack } from "expo-router";
import Sentry from "../sentry";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { PaperProvider } from "react-native-paper";
import { GlobalProvider } from "../context/GlobalProvider";
import GlobalLoader from "../components/Loader";

Sentry.init({
  dsn: 'https://e8591e6cfdfaee9608dd7142e6891045@o4509895087423488.ingest.de.sentry.io/4509895089324112',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});


Sentry;

const RootLayout = () => {
  return (
    <>
      <GlobalProvider>
        <PaperProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="crops" options={{ headerShown: false }} />
          </Stack>
          <GlobalLoader />
        </PaperProvider>
      </GlobalProvider>
      <StatusBar style="dark-content" />
    </>
  );
};

export default RootLayout;
