import * as Location from 'expo-location';
import { Alert } from 'react-native';



// Pass setCurrentLocation as an argument from the calling component
export const getLocation = async (onSuccess, onError, setCurrentLocation) => {

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
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
