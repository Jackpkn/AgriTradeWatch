
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Image, ScrollView, Text, View, TouchableOpacity, Linking, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

// Local assets, styles, and context
import logo from "@/assets/images/logo1.png";
import { indexStyles as styles } from "@/components/IndexCss";
import { useGlobal } from "@/context/global-provider";

// ========================================================================
// SplashScreen Component
// ========================================================================

const SplashScreen = () => (
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: "#eafbe7",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <StatusBar style="dark" />
    <View style={{ alignItems: "center" }}>
      <Image source={logo} style={{ width: 120, height: 120, marginBottom: 20 }} resizeMode="contain" />
      <Text style={{ fontSize: 24, color: "#49A760", marginBottom: 8, fontWeight: "bold" }}>
        MandiGo
      </Text>
      <Text style={{ fontSize: 16, color: "#666", marginBottom: 20 }}>
        Checking authentication...
      </Text>
      <ActivityIndicator size="large" color="#49A760" />
    </View>
  </SafeAreaView>
);

// ========================================================================
// Main Index Component
// ========================================================================

export default function Index() {
  const navigation = useNavigation();
  const { isOnline, isLogged, isLoading } = useGlobal();

  const handleAboutUsPress = useCallback(async () => {
    const url = "https://mandigo.in/page/aboutus/";
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", `Cannot open the URL: ${url}`);
    }
  }, []);

  // --- Effects ---

  // Effect to handle navigation after loading is complete.
  useEffect(() => {
    console.log('🧭 Navigation check:', { isLoading, isLogged });
    // If loading is finished and the user is logged in, navigate to the main app.
    if (!isLoading && isLogged) {
      console.log('🧭 Navigating to home...');
      navigation.navigate('Main' as never);
    }
  }, [isLoading, isLogged, navigation]);

  // ======================
  // RENDER LOGIC
  // ======================

  // 1. Initial Loading State (Splash Screen) 
  if (isLoading) {
    return <SplashScreen />;
  }

  // 2. Offline State
  // If not loading and the device is offline, show a connection error.
  if (!isOnline) {
    return (
      <SafeAreaView style={styles.statusContainer}>
        <View style={styles.statusBox}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={styles.statusTitle}>No Internet Connection</Text>
          <Text style={styles.statusMessage}>
            Please check your network settings. MandiGo requires an internet connection to function.
          </Text>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => navigation.navigate('Index' as never)} // A simple replace re-triggers the logic
          >
            <Text style={styles.statusButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7" }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appName}>MandiGo</Text>
            <Text style={styles.tagline}>Your Agricultural Trade Companion</Text>
          </View>

          {/* Language Selection (Placeholder) */}
          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>Choose Language</Text>
            <View style={[styles.languageButton, styles.languageButtonDisabled]}>
              <Text style={styles.languageFlag}>🇮🇳</Text>
              <Text style={styles.languageText}>English</Text>
              <Ionicons name="chevron-down" size={20} color="#ccc" />
            </View>
          </View>

          {/* Auth Options */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={[styles.optionButton, styles.loginButton]}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Ionicons name="log-in-outline" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.registerButton]}
              onPress={() => navigation.navigate('Signup' as never)}
            >
              <Ionicons name="person-add-outline" size={24} color="#fff" />
              <Text style={styles.optionButtonText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinksSection}>
            <TouchableOpacity style={styles.quickLinkButton} onPress={handleAboutUsPress}>
              <Ionicons name="information-circle-outline" size={22} color="#49A760" />
              <Text style={styles.quickLinkText}>About Us</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© {new Date().getFullYear()} MandiGo. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
