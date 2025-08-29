import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, ImageBackground, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../assets/images/logo.png";
import { GlobalContext } from "../context/GlobalProvider";
import { useContext, useEffect, useCallback, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { enableScreens } from "react-native-screens";
// import GuestRoleSelection from "../components/GuestRoleSelection"; // Commented out - guest features disabled

export default function Index() {
  enableScreens();
  const [authError, setAuthError] = useState(null);

  const handleRetry = () => {
    console.log("Retrying authentication setup...");
    setAuthError(null);
    // Force a re-render by updating state
    window.location.reload?.() || router.replace("/");
  };

  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    console.error("Error accessing GlobalContext in Index:", error);
    setAuthError(error);
    contextValue = {};
  }

  const {
    isAuthenticated = false,
    isLogged = false,
    isGuest = false,
    isLoading = true
  } = contextValue || {};

  const onAuthStateChangedApp = useCallback((user) => {
    try {
      console.log("Auth state changed:", {
        hasUser: !!user,
        isGuest,
        isLoading,
        userEmail: user?.email || null
      });

      if (user) {
        console.log("User authenticated, navigating to home");
        router.replace("/(tabs)/home");
      } else if (!user && !isLoading) {
        console.log("No user found, redirecting to login (guest features disabled)");
        // Force login - redirect to login screen
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Error in onAuthStateChanged:", error);
    }
  }, [isGuest, isLoading]);

  // Handle navigation when authentication state changes
  useEffect(() => {
    try {
      console.log("Navigation effect triggered:", {
        isAuthenticated,
        isLoading,
        isGuest
      });

      if (isAuthenticated && !isLoading) {
        console.log("Authentication state changed, navigating to home");
        router.replace("/(tabs)/home");
      } else if (!isAuthenticated && !isLoading) {
        console.log("User not authenticated, redirecting to login");
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Error in navigation effect:", error);
    }
  }, [isAuthenticated, isLoading, isGuest]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const sub = onAuthStateChanged(auth, onAuthStateChangedApp);
    return () => sub();
  }, [onAuthStateChangedApp]);

  // Show error state if there's an authentication error
  if (authError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffe6e6", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ alignItems: "center", maxWidth: 300 }}>
          <Text style={{ fontSize: 18, color: "#d32f2f", marginBottom: 8, fontWeight: "bold" }}>Authentication Error</Text>
          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 }}>
            There was a problem setting up your session. You can try again or restart the app.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#d32f2f",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              marginBottom: 15
            }}
            onPress={handleRetry}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
            Error: {authError.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while initializing
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7", justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: "#49A760", marginBottom: 8 }}>MandiGo</Text>
          <Text style={{ fontSize: 16, color: "#666" }}>Setting up your experience...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not authenticated, redirect to login (guest features disabled)
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login (guest features disabled)");
    // This will be handled by the useEffect above, but we show a loading state here
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7", justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: "#49A760", marginBottom: 8 }}>MandiGo</Text>
          <Text style={{ fontSize: 16, color: "#666" }}>Redirecting to login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while navigating (authenticated but still loading)
  console.log("Showing redirect screen - user is authenticated");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7", justifyContent: "center", alignItems: "center" }}>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#49A760", marginBottom: 8 }}>Welcome!</Text>
        <Text style={{ fontSize: 16, color: "#666" }}>Taking you to your dashboard...</Text>
      </View>
    </SafeAreaView>
  );
}
