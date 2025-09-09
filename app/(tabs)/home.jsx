import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "../../context/GlobalProvider";
import { router } from "expo-router";
// Firebase dependencies removed - using API-based authentication
import OfflineIndicator from "../../components/OfflineIndicator";
import { useOrientation } from "../../utils/orientationUtils";
import { createHomeStyles } from "../../utils/responsiveStyles";   

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

  // State for user activities
  const [userActivities, setUserActivities] = useState([]);
  
  // Use orientation hook
  const { screenData, isLandscape, width, breakpoints } = useOrientation();

  // Create responsive styles
  const styles = useMemo(() => createHomeStyles(isLandscape, width), [isLandscape, width]);

  // Redirect to login if not authenticated (mandatory login)
  React.useEffect(() => {
    if (!isLogged && !isLoading) {
      console.log("Home: User not logged in, redirecting to login (mandatory login)");
      router.replace("/(auth)/login");
    }
  }, [isLogged, isLoading]);

  // User data is now managed by GlobalProvider through API authentication

  // Function to get user activities (mock data for now)
  const getUserActivities = React.useCallback(async () => {
    try {
      // This would normally fetch from Firebase
      // For now, using mock data to demonstrate the structure
      const mockActivities = [
        {
          id: 1,
          type: 'price_check',
          description: 'Checked tomato prices at 3 markets',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          icon: 'eye',
          iconColor: '#49A760',
          metadata: {
            crop: 'tomato',
            markets: 3,
            priceRange: '₹40-60/kg'
          }
        },
        {
          id: 2,
          type: 'favorite_added',
          description: 'Added potato to favorites',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          icon: 'star',
          iconColor: '#FFD700',
          metadata: {
            crop: 'potato',
            market: 'Central Mandi'
          }
        },
        {
          id: 3,
          type: 'price_alert',
          description: 'Set price alert for onions',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          icon: 'notifications',
          iconColor: '#FF6B35',
          metadata: {
            crop: 'onions',
            targetPrice: '₹25/kg',
            market: 'Local Market'
          }
        },
        {
          id: 4,
          type: 'market_search',
          description: 'Searched for markets near Mumbai',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          icon: 'location',
          iconColor: '#4A90E2',
          metadata: {
            location: 'Mumbai',
            results: 12
          }
        },
        {
          id: 5,
          type: 'price_comparison',
          description: 'Compared wheat prices across 5 markets',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          icon: 'trending-up',
          iconColor: '#9C27B0',
          metadata: {
            crop: 'wheat',
            markets: 5,
            bestPrice: '₹22/kg'
          }
        }
      ];
      
      setUserActivities(mockActivities);
    } catch (error) {
      console.error("Error getting user activities:", error);
    }
  }, []);

  // Function to format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  // Function to get activity icon and color
  const getActivityIcon = (activity) => {
    return {
      name: activity.icon,
      color: activity.iconColor
    };
  };

  // Load user activities when component mounts
  useEffect(() => {
    if (isLogged && userRole === 'consumer') {
      getUserActivities();
    }
  }, [isLogged, userRole, getUserActivities]);

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
      title: "Price Map",
      description: "Today/Yesterday/Date Range prices with location pin & radius",
      icon: "map",
      route: "map",
      gradient: ["#FF9800", "#F57C00"],
      bgColor: "#fff8f0",
    },
    {
      id: 3,
      title: "Digital Thela",
      description: "Upcoming trading feature - Coming Soon",
      icon: "cart",
      route: "map", // Placeholder route for now
      gradient: ["#9C27B0", "#7B1FA2"],
      bgColor: "#f8f0ff",
    },
  ];

  // Quick actions for immediate user needs
  const quickActions = React.useMemo(() => {
    return [
      {
        title: "View Recent Prices",
        icon: "trending-up",
        action: () => router.push("map"),
      },
      {
        title: "Find Nearby Markets",
        icon: "location",
        action: () => router.push("map"),
      },
      {
        title: "Check Notifications",
        icon: "notifications",
        action: () => router.push("profile"),
      },
    ];
  }, []);

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
                    ? "Manage crops, explore prices, and prepare for digital trading"
                    : "Please login to access your account"
                  }
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>3</Text>
                    <Text style={styles.statLabel}>Core Features</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>24/7</Text>
                    <Text style={styles.statLabel}>Price Updates</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>Coming</Text>
                    <Text style={styles.statLabel}>Digital Thela</Text>
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

          {/* Consumer Dashboard - Role-Based Content */}
          {userRole === 'consumer' && (
            <View style={styles.consumerDashboardSection}>
              <Text style={styles.sectionTitle}>Consumer Dashboard</Text>
              
              {/* Role-Specific Quick Actions */}
              <View style={styles.roleQuickActionsContainer}>
                <TouchableOpacity style={styles.roleQuickActionCard}>
                  <View style={styles.roleQuickActionIcon}>
                    <Ionicons name="notifications" size={20} color="#FF6B35" />
                  </View>
                  <Text style={styles.roleQuickActionText}>Price Alerts</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.roleQuickActionCard}>
                  <View style={styles.roleQuickActionIcon}>
                    <Ionicons name="heart" size={20} color="#FF6B35" />
                  </View>
                  <Text style={styles.roleQuickActionText}>Favorites</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.roleQuickActionCard}>
                  <View style={styles.roleQuickActionIcon}>
                    <Ionicons name="calendar" size={20} color="#FF6B35" />
                  </View>
                  <Text style={styles.roleQuickActionText}>Shopping List</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Activity with Real Data */}
              <View style={styles.recentActivityContainer}>
                <Text style={styles.recentActivityTitle}>Recent Activity</Text>
                {userActivities.length > 0 ? (
                  userActivities.slice(0, 5).map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: getActivityIcon(activity).color + '20' }]}>
                        <Ionicons 
                          name={getActivityIcon(activity).name} 
                          size={16} 
                          color={getActivityIcon(activity).color} 
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityText}>{activity.description}</Text>
                        <Text style={styles.activityTime}>{formatTimestamp(activity.timestamp)}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noActivityContainer}>
                    <Ionicons name="information-circle" size={24} color="#999" />
                    <Text style={styles.noActivityText}>No recent activity</Text>
                    <Text style={styles.noActivitySubtext}>Start exploring prices to see your activity here</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Main Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitleMain}>Core Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    feature.title === "Digital Thela" && styles.comingSoonCard
                  ]}
                  onPress={feature.title === "Digital Thela" ? null : () => router.push(feature.route)}
                  disabled={feature.title === "Digital Thela"}
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
                  {feature.title === "Digital Thela" ? (
                    <View style={styles.comingSoonButton}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  ) : (
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
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default home;