import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobal } from "@/context/global-provider";
import { useNavigation } from "@react-navigation/native";
import OfflineIndicator from "@/components/OfflineIndicator";
import { useOrientation } from "@/utils/orientationUtils";
import { createHomeStyles } from "@/utils/responsiveStyles";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "@/hooks/useTranslation";

// ---------- Types ----------

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string | null;
  gradient: string[];
  bgColor: string;
  isEnabled: boolean;
  comingSoon?: boolean;
  isLocked?: boolean;
  lockedMessage?: string;
}

interface QuickAction {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  testID: string;
}


// ---------- Constants ----------

// Function to get features with translations
const getFeatures = (t: any): Feature[] => [
  {
    id: 1,
    title: t.home.addCropData,
    description: t.home.addCropDataDesc,
    icon: "add-circle",
    route: "crops",
    gradient: ["#49A760", "#3d8b4f"],
    bgColor: "#f0f9f1",
    isEnabled: true,
  },
  {
    id: 2,
    title: t.home.reportDamage,
    description: t.home.reportDamageDesc,
    icon: "warning",
    route: "damage-crop",
    gradient: ["#FF6B6B", "#E63946"],
    bgColor: "#fff0f0",
    isEnabled: true,
  },
  {
    id: 3,
    title: t.home.digitalThela,
    description: t.home.digitalThelaDesc,
    icon: "cart",
    route: "digital-thela",
    gradient: ["#9C27B0", "#7B1FA2"],
    bgColor: "#f8f0ff",
    isEnabled: true,
  },
  {
    id: 4,
    title: t.home.priceMap,
    description: t.home.priceMapDesc,
    icon: "map",
    route: "map",
    gradient: ["#FF9800", "#F57C00"],
    bgColor: "#fff8f0",
    isEnabled: true,
  },
];

// ---------- Hooks ----------

const useNetworkStatus = (): boolean => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};

// ---------- Component ----------

