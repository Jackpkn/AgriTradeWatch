import { Slot, Stack } from "expo-router";
import { StatusBar, Text } from "react-native";
import { PaperProvider } from "react-native-paper";

const RootLayout = () => {;

  return (
    <>
    <PaperProvider>
    <StatusBar barStyle="dark-content"  backgroundColor={"rgba(0,0,0,0)"} />
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false}}  />
      <Stack.Screen name="(auth)" options={{headerShown: false}}  />
      <Stack.Screen name="(tabs)" options={{headerShown: false}}  />
      <Stack.Screen name="crops" options={{headerShown: false}}  />
   </Stack>
   </PaperProvider>
   </>
  );
}

export default RootLayout;