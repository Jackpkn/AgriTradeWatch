import React from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  View,
  Text,
  ActivityIndicator,
} from "react-native";

// ---------- Constants ----------
const LOCATION_PERMISSION_REQUESTED_KEY = "@location_permission_requested";

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

// ---------- Permission persistence helpers ----------
const markPermissionRequested = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_PERMISSION_REQUESTED_KEY, "true");
  } catch (error) {
    console.warn("Failed to persist permission state:", error);
  }
};

const hasAlreadyRequestedPermission = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(LOCATION_PERMISSION_REQUESTED_KEY);
    return value === "true";
  } catch (error) {
    console.warn("Failed to read permission state:", error);
    return false;
  }
};

// Clear the persisted state (useful for testing or reset scenarios)
export const resetLocationPermissionState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_PERMISSION_REQUESTED_KEY);
  } catch (error) {
    console.warn("Failed to reset permission state:", error);
  }
};

// ---------- Open device settings ----------
const openLocationSettings = (): void => {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
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

    // Only request if we don't have permission AND we haven't requested before
    if (status !== "granted") {
      const alreadyRequested = await hasAlreadyRequestedPermission();

      if (!alreadyRequested) {
        // First time requesting - show the system dialog
        console.log("First time requesting location permission...");
        await markPermissionRequested();
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      } else {
        console.log("Permission was already requested before, skipping system dialog");
      }
    }

    if (status !== "granted") {
      // Permission denied - show alert to open settings (no recursive call)
      Alert.alert(
        "Location Permission Required",
        "MandiGo requires location access to show crop prices near you and help you track market trends. Please enable location in your device settings.",
        [
          {
            text: "Open Settings",
            onPress: openLocationSettings,
            style: "default",
          },
          {
            text: "Exit App",
            onPress: () => {
              console.log("User chose to exit app due to denied location permission");
              exitApp();
            },
            style: "destructive",
          },
        ],
        { cancelable: false }
      );

      if (onError) onError("Permission denied");
      return null;
    }

    console.log("Location permission granted, fetching current position...");
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
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
            text: "Open Settings",
            onPress: openLocationSettings,
            style: "default",
          },
          {
            text: "Exit App",
            onPress: () => exitApp(),
            style: "destructive",
          },
        ],
        { cancelable: false }
      );
    } else {
      // GPS/network error - offer to open settings (no recursive retry)
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please check your GPS settings and try again.",
        [
          {
            text: "Open Settings",
            onPress: openLocationSettings,
            style: "default",
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
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
