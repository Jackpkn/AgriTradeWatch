import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useContext, useEffect, useState } from "react";
import { enableScreens } from "react-native-screens";
import Ionicons from "@expo/vector-icons/Ionicons";

// Local assets & styles
import logo from "@/assets/images/logo1.png";
import { indexStyles as styles } from "@/components/IndexCss";

// Context & Utils
import { GlobalContext, } from "@/context/GlobalProvider";
import { networkManager } from "@/utils/networkUtils";

// Enable screens for performance
enableScreens();

// Define props/state types explicitly
interface AuthErrorState {
  hasError: boolean;
  message: string;
}

export default function Index() {
  const [authError, setAuthError] = useState<AuthErrorState>({
    hasError: false,
    message: "",
  });
  const [selectedLanguage] = useState<string>("English");

  // Safely consume context with fallback
  const contextValue = useContext(GlobalContext) || {
    isOnline: true,
    isLogged: false,
    isLoading: true,
  };

  const { isOnline = true, isLogged = false, isLoading = true } = contextValue;

  // Memoized handler for About Us
  const handleAboutUsPress = useCallback(async () => {
    const url = "https://mandigo.in/page/aboutus/"; // Fixed: removed trailing space
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open link. Please check the URL.");
      }
    } catch (error) {
      console.error("Error opening About Us URL:", error);
      Alert.alert("Error", "Failed to open About Us page.");
    }
  }, []);

  // Retry handler — avoid window.location.reload() in React Native
  const handleRetry = useCallback(async () => {
    setAuthError({ hasError: false, message: "" });

    try {
      if (networkManager) {
        const status = await networkManager.getNetworkStatus();
        if (!status.isConnected) {
          // Still offline — do nothing, UI already reflects this
          return;
        }
      }

      // Instead of window.location.reload(), use router.replace for SPA behavior
      router.replace("/");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setAuthError({ hasError: true, message: errorMessage });
      console.error("Error during retry:", error);
    }
  }, []);

  // Handle auth state — navigate if logged in
  useEffect(() => {
    if (isLogged && !isLoading) {
      router.replace("/(tabs)/home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogged, isLoading]);

  // ======================
  // RENDER STATES
  // ======================

  // OFFLINE STATE
  if (!isOnline) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff3cd",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View style={{ alignItems: "center", maxWidth: 300 }}>
          <Text style={{ fontSize: 24, color: "#856404", marginBottom: 8, fontWeight: "bold" }}>
            📶
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: "#856404",
              marginBottom: 8,
              fontWeight: "bold",
            }}
          >
            No Internet Connection
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#856404",
              textAlign: "center",
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            Please turn on your internet connection to use MandiGo. The app needs internet to sync
            data and authenticate users.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#856404",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 15,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={handleRetry}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginRight: 8 }}>
              Check Connection
            </Text>
            <Text style={{ color: "#fff", fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: "#856404", textAlign: "center" }}>
            Make sure you're connected to WiFi or mobile data
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // AUTH ERROR STATE
  if (authError.hasError && isOnline) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#ffe6e6",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View style={{ alignItems: "center", maxWidth: 300 }}>
          <Text
            style={{ fontSize: 18, color: "#d32f2f", marginBottom: 8, fontWeight: "bold" }}
          >
            Authentication Error
          </Text>
          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 }}>
            There was a problem setting up your session. You can try again or restart the app.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#d32f2f",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              marginBottom: 15,
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

  // LOADING STATE
  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#eafbe7",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Image source={logo} style={{ width: 120, height: 120, marginBottom: 20 }} />
          <Text style={{ fontSize: 24, color: "#49A760", marginBottom: 8, fontWeight: "bold" }}>
            MandiGo
          </Text>
          <Text style={{ fontSize: 16, color: "#666" }}>Setting up your experience...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // LANDING PAGE
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7" }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appName}>MandiGo</Text>
            <Text style={styles.tagline}>Your Agricultural Trade Companion</Text>
          </View>

          {/* Language Selection */}
          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>Choose Language</Text>
            <TouchableOpacity
              style={[styles.languageButton, styles.languageButtonDisabled]}
              disabled={true}
            >
              <Text style={styles.languageFlag}>🇮🇳</Text>
              <Text style={styles.languageText}>{selectedLanguage}</Text>
              <Ionicons name="chevron-down" size={20} color="#ccc" />
            </TouchableOpacity>
            <Text style={styles.comingSoon}>🌱 Coming Soon - More languages will be available</Text>
          </View>

          {/* Main Options */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={[styles.optionButton, styles.loginButton]}
              onPress={() => router.push("/(auth)/login")}
            >
              <Ionicons name="log-in" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.registerButton]}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Ionicons name="person-add" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>Quick Links</Text>

            <TouchableOpacity style={styles.quickLinkButton} onPress={handleAboutUsPress}>
              <Ionicons name="information-circle" size={20} color="#49A760" />
              <Text style={styles.quickLinkText}>About Us</Text>
            </TouchableOpacity>

            {/* Placeholder for future links */}
            {/* <TouchableOpacity style={styles.quickLinkButton}>
              <Icon name="document-text" size={20} color="#49A760" />
              <Text style={styles.quickLinkText}>Disclaimer</Text>
            </TouchableOpacity> */}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 MandiGo. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}