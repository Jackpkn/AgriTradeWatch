
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useGlobal } from '@/context/global-provider';
import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '@/hooks/useTranslation';

// Import your screens
import HomeScreen from '../app/(tabs)/home';
import MapScreen from '../app/(tabs)/map';
import StatsScreen from '../app/(tabs)/stats';
import ProfileScreen from '../app/(tabs)/profile';
import CropsScreen from '../app/crops';
import DamageCropScreen from '../app/damage-crop';
import DigitalThelaScreen from '../app/digital-thela';
import AddProduceScreen from '../app/add-produce';
import FarmerProfileScreen from '../app/farmer-profile';
import LoginScreen from '../app/(auth)/login';
import SignupScreen from '../app/(auth)/signup';
import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import IndexScreen from '../app/index';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    const navigation = useNavigation();
    const { t } = useTranslation();

    // Handle hardware back button for Android
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Show alert asking user if they want to exit the app
            Alert.alert(
                t.nav.exitApp,
                t.nav.exitAppMessage,
                [
                    {
                        text: t.common.cancel,
                        onPress: () => null,
                        style: 'cancel',
                    },
                    {
                        text: t.nav.exit,
                        onPress: () => BackHandler.exitApp(),
                    },
                ],
                { cancelable: false }
            );
            return true; // Prevent default back behavior
        });

        return () => backHandler.remove();
    }, [t]);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false, // This hides the top header
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0',
                    paddingBottom: 20,
                    paddingTop: 0,
                    height: 85,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarItemStyle: {
                    paddingVertical: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginTop: 0,
                    marginBottom: 5,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Stats') {
                        iconName = focused ? 'analytics' : 'analytics-outline';
                    } else if (route.name === 'Crops') {
                        iconName = focused ? 'leaf' : 'leaf-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'ellipse-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2e7d32',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: t.nav.home }}
            />
            <Tab.Screen
                name="Map"
                component={MapScreen}
                options={{ title: t.nav.map }}
            />
            <Tab.Screen
                name="Stats"
                component={StatsScreen}
                options={{ title: t.nav.stats }}
            />
            <Tab.Screen
                name="Crops"
                component={CropsScreen}
                options={{ title: t.nav.crops }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: t.nav.profile }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { isLogged, isLoading } = useGlobal();
    const { t } = useTranslation();

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {isLogged ? (
                    // Authenticated user - show Main screen and additional screens
                    <>
                        <Stack.Screen
                            name="Main"
                            component={TabNavigator}
                            options={{
                                headerShown: false,
                                // Prevent going back to auth screens
                                gestureEnabled: false
                            }}
                        />
                        <Stack.Screen
                            name="damage-crop"
                            component={DamageCropScreen}
                            options={{
                                title: t.damageCrop?.header || 'Report Crop Damage',
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
                            component={DigitalThelaScreen}
                            options={{
                                title: t.digitalThela?.header || 'Digital Thela',
                                headerStyle: {
                                    backgroundColor: '#9C27B0',
                                },
                                headerTintColor: '#fff',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                        <Stack.Screen
                            name="add-produce"
                            component={AddProduceScreen}
                            options={{
                                title: t.digitalThela?.addProduce || 'Add Produce',
                                headerStyle: {
                                    backgroundColor: '#9C27B0',
                                },
                                headerTintColor: '#fff',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                        <Stack.Screen
                            name="farmer-profile"
                            component={FarmerProfileScreen}
                            options={{
                                title: 'Farmer Profile',
                                headerStyle: {
                                    backgroundColor: '#9C27B0',
                                },
                                headerTintColor: '#fff',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                    </>
                ) : (
                    // Not authenticated - show auth flow
                    <>
                        <Stack.Screen
                            name="Index"
                            component={IndexScreen}
                            options={{
                                headerShown: false,
                                // Prevent going back when on Index
                                gestureEnabled: false
                            }}
                        />
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ title: t.auth.login }}
                        />
                        <Stack.Screen
                            name="Signup"
                            component={SignupScreen}
                            options={{ title: t.auth.signUp }}
                        />
                        <Stack.Screen
                            name="ForgotPassword"
                            component={ForgotPasswordScreen}
                            options={{ title: t.auth.forgotPassword }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}