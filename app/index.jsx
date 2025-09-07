import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, ImageBackground, ScrollView, Text, View, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "@/assets/images/logo.png";
import { indexStyles as styles } from "@/components/IndexCss";
import { GlobalContext } from "@/context/GlobalProvider";
import { useContext, useEffect, useCallback, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { enableScreens } from "react-native-screens";
import { networkManager } from "@/utils/networkUtils";
import Icon from "react-native-vector-icons/Ionicons";
export default function Index() {
  enableScreens();
  const [authError, setAuthError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(true);

  // Handle opening About Us URL
  const handleAboutUsPress = async () => {
    try {
      const url = 'https://mandigo.in/page/aboutus/';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Cannot open URL:", url);
      }
    } catch (error) {
      console.error("Error opening About Us URL:", error);
    }
  };

  const handleRetry = async () => {
    console.log("Retrying authentication setup...");
    setAuthError(null);

    try {
      if (networkManager) {
        const status = await networkManager.getNetworkStatus();
        if (!status.isConnected) {
          console.log("Still offline, showing offline message");
          return;
        }
      }
      window.location.reload?.() || router.replace("/");
    } catch (error) {
      console.error("Error during retry:", error);
      setAuthError(error);
    }
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
    isOnline = true
  } = contextValue || {};

  const onAuthStateChangedApp = useCallback((user) => {
    try {
      console.log("Auth state changed:", {
        hasUser: !!user,
        userEmail: user?.email || null
      });

      if (user) {
        console.log("User authenticated, navigating to home");
        router.replace("/(tabs)/home");
      } else {
        console.log("No user found, staying on landing page");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error in onAuthStateChanged:", error);
    }
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const sub = onAuthStateChanged(auth, onAuthStateChangedApp);
    return () => sub();
  }, [onAuthStateChangedApp]);

  // Remove the duplicate navigation effect that was causing conflicts
  // The Firebase auth state listener above handles navigation properly

  // Safely get network status
  const isOffline = !isOnline;

  // Show offline state
  if (isOffline) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff3cd", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ alignItems: "center", maxWidth: 300 }}>
          <Text style={{ fontSize: 24, color: "#856404", marginBottom: 8, fontWeight: "bold" }}>📶</Text>
          <Text style={{ fontSize: 18, color: "#856404", marginBottom: 8, fontWeight: "bold" }}>No Internet Connection</Text>
          <Text style={{ fontSize: 14, color: "#856404", textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
            Please turn on your internet connection to use MandiGo. The app needs internet to sync data and authenticate users.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#856404",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 15,
              flexDirection: "row",
              alignItems: "center"
            }}
            onPress={handleRetry}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginRight: 8 }}>Check Connection</Text>
            <Text style={{ color: "#fff", fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: "#856404", textAlign: "center" }}>
            Make sure you're connected to WiFi or mobile data
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if there's an authentication error (but not offline)
  if (authError && !isOffline) {
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
          <Image source={logo} style={{ width: 120, height: 120, marginBottom: 20 }} />
          <Text style={{ fontSize: 24, color: "#49A760", marginBottom: 8, fontWeight: "bold" }}>MandiGo</Text>
          <Text style={{ fontSize: 16, color: "#666" }}>Setting up your experience...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show landing page
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
              <Text style={styles.languageFlag}>{selectedLanguage === "English" ? "🇮🇳" : "🇮🇳"}</Text>
              <Text style={styles.languageText}>{selectedLanguage}</Text>
              <Icon name="chevron-down" size={20} color="#ccc" />
            </TouchableOpacity>
            <Text style={styles.comingSoon}>🌱 Coming Soon - More languages will be available</Text>
          </View>

          {/* Main Options */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={[styles.optionButton, styles.loginButton]}
              onPress={() => router.push("/(auth)/login")}
            >
              <Icon name="log-in" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.registerButton]}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Icon name="person-add" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            
            <TouchableOpacity style={styles.quickLinkButton} onPress={handleAboutUsPress}>
              <Icon name="information-circle" size={20} color="#49A760" />
              <Text style={styles.quickLinkText}>About Us</Text>
            </TouchableOpacity>

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

