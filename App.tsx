
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalProvider } from './context/global-provider';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <GlobalProvider>
                <AppNavigator />
                <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
            </GlobalProvider>
        </SafeAreaProvider>
    );
}