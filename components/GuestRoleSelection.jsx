import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "../context/GlobalProvider";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const GuestRoleSelection = () => {
  const { loginAsGuest, isLoading } = useContext(GlobalContext);

  const [navigateToHome, setNavigateToHome] = React.useState(false);
  const [navigateToLogin, setNavigateToLogin] = React.useState(false);

  const handleRoleSelection = async (role) => {
    try {
      await loginAsGuest(role);
      // Set navigation flag instead of calling router directly
      setNavigateToHome(true);
    } catch (error) {
      console.error("Error selecting guest role:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to set guest mode. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleLogin = () => {
    // Set navigation flag instead of calling router directly
    setNavigateToLogin(true);
  };

  // Handle navigation in useEffect to avoid render-time navigation
  React.useEffect(() => {
    if (navigateToHome) {
      console.log("Navigating to home after guest login");
      router.replace("/(tabs)/home");
    }
  }, [navigateToHome]);

  React.useEffect(() => {
    if (navigateToLogin) {
      console.log("Navigating to login");
      router.push("/(auth)/login");
    }
  }, [navigateToLogin]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Setting up...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={60} color="#49A760" />
            </View>
            <Text style={styles.title}>Welcome to MandiGo</Text>
            <Text style={styles.subtitle}>
              Choose how you'd like to explore our platform
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelection("consumer")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.roleGradient}
              >
                <View style={styles.roleIconContainer}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
                <View style={styles.roleContent}>
                  <Text style={styles.roleTitle}>Continue as Consumer</Text>
                  <Text style={styles.roleDescription}>
                    Browse and view crop prices, find farmers near you
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelection("farmer")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#2196F3", "#1976D2"]}
                style={styles.roleGradient}
              >
                <View style={styles.roleIconContainer}>
                  <Ionicons name="leaf" size={32} color="#fff" />
                </View>
                <View style={styles.roleContent}>
                  <Text style={styles.roleTitle}>Continue as Farmer</Text>
                  <Text style={styles.roleDescription}>
                    Explore market data, view consumer demand
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Option */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Want to add your own crops?</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Login to Add Crops</Text>
              <Ionicons name="log-in" size={20} color="#49A760" />
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What you can do as guest:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#49A760" />
                <Text style={styles.featureText}>Browse crop prices</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#49A760" />
                <Text style={styles.featureText}>Find nearby farmers/consumers</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#49A760" />
                <Text style={styles.featureText}>View market trends</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                <Text style={styles.featureTextDisabled}>Add your own crops</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fffe",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
   
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F4E3D",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  roleGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  loginSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  loginText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#49A760",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#49A760",
    marginRight: 8,
  },
  featuresContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F4E3D",
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  featureTextDisabled: {
    fontSize: 14,
    color: "#999",
    flex: 1,
    textDecorationLine: "line-through",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});

export default GuestRoleSelection;
