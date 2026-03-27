
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalProvider } from './context/global-provider';
import { LanguageProvider } from './context/language-provider';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <LanguageProvider>
                <GlobalProvider>
                    <AppNavigator />
                    <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
                </GlobalProvider>
            </LanguageProvider>
        </SafeAreaProvider>
    );
}