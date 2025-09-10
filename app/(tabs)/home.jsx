import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "@/context/GlobalProvider";
import { router, useFocusEffect } from "expo-router"; 
import OfflineIndicator from "@/components/OfflineIndicator";
import { useOrientation } from "@/utils/orientationUtils";
import { createHomeStyles } from "@/utils/responsiveStyles";
import NetInfo from '@react-native-community/netinfo';

// Constants moved outside component for better performance
const FEATURES = [
  {
    id: 1,
    title: "Add Crop Data",
    description: "Submit new crop prices and market information",
    icon: "add-circle",
    route: "crops",
    gradient: ["#49A760", "#3d8b4f"],
    bgColor: "#f0f9f1",
    isEnabled: true,
  },
  {
    id: 2,
    title: "Price Map",
    description: "Today/Yesterday/Date Range prices with location pin & radius",
    icon: "map",
    route: "map",
    gradient: ["#FF9800", "#F57C00"],
    bgColor: "#fff8f0",
    isEnabled: true,
  },
  {
    id: 3,
    title: "Digital Thela",
    description: "Revolutionary trading platform - Coming Soon",
    icon: "cart",
    route: null,
    gradient: ["#9C27B0", "#7B1FA2"],
    bgColor: "#f8f0ff",
    isEnabled: false,
    comingSoon: true,
  },
];

// Custom hook for network status
const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};

const Home = React.memo(() => {
  // Context with proper error handling
  const contextValue = useContext(GlobalContext);
  
  if (!contextValue) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading application...</Text>
      </SafeAreaView>
    );
  }

  const {
    isLogged = false,
    isGuest = false,
    mainUser = {},
    isLoading = true,
  } = contextValue;

  // State management
  const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);

  // Custom hooks
  const isConnected = useNetworkStatus();
  
  // Responsive design
  const { isLandscape, width } = useOrientation();
  const styles = useMemo(() => createHomeStyles(isLandscape, width), [isLandscape, width]);

  // Memoized quick actions
  const quickActions = useMemo(() => [
    {
      title: "View Recent Prices",
      icon: "trending-up",
      action: () => handleNavigation("map"),
      testID: "quick-action-recent-prices",
    },
    {
      title: "Find Nearby Markets",
      icon: "location",
      action: () => handleNavigation("map"),
      testID: "quick-action-nearby-markets",
    },
    {
      title: "Check Notifications",
      icon: "notifications",
      action: () => handleNavigation("profile"),
      testID: "quick-action-notifications",
    },
  ], []);

  // Navigation handler with error handling
  const handleNavigation = useCallback((route, params = {}) => {
    try {
      if (!route) {
        Alert.alert("Feature Unavailable", "This feature is coming soon!");
        return;
      }
      router.push({ pathname: route, params });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert("Error", "Unable to navigate. Please try again.");
    }
  }, []);

  // Feature press handler
  const handleFeaturePress = useCallback((feature) => {
    if (!feature.isEnabled) {
      Alert.alert(
        "Coming Soon", 
        `${feature.title} is currently under development. Stay tuned for updates!`,
        [{ text: "OK" }]
      );
      return;
    }
    
    handleNavigation(feature.route);
  }, [handleNavigation]);

  // App state change handler
  const handleAppStateChange = useCallback((nextAppState) => {
    setAppStateVisible(nextAppState);
  }, []);

  // Authentication check
  useFocusEffect(
    useCallback(() => {
      if (!isLoading && !isLogged && !isGuest) {
        const timer = setTimeout(() => {
          router.replace("/(auth)/login");
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [isLogged, isLoading, isGuest])
  );

  // App state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Render welcome section
  const renderWelcomeSection = useMemo(() => (
    <View style={styles.headerSection}>
      <View style={styles.welcomeCard}>
        <LinearGradient
          colors={["#49A760", "#3d8b4f"]}
          style={styles.headerGradient}
        >
          <Text style={styles.welcomeTitle} testID="welcome-title">
            {isLogged
              ? `Welcome back, ${mainUser?.name || "User"}!`
              : "Welcome to MandiGo"
            }
          </Text>
          <Text style={styles.welcomeSubtitle} testID="welcome-subtitle">
            {isLogged
              ? "Manage crops, explore prices, and prepare for digital trading"
              : "Please login to access your account"
            }
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{FEATURES.filter(f => f.isEnabled).length}</Text>
                <Text style={styles.statLabel}>Active Features</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Price Updates</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isConnected ? 'Online' : 'Offline'}</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  ), [isLogged, mainUser?.name, styles, isConnected]);

  const renderFeatureCard = useCallback((feature) => (
    <TouchableOpacity
      key={feature.id}
      style={[
        styles.featureCard,
        !feature.isEnabled && styles.comingSoonCard
      ]}
      onPress={() => handleFeaturePress(feature)}
      disabled={!feature.isEnabled}
      testID={`feature-card-${feature.id}`}
      accessibilityLabel={`${feature.title}: ${feature.description}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !feature.isEnabled }}
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
          color={feature.isEnabled ? feature.gradient[0] : '#BDBDBD'}
        />
      </View>
      <Text style={[styles.featureTitle, !feature.isEnabled && { color: '#BDBDBD' }]}>
        {feature.title}
      </Text>
      <Text style={[styles.featureDescription, !feature.isEnabled && { color: '#BDBDBD' }]}>
        {feature.description}
      </Text>
      
      {feature.comingSoon ? (
        <View style={styles.comingSoonButton}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.featureButton}
          onPress={() => handleFeaturePress(feature)}
          testID={`feature-button-${feature.id}`}
        >
          <LinearGradient
            colors={feature.gradient}
            style={styles.featureButtonGradient}
          >
            <Text style={styles.featureButtonText}>Explore</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  ), [styles, handleFeaturePress]);

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <LinearGradient
        colors={["#f8fffe", "#eafbe7"]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="home-scroll-view"
        >
          {/* Header Section */}
          {renderWelcomeSection}

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Main Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitleMain} testID="features-title">
              Core Features
            </Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map(renderFeatureCard)}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle} testID="quick-actions-title">
              Quick Actions
            </Text>
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionCard}
                  onPress={action.action}
                  testID={action.testID}
                  accessibilityLabel={action.title}
                  accessibilityRole="button"
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={24} color="#49A760" />
                  </View>
                  <Text style={styles.quickActionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
});

Home.displayName = 'Home';

export default Home;