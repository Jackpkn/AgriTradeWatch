import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GlobalProvider } from '@/context/global-provider';
import { LanguageProvider } from '@/context/language-provider';
import Loader from '@/components/Loader';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add your custom fonts here if needed
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <GlobalProvider>
        <Loader />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="crops"
            options={{
              headerShown: true,
              title: 'Add Crop Data',
              headerStyle: {
                backgroundColor: '#49A760',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen
            name="damage-crop"
            options={{
              headerShown: true,
              title: 'Report Crop Damage',
              headerStyle: {
                backgroundColor: '#FF6B6B',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen
            name="digital-thela"
            options={{
              headerShown: true,
              title: 'Digital Thela',
              headerStyle: {
                backgroundColor: '#9C27B0',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </Stack>
      </GlobalProvider>
    </LanguageProvider>
  );
}
