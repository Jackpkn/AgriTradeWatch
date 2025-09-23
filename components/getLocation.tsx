import React from "react";
import * as Location from "expo-location";
import {
  Alert,
  BackHandler,
  Platform,
  View,
  Text,
  ActivityIndicator,
} from "react-native";

// ---------- Types ----------
interface LocationPermissionLoadingProps {
  message?: string;
}

type LocationSuccessCallback = (location: Location.LocationObject) => void;
type LocationErrorCallback = (error: unknown) => void;
type SetCurrentLocation = (location: Location.LocationObject) => void;

// ---------- Loading screen ----------
export const LocationPermissionLoading: React.FC<
  LocationPermissionLoadingProps
> = ({ message = "Requesting location permission..." }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#eafbe7",
        padding: 20,
      }
      }
    >
      <Text
        style={
          {
            fontSize: 18,
            fontWeight: "bold",
            color: "#1F4E3D",
            textAlign: "center",
            marginBottom: 20,
          }
        }
      >
        MandiGo
      </Text>
      < Text
        style={{
          fontSize: 16,
          color: "#49A760",
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        {message}
      </Text>
      < ActivityIndicator size="large" color="#49A760" />
      <Text
        style={
          {
            fontSize: 14,
            color: "#666",
            textAlign: "center",
            marginTop: 20,
          }
        }
      >
        Please allow location access to continue
      </Text>
    </View>
  );
};

// ---------- Exit app ----------
const exitApp = (): void => {
  if (Platform.OS === "android") {
    BackHandler.exitApp();
  } else {
    // iOS does not allow programmatic exit
    throw new Error("Location permission required");
  }
};

// ---------- Mandatory location permission ----------
export const getMandatoryLocation = async (
  onSuccess?: LocationSuccessCallback,
  onError?: LocationErrorCallback,
  setCurrentLocation?: SetCurrentLocation
): Promise<Location.LocationObject | null> => {
  try {
    // First check if we already have permission
    let { status } = await Location.getForegroundPermissionsAsync();

    // Only request if we don't have permission
    if (status !== "granted") {
      const result = await Location.requestForegroundPermissionsAsync();
      status = result.status;
    }

    if (status !== "granted") {
      Alert.alert(
        "Location Permission Required",
        "MandiGo requires location access to show crop prices near you and help you track market trends. Please enable location permissions to continue using the app.",
        [
          {
            text: "Enable Location",
            onPress: () => {
              getMandatoryLocation(onSuccess, onError, setCurrentLocation);
            },
            style: "default",
          },
          {
            text: "Exit App",
            onPress: () => {
              console.log(
                "User chose to exit app due to denied location permission"
              );
              exitApp();
            },
            style: "destructive",
          },
        ],
        { cancelable: false }
      );

      if (onError) onError("Permission denied - app will exit");
      return null;
    }

    console.log("Location permission granted, fetching current position...");
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,

      // timeout: 15000,
    });

    console.log("Location obtained successfully:", location.coords);
    if (setCurrentLocation) setCurrentLocation(location);
    if (onSuccess) onSuccess(location);

    return location;
  } catch (error: unknown) {
    console.error("Error fetching location:", error);

    if (
      error instanceof Error &&
      (error.message?.includes("Location permission") ||
        error.message?.includes("denied"))
    ) {
      Alert.alert(
        "Location Permission Error",
        "Location access is required for MandiGo to function properly. Please enable location permissions in your device settings.",
        [
          {
            text: "Exit App",
            onPress: () => exitApp(),
            style: "destructive",
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please check your GPS settings and try again.",
        [
          {
            text: "Try Again",
            onPress: () => {
              getMandatoryLocation(onSuccess, onError, setCurrentLocation);
            },
          },
          {
            text: "Exit App",
            onPress: () => exitApp(),
            style: "destructive",
          },
        ],
        { cancelable: false }
      );
    }

    if (onError) onError(error);
    return null;
  }
};

// ---------- Optional location fetch ----------
export const getLocation = async (
  onSuccess?: LocationSuccessCallback,
  onError?: LocationErrorCallback,
  setCurrentLocation?: SetCurrentLocation
): Promise<Location.LocationObject | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      if (onError) onError("Permission denied");
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    if (setCurrentLocation) setCurrentLocation(location);
    if (onSuccess) onSuccess(location);
    return location;
  } catch (error: unknown) {
    console.error("Error fetching location:", error);
    if (onError) onError(error);
    return null;
  }
};
