import * as Location from 'expo-location';
import { Alert, BackHandler, Platform, View, Text, ActivityIndicator } from 'react-native';

// Loading screen component for location permission
export const LocationPermissionLoading = ({ message = "Requesting location permission..." }) => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#eafbe7',
      padding: 20
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F4E3D',
        textAlign: 'center',
        marginBottom: 20
      }}>
        MandiGo
      </Text>
      <Text style={{
        fontSize: 16,
        color: '#49A760',
        textAlign: 'center',
        marginBottom: 30
      }}>
        {message}
      </Text>
      <ActivityIndicator size="large" color="#49A760" />
      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 20
      }}>
        Please allow location access to continue
      </Text>
    </View>
  );
};



// Exit app function
const exitApp = () => {
  if (Platform.OS === 'android') {
    BackHandler.exitApp();
  } else {
    // For iOS, we can't programmatically exit, so we'll throw an error
    throw new Error('Location permission required');
  }
};

// Mandatory location permission - will exit app if denied
export const getMandatoryLocation = async (onSuccess, onError, setCurrentLocation) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      // Show alert explaining why location is required
      Alert.alert(
        'Location Permission Required',
        'MandiGo requires location access to show crop prices near you and help you track market trends. Please enable location permissions to continue using the app.',
        [
          {
            text: 'Enable Location',
            onPress: () => {
              // Try requesting permission again
              getMandatoryLocation(onSuccess, onError, setCurrentLocation);
            },
            style: 'default'
          },
          {
            text: 'Exit App',
            onPress: () => {
              console.log('User chose to exit app due to denied location permission');
              exitApp();
            },
            style: 'destructive'
          }
        ],
        { cancelable: false } // Prevent dismissing by tapping outside
      );

      if (onError) onError('Permission denied - app will exit');
      return null;
    }

    // Permission granted, get location
    console.log('Location permission granted, fetching current position...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000, // 15 seconds timeout
    });

    console.log('Location obtained successfully:', location.coords);
    if (setCurrentLocation) setCurrentLocation(location);
    if (onSuccess) onSuccess(location);
    return location;

  } catch (error) {
    console.error('Error fetching location:', error);

    // Handle different error types
    if (error.message?.includes('Location permission') || error.message?.includes('denied')) {
      Alert.alert(
        'Location Permission Error',
        'Location access is required for MandiGo to function properly. Please enable location permissions in your device settings.',
        [
          {
            text: 'Exit App',
            onPress: () => exitApp(),
            style: 'destructive'
          }
        ],
        { cancelable: false }
      );
    } else {
      // Handle other location errors (timeout, network, etc.)
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              getMandatoryLocation(onSuccess, onError, setCurrentLocation);
            }
          },
          {
            text: 'Exit App',
            onPress: () => exitApp(),
            style: 'destructive'
          }
        ],
        { cancelable: false }
      );
    }

    if (onError) onError(error);
    return null;
  }
};

// Keep the original function for backward compatibility (optional usage)
export const getLocation = async (onSuccess, onError, setCurrentLocation) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (onError) onError('Permission denied');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    if (setCurrentLocation) setCurrentLocation(location);
    if (onSuccess) onSuccess(location);
    return location;
  } catch (error) {
    console.error('Error fetching location:', error);
    if (onError) onError(error);
    return null;
  }
};
