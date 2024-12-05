import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { PaperProvider } from "react-native-paper";
import { GlobalProvider } from "../context/GlobalProvider";
import GlobalLoader from "../components/Loader";

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
