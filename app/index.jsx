import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, ImageBackground, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../assets/images/logo.png";
import { GlobalContext } from "../context/GlobalProvider";
import { useContext, useEffect, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { enableScreens } from "react-native-screens";
import GuestRoleSelection from "../components/GuestRoleSelection";

export default function Index() {
  enableScreens();

  const { isAuthenticated, isLogged, isGuest, isLoading } = useContext(GlobalContext);

  const onAuthStateChangedApp = useCallback((user) => {
    if (user && !isGuest) {
      console.log("User authenticated, navigating to home");
      router.replace("/(tabs)/home");
    } else if (!user && !isGuest && !isLoading) {
      console.log("No user found, staying on index");
    }
  }, [isGuest, isLoading]);

  // Handle navigation when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("Authentication state changed, navigating to home");
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isLoading]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const sub = onAuthStateChanged(auth, onAuthStateChangedApp);
    return () => sub();
  }, [onAuthStateChangedApp]);

  // Show loading while initializing
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#666" }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Only show guest role selection if not authenticated
  if (!isAuthenticated) {
    return <GuestRoleSelection />;
  }

  // Show loading while navigating
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 16, color: "#666" }}>Redirecting...</Text>
    </SafeAreaView>
  );
}