const Home: React.FC = React.memo(() => {
  // Context
  const { mainUser, userRole } = useGlobal();
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Hooks
  const isConnected = useNetworkStatus();
  const { isLandscape, width } = useOrientation() as unknown as {
    isLandscape: boolean;
    width: number;
    height: number;
    screenData: { width: number; height: number };
    breakpoints: Record<string, boolean>;
  };
  const styles = useMemo(
    () => createHomeStyles(isLandscape, width),
    [isLandscape, width]
  );

  // Get features with translations (mark Digital Thela as locked for consumers)
  const FEATURES = useMemo(() => {
    const allFeatures = getFeatures(t);
    if (userRole === 'consumer') {
      // Mark Digital Thela as locked for consumers - it's only for farmers and retailers
      return allFeatures.map(feature => {
        if (feature.route === 'digital-thela') {
          return {
            ...feature,
            isLocked: true,
            lockedMessage: t.home.digitalThelaLocked || "Only for Farmers & Retailers",
          };
        }
        return feature;
      });
    }
    return allFeatures;
  }, [t, userRole]);

  // Navigation handler
  const handleNavigation = useCallback(
    (route: string | null, params: Record<string, string | number> = {}) => {
      try {
        if (!route) {
          Alert.alert(t.home.featureUnavailable, t.home.featureUnavailableMessage);
          return;
        }

        // Map route names to React Navigation screen names
        const routeMap: Record<string, string> = {
          'crops': 'Crops',
          'damage-crop': 'damage-crop',
          'digital-thela': 'digital-thela',
          'map': 'Map',
          'stats': 'Stats',
          'profile': 'Profile',
        };

        const screenName = routeMap[route] || route;
        navigation.navigate(screenName as any, params);
      } catch (error) {
        console.error("Navigation error:", error);
        Alert.alert(t.common.error, "Unable to navigate. Please try again.");
      }
    },
    [navigation, t]
  );

  // Feature press handler
  const handleFeaturePress = useCallback(
    (feature: Feature) => {
      if (!feature.isEnabled) {
        Alert.alert(
          t.common.comingSoon,
          `${feature.title} is currently under development. Stay tuned for updates!`,
          [{ text: t.common.ok }]
        );
        return;
      }

      if (feature.isLocked) {
        Alert.alert(
          t.home.featureRestricted || "Feature Restricted",
          feature.lockedMessage || "This feature is not available for your account type.",
          [{ text: t.common.ok }]
        );
        return;
      }

      handleNavigation(feature.route);
    },
    [handleNavigation, t]
  );

  // Quick actions
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        title: t.home.viewRecentPrices,
        icon: "trending-up",
        action: () => handleNavigation("map"),
        testID: "quick-action-recent-prices",
      },
      {
        title: t.home.findNearbyMarkets,
        icon: "location",
        action: () => handleNavigation("map"),
        testID: "quick-action-nearby-markets",
      },
      // {
      //   title: "Check Notifications",
      //   icon: "notifications",
      //   action: () => handleNavigation("profile"),
      //   testID: "quick-action-notifications",
      // },
    ],
    [handleNavigation, t]
  );

  // Render feature card
  const renderFeatureCard = useCallback(
    (feature: Feature) => (
      <TouchableOpacity
        key={feature.id}
        style={[
          styles.featureCard,
          !feature.isEnabled && styles.comingSoonCard,
          feature.isLocked && { opacity: 0.7 },
        ]}
        onPress={() => handleFeaturePress(feature)}
        disabled={!feature.isEnabled}
        testID={`feature-card-${feature.id}`}
        accessibilityLabel={`${feature.title}: ${feature.description}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !feature.isEnabled || feature.isLocked }}
      >
        {/* Lock overlay for restricted features */}
        {feature.isLocked && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 12,
            padding: 4,
            zIndex: 10,
          }}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
          </View>
        )}

        <View style={styles.featureContent}>
          <View
            style={[
              styles.featureIconContainer,
              { backgroundColor: feature.bgColor },
              feature.isLocked && { opacity: 0.5 },
            ]}
          >
            <Ionicons
              name={feature.icon}
              size={32}
              color={feature.isEnabled && !feature.isLocked ? feature.gradient[0] : "#BDBDBD"}
            />
          </View>
          <Text
            style={[
              styles.featureTitle,
              (!feature.isEnabled || feature.isLocked) && { color: "#BDBDBD" },
            ]}
          >
            {feature.title}
          </Text>
          <Text
            style={[
              styles.featureDescription,
              (!feature.isEnabled || feature.isLocked) && { color: "#BDBDBD" },
            ]}
          >
            {feature.description}
          </Text>
        </View>

        {feature.comingSoon ? (
          <View style={styles.comingSoonButton}>
            <Text style={styles.comingSoonText}>{t.common.comingSoon}</Text>
          </View>
        ) : feature.isLocked ? (
          <View style={[styles.comingSoonButton, { backgroundColor: '#e0e0e0' }]}>
            <Ionicons name="lock-closed" size={14} color="#666" style={{ marginRight: 4 }} />
            <Text style={[styles.comingSoonText, { color: '#666' }]}>
              {feature.lockedMessage || "Locked"}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => handleFeaturePress(feature)}
            testID={`feature-button-${feature.id}`}
          >
            <LinearGradient
              colors={feature.gradient as [string, string]}
              style={styles.featureButtonGradient}
            >
              <Text style={styles.featureButtonText}>{t.home.explore}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    ),
    [styles, handleFeaturePress, t]
  );

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <LinearGradient
        colors={["#f8fffe", "#eafbe7"] as const}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="home-scroll-view"
        >

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitleMain} testID="features-title">
              {t.home.coreFeatures}
            </Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map(renderFeatureCard)}
            </View>
          </View>

          {/* Quick Actions */}
          {/* <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle} testID="quick-actions-title">
              {t.home.quickActions}
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
          </View> */}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
});

Home.displayName = "Home";

export default Home;
