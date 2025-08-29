import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "../../context/GlobalProvider";
import { router } from "expo-router";
import { auth } from "../../firebase";
import { getUserData } from "../../components/crud";
import OfflineIndicator from "../../components/OfflineIndicator";

const { width } = Dimensions.get("window");

const home = () => {
  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    console.error("Error accessing GlobalContext in home:", error);
    contextValue = {};
  }

  const {
    setMainUser = () => {},
    isLogged = false,
    isGuest = false,
    guestRole = null,
    userRole = null,
    mainUser = {},
    isLoading = true
  } = contextValue || {};

  // Redirect to login if not authenticated (mandatory login)
  React.useEffect(() => {
    if (!isLogged && !isLoading) {
      console.log("Home: User not logged in, redirecting to login (mandatory login)");
      router.replace("/(auth)/login");
    }
  }, [isLogged, isLoading]);

  const getUser = React.useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userData = await getUserData(user.uid);
        setMainUser(userData);
      }
    } catch (error) {
      console.error("Error getting user:", error);
    }
  }, [setMainUser]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  const features = [
    {
      id: 1,
      title: "Add Crop Data",
      description: "Submit new crop prices and market information",
      icon: "add-circle",
      route: "crops",
      gradient: ["#49A760", "#3d8b4f"],
      bgColor: "#f0f9f1",
    },
    {
      id: 2,
      title: "Market Analytics",
      description: "View detailed price trends and statistics",
      icon: "analytics",
      route: "stats",
      gradient: ["#2196F3", "#1976D2"],
      bgColor: "#f0f7ff",
    },
    {
      id: 3,
      title: "Price Map",
      description: "Explore crop prices in your area",
      icon: "map",
      route: "map",
      gradient: ["#FF9800", "#F57C00"],
      bgColor: "#fff8f0",
    },
    {
      id: 4,
      title: "My Profile",
      description: "Manage your account and preferences",
      icon: "person-circle",
      route: "profile",
      gradient: ["#9C27B0", "#7B1FA2"],
      bgColor: "#f8f0ff",
    },
  ];

  // Dynamic quick actions based on user status
  const quickActions = React.useMemo(() => {
    const baseActions = [
      {
        title: "Today's Prices",
        icon: "today",
        action: () => router.push("stats"),
      },
      {
        title: "Nearby Markets",
        icon: "location",
        action: () => router.push("map"),
      },
    ];

    if (isLogged) {
      // Add actions for logged-in users (login is now mandatory)
      baseActions.push({
        title: "Add Crop Data",
        icon: "add-circle",
        action: () => router.push("crops"),
      });
      baseActions.push({
        title: "My Profile",
        icon: "person",
        action: () => router.push("profile"),
      });
    } else {
      // If somehow not logged in (shouldn't happen with mandatory login)
      console.warn("Home screen: User not logged in but reached home - redirecting to login");
      baseActions.push({
        title: "Please Login",
        icon: "log-in",
        action: () => router.replace("/(auth)/login"),
      });
    }

    // Note: Guest features are disabled - login is now mandatory

    return baseActions;
  }, [isLogged]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#f8fffe", "#eafbe7"]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.welcomeCard}>
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.headerGradient}
              >
                <Text style={styles.welcomeTitle}>
                  {isLogged
                    ? `Welcome back, ${mainUser?.name || "User"}!`
                    : "Welcome to MandiGo"
                  }
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  {isLogged
                    ? "Continue managing your crops and tracking prices"
                    : "Please login to access your account"
                  }
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>10+</Text>
                    <Text style={styles.statLabel}>Active Users</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>10+</Text>
                    <Text style={styles.statLabel}>Crop Types</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>24/7</Text>
                    <Text style={styles.statLabel}>Live Updates</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionCard}
                  onPress={action.action}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={24} color="#49A760" />
                  </View>
                  <Text style={styles.quickActionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Main Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitleMain}>Main Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={styles.featureCard}
                  onPress={() => router.push(feature.route)}
                >
                  <View
                    style={[
                      styles.featureIconContainer,
                      { backgroundColor: feature.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={feature.icon}
                      size={32}
                      color={feature.gradient[0]}
                    />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                  <TouchableOpacity
                    style={styles.featureButton}
                    onPress={() => router.push(feature.route)}
                  >
                    <LinearGradient
                      colors={feature.gradient}
                      style={styles.featureButtonGradient}
                    >
                      <Text style={styles.featureButtonText}>Explore</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fffe",
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerGradient: {
    padding: 28,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 16,
  },
  quickActionsSection: {
    paddingTop: 32,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitleMain: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  quickActionsContainer: {
    flexDirection: "row",
    // flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: (width - 56) / 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f9f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F4E3D",
    textAlign: "center",
  },
  featuresSection: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: (width - 56) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: "center",
    minHeight: 200,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F4E3D",
    textAlign: "center",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    flex: 1,
  },
  featureButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
  },
  featureButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
  },
  featureButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default home;