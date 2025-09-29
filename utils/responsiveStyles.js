/**
 * Responsive Styles Utility
 * Provides utilities for creating responsive styles based on screen dimensions
 */

import { StyleSheet, Dimensions } from "react-native";
import { createResponsiveStyles, getResponsiveValue } from "../theme";

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Check if device is in landscape mode
export const isLandscape = () => screenWidth > screenHeight;

// Get responsive dimensions
export const getResponsiveDimensions = () => ({
  width: screenWidth,
  height: screenHeight,
  isLandscape: isLandscape(),
  isTablet: screenWidth >= 768,
  isDesktop: screenWidth >= 992,
});

// Create responsive styles with orientation support
export const createOrientationStyles = (styleCreator) => {
  return (isLandscape, screenWidth) => {
    const responsiveProps = {
      isLandscape,
      screenWidth,
      screenHeight,
      isTablet: screenWidth >= 768,
      isDesktop: screenWidth >= 992,
    };

    return StyleSheet.create(styleCreator(responsiveProps));
  };
};

// Common responsive patterns
export const responsivePatterns = {
  // Grid columns based on screen size
  getGridColumns: (screenWidth) => {
    if (screenWidth >= 992) return 3; // Desktop
    if (screenWidth >= 768) return 2; // Tablet
    return 1; // Mobile
  },

  // Card width based on screen size
  getCardWidth: (screenWidth, isLandscape) => {
    if (isLandscape) {
      return screenWidth >= 992 ? "30%" : "45%";
    }
    return screenWidth >= 768 ? "45%" : "100%";
  },

  // Font size scaling
  getScaledFontSize: (baseSize, screenWidth) => {
    const scale = Math.min(screenWidth / 375, 1.2); // Scale based on iPhone width
    return Math.round(baseSize * scale);
  },

  // Padding scaling
  getScaledPadding: (basePadding, screenWidth) => {
    const scale = Math.min(screenWidth / 375, 1.1);
    return Math.round(basePadding * scale);
  },
};

// Pre-built responsive style creators
export const createHomeStyles = createOrientationStyles(
  ({ isLandscape, screenWidth }) => ({
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
      paddingBottom: 100,
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
    statsContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginTop: 20,
      // marginHorizontal: 20,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      // shadowRadius: 12,
      // elevation: 6,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 26,
      fontWeight: "800",
      color: "#ffffff",
      marginBottom: 6,
      textShadowColor: "rgba(0, 0, 0, 0.4)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    statLabel: {
      fontSize: 13,
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "500",
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    statDivider: {
      width: 2,
      height: 45,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      marginHorizontal: 8,
      borderRadius: 1,
    },
    quickActionsSection: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#2E7D32",
      marginBottom: 16,
      textAlign: "center",
    },
    quickActionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      columnGap: 12,
      rowGap: 12,
    },
    quickActionCard: {
      width: isLandscape || screenWidth >= 768 ? "32%" : "48%",
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      alignItems: "center",
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#2E7D32",
      textAlign: "center",
    },
    consumerDashboardSection: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    roleQuickActionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      columnGap: 12,
      rowGap: 12,
      marginBottom: 16,
    },
    roleQuickActionCard: {
      width: isLandscape || screenWidth >= 768 ? "32%" : "48%",
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      alignItems: "center",
    },
    roleQuickActionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    roleQuickActionText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#2E7D32",
      textAlign: "center",
    },
    recentActivityContainer: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    recentActivityTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#2E7D32",
      marginBottom: 12,
    },
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    activityIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    activityContent: {
      flex: 1,
    },
    activityText: {
      fontSize: 14,
      color: "#333",
      marginBottom: 2,
    },
    activityTime: {
      fontSize: 12,
      color: "#666",
    },
    noActivityContainer: {
      alignItems: "center",
      paddingVertical: 36,
    },
    noActivityText: {
      fontSize: 16,
      color: "#666",
      marginTop: 10,
      marginBottom: 4,
    },
    noActivitySubtext: {
      fontSize: 14,
      color: "#999",
      textAlign: "center",
    },
    featuresSection: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    sectionTitleMain: {
      fontSize: 24,
      fontWeight: "700",
      color: "#2E7D32",
      marginBottom: 16,
      textAlign: "center",
    },
    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      columnGap: 12,
      rowGap: 12,
    },
    featureCard: {
      width: isLandscape || screenWidth >= 992 ? "32%" : "48%",
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      alignItems: "center",
    },
    comingSoonCard: {
      opacity: 0.7,
    },
    featureIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#2E7D32",
      marginBottom: 6,
      textAlign: "center",
    },
    featureDescription: {
      fontSize: 13,
      color: "#666",
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 12,
    },
    featureButton: {
      borderRadius: 10,
      overflow: "hidden",
      width: "100%",
    },
    featureButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 18,
      gap: 6,
    },
    featureButtonText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
    },
    comingSoonButton: {
      backgroundColor: "#f0f0f0",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 10,
    },
    comingSoonText: {
      color: "#666",
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
  })
);

export const createCropsStyles = createOrientationStyles(
  ({ isLandscape, screenWidth }) => ({
    container: {
      flex: 1,
      backgroundColor: "#f8fffe",
    },
    gradient: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    headerSection: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 24,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    headerGradient: {
      padding: isLandscape ? 20 : 24,
      alignItems: "center",
    },
    headerContent: {
      alignItems: "center",
    },
    headerTitle: {
      fontSize: isLandscape ? 20 : 24,
      fontWeight: "800",
      color: "#fff",
      marginTop: 12,
      marginBottom: 8,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: isLandscape ? 12 : 14,
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      lineHeight: 20,
    },
    formContainer: {
      paddingHorizontal: 20,
      gap: 20,
    },
    inputRow: {
      flexDirection: isLandscape ? "row" : "column",
      gap: isLandscape ? 16 : 20,
    },
    inputHalf: {
      flex: isLandscape ? 1 : undefined,
      width: isLandscape ? "48%" : "100%",
    },
    buttonRow: {
      flexDirection: isLandscape ? "row" : "column",
      gap: isLandscape ? 16 : 20,
      marginTop: 20,
    },
    buttonHalf: {
      flex: isLandscape ? 1 : undefined,
      width: isLandscape ? "48%" : "100%",
    },
    cameraContainer: {
      flex: 1,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: "#000",
    },
    cameraView: {
      flex: 1,
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    removeImageButton: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: 20,
      padding: 8,
    },
    submitButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 20,
    },
    submitButtonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    formCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#2E7D32",
      marginBottom: 20,
      textAlign: "center",
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: "#2E7D32",
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: "#fff",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      borderRadius: 12,
      backgroundColor: "#fff",
    },
    picker: {
      height: 50,
    },
    imageSection: {
      marginBottom: 20,
    },
    imageSubtext: {
      fontSize: 14,
      color: "#666",
      marginBottom: 12,
    },
    imageButtons: {
      flexDirection: isLandscape ? "row" : "column",
      gap: 12,
      marginBottom: 16,
    },
    imageButton: {
      flex: isLandscape ? 1 : undefined,
      backgroundColor: "#f0f9f1",
      borderWidth: 2,
      borderColor: "#49A760",
      borderStyle: "dashed",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 60,
    },
    imageButtonText: {
      color: "#49A760",
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
    },
    imagePreview: {
      position: "relative",
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 12,
    },
    previewImage: {
      width: "100%",
      height: 200,
      resizeMode: "cover",
    },
    submitGradient: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    cameraHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 1,
    },
    cameraCloseButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      padding: 8,
    },
    cameraTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    camera: {
      flex: 1,
    },
    cameraControls: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: 20,
      alignItems: "center",
      zIndex: 1,
    },
    captureButton: {
      backgroundColor: "#49A760",
      borderRadius: 40,
      width: 80,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
    },
  })
);

export const createStatsStyles = createOrientationStyles(
  ({ isLandscape, screenWidth }) => ({
    container: {
      flex: 1,
      backgroundColor: "#f8fffe",
    },
    gradient: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 24,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    headerGradient: {
      padding: 24,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: "#fff",
      marginTop: 12,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      lineHeight: 20,
    },
    sectionCard: {
      backgroundColor: "#fff",
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
      overflow: "hidden",
    },
    sectionHeader: {
      marginBottom: 20,
    },
    sectionHeaderGradient: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
      marginLeft: 12,
    },
    selectorContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    selectorLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1F4E3D",
      marginBottom: 12,
    },
    pickerContainer: {
      backgroundColor: "#f8f9fa",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#e9ecef",
      overflow: "hidden",
    },
    selectedCropDisplay: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    cropIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    selectedCropText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1F4E3D",
      flex: 1,
    },
    picker: {
      height: 50,
      color: "#1F4E3D",
    },
    pickerItem: {
      fontSize: 14,
    },
    chartWrapper: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    toggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#e9ecef",
      gap: 8,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#49A760",
    },
    chartStats: {
      flexDirection: "row",
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      justifyContent: "space-around",
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1F4E3D",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: "#666",
      fontWeight: "500",
    },
    chartScrollContainer: {
      paddingRight: 20,
    },
    chartContainer: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: isLandscape ? 20 : 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
      minHeight: isLandscape ? 320 : 280,
    },
    xAxisLabel: {
      color: "#666",
      fontSize: 11,
      fontWeight: "500",
    },
    yAxisLabel: {
      color: "#666",
      fontSize: 12,
      fontWeight: "500",
    },
    noDataContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: "#f8f9fa",
      borderRadius: 16,
      marginHorizontal: 20,
    },
    noDataText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#666",
      marginTop: 16,
      textAlign: "center",
    },
    noDataSubtext: {
      fontSize: 12,
      color: "#999",
      marginTop: 8,
      textAlign: "center",
    },
    marketAnalyticsContainer: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: "#f0f0f0",
    },
    marketAnalyticsTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1F4E3D",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    primaryStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: isLandscape ? 16 : 12,
      flexWrap: isLandscape ? "nowrap" : "wrap",
    },
    primaryStatItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e9ecef",
      minHeight: 80,
    },
    primaryStatValue: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1F4E3D",
      marginTop: 8,
      marginBottom: 4,
    },
    primaryStatLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: "#666",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    secondaryStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: isLandscape ? 12 : 8,
      flexWrap: isLandscape ? "nowrap" : "wrap",
    },
    secondaryStatItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#e9ecef",
      minHeight: 60,
    },
    secondaryStatValue: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F4E3D",
      marginTop: 6,
      marginBottom: 2,
    },
    secondaryStatLabel: {
      fontSize: 9,
      fontWeight: "600",
      color: "#666",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    todayPricesSection: {
      backgroundColor: "#f0f9ff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: "#49A760",
      borderStyle: "dashed",
    },
    todayPricesTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#49A760",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    todayPricesRow: {
      flexDirection: isLandscape ? "row" : "row",
      justifyContent: "space-between",
      gap: isLandscape ? 20 : 16,
      flexWrap: isLandscape ? "nowrap" : "wrap",
    },
    todayPriceItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    todayPriceValue: {
      fontSize: 20,
      fontWeight: "800",
      color: "#1F4E3D",
      marginTop: 8,
      marginBottom: 4,
    },
    todayPriceLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: "#49A760",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    todayPriceCount: {
      fontSize: 9,
      color: "#666",
      textAlign: "center",
      fontStyle: "italic",
    },
    todayAverageRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
      gap: 8,
    },
    todayAverageText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FF9800",
      textAlign: "center",
    },
    overallStatsTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F4E3D",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  })
);

export const createProfileStyles = createOrientationStyles(
  ({ isLandscape, screenWidth, isTablet }) => ({
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
      paddingBottom: 30,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },

    loadingText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#49A760",
      marginBottom: 8,
    },

    loadingSubText: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
    },

    // Header Section
    headerSection: {
      alignItems: "center",
      paddingTop: 20,
      paddingBottom: 30,
      paddingHorizontal: 20,
    },

    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },

    avatarGradient: {
      width: isLandscape || screenWidth >= 768 ? 120 : 100,
      height: isTablet ? 120 : 100,
      borderRadius: isTablet ? 60 : 50,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#49A760",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },

    avatarText: {
      fontSize: isLandscape || screenWidth >= 768 ? 42 : 36,
      fontWeight: "bold",
      color: "white",
    },

    onlineIndicator: {
      position: "absolute",
      bottom: 5,
      right: 5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#4CAF50",
      borderWidth: 3,
      borderColor: "white",
    },

    userName: {
      fontSize: isLandscape || screenWidth >= 768 ? 28 : 24,
      fontWeight: "bold",
      color: "#2C3E50",
      marginBottom: 4,
      textAlign: "center",
    },

    userRole: {
      fontSize: isLandscape || screenWidth >= 768 ? 18 : 16,
      color: "#7F8C8D",
      marginBottom: 12,
    },

    badgeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },

    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E8F5E8",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    badgeText: {
      fontSize: 12,
      color: "#49A760",
      fontWeight: "600",
      marginLeft: 4,
    },

    // Profile Cards
    profileCard: {
      backgroundColor: "white",
      marginHorizontal: isLandscape || screenWidth >= 768 ? 30 : 20,
      marginBottom: 20,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      overflow: "hidden",
    },

    cardHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#F5F5F5",
    },

    cardTitle: {
      fontSize: isLandscape || screenWidth >= 768 ? 20 : 18,
      fontWeight: "bold",
      color: "#2C3E50",
      marginBottom: 4,
    },

    cardSubtitle: {
      fontSize: 14,
      color: "#7F8C8D",
    },

    editButton: {
      position: "absolute",
      right: 20,
      top: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F0F9F0",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    editButtonText: {
      fontSize: 14,
      color: "#49A760",
      fontWeight: "600",
      marginLeft: 4,
    },

    fieldsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },

    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#F8F9FA",
    },

    fieldIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#F8F9FA",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },

    iconText: {
      fontSize: 18,
    },

    fieldContent: {
      flex: 1,
    },

    fieldLabel: {
      fontSize: 14,
      color: "#7F8C8D",
      marginBottom: 4,
    },

    fieldValue: {
      fontSize: 16,
      color: "#2C3E50",
      fontWeight: "500",
    },

    comingSoonBadge: {
      backgroundColor: "#FFF3CD",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    comingSoonText: {
      fontSize: 12,
      color: "#856404",
      fontWeight: "500",
    },

    // Statistics
    statsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 20,
      paddingBottom: 20,
      justifyContent: "space-between",
    },

    statItem: {
      width: isLandscape ? "22%" : "45%",
      alignItems: "center",
      backgroundColor: "#FAFBFC",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },

    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },

    statNumber: {
      fontSize: isLandscape || screenWidth >= 768 ? 24 : 20,
      fontWeight: "bold",
      color: "#2C3E50",
      marginBottom: 4,
    },

    statLabel: {
      fontSize: 12,
      color: "#7F8C8D",
      textAlign: "center",
    },

    // Action Buttons
    actionsContainer: {
      flexDirection: isLandscape ? "row" : "column",
      paddingHorizontal: isLandscape || screenWidth >= 768 ? 30 : 20,
      marginBottom: 20,
      gap: 12,
    },

    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "white",
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#49A760",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    secondaryButtonText: {
      fontSize: 16,
      color: "#49A760",
      fontWeight: "600",
      marginLeft: 8,
    },

    logoutButton: {
      borderRadius: 12,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    logoutGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },

    logoutButtonText: {
      fontSize: 16,
      color: "white",
      fontWeight: "600",
      marginLeft: 8,
    },

    // About Section
    aboutSection: {
      paddingHorizontal: isLandscape || screenWidth >= 768 ? 30 : 20,
      alignItems: "center",
    },

    aboutButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "white",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 25,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    aboutButtonText: {
      fontSize: 14,
      color: "#49A760",
      fontWeight: "500",
      marginLeft: 8,
      marginRight: 8,
    },

    versionText: {
      fontSize: 12,
      color: "#BDC3C7",
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },

    modalContent: {
      backgroundColor: "white",
      maxHeight: screenHeight * 0.9,
      minHeight: screenHeight * 0.5,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 16,
    },

    bottomSheetStyle: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 20,
    },

    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: "#E0E0E0",
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 20,
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#F5F5F5",
    },

    modalTitle: {
      fontSize: isLandscape || screenWidth >= 768 ? 22 : 20,
      fontWeight: "bold",
      color: "#2C3E50",
    },

    closeButton: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: "#F5F5F5",
    },

    modalList: {
      flex: 1,
      paddingHorizontal: 24,
      maxHeight: screenHeight * 0.7,
    },

    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginVertical: 4,
      backgroundColor: "#FAFBFC",
    },

    selectedModalItem: {
      backgroundColor: "#E8F5E8",
      borderWidth: 2,
      borderColor: "#49A760",
    },

    modalItemIcon: {
      fontSize: 24,
      marginRight: 16,
    },

    modalItemContent: {
      flex: 1,
    },

    modalItemText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#2C3E50",
      marginBottom: 4,
    },

    selectedModalItemText: {
      color: "#49A760",
    },

    modalItemDescription: {
      fontSize: 14,
      color: "#7F8C8D",
      lineHeight: 20,
    },

    // Error Screens
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      backgroundColor: "#f8fffe",
    },

    errorCard: {
      backgroundColor: "white",
      padding: 40,
      borderRadius: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      maxWidth: 400,
      width: "100%",
    },

    errorIcon: {
      fontSize: 64,
      marginBottom: 20,
    },

    errorTitle: {
      fontSize: isLandscape || screenWidth >= 768 ? 24 : 20,
      fontWeight: "bold",
      color: "#2C3E50",
      marginBottom: 12,
      textAlign: "center",
    },

    errorMessage: {
      fontSize: 16,
      color: "#7F8C8D",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 32,
    },

    loginButton: {
      borderRadius: 12,
      overflow: "hidden",
      width: "100%",
    },

    loginButtonGradient: {
      paddingVertical: 16,
      alignItems: "center",
    },

    loginButtonText: {
      fontSize: 16,
      color: "white",
      fontWeight: "600",
    },

    // Responsive adjustments
    ...(isLandscape ||
      (screenWidth >= 768 && {
        scrollContent: {
          paddingHorizontal: 40,
          paddingBottom: 50,
        },

        headerSection: {
          paddingTop: 40,
          paddingBottom: 50,
        },

        profileCard: {
          marginHorizontal: 0,
          marginBottom: 30,
        },

        actionsContainer: {
          paddingHorizontal: 0,
          marginBottom: 30,
        },

        aboutSection: {
          paddingHorizontal: 0,
        },
      })),

    // Landscape specific styles
    ...(isLandscape && {
      headerSection: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 40,
      },

      avatarContainer: {
        marginRight: 30,
        marginBottom: 0,
      },

      userInfo: {
        flex: 1,
        alignItems: "flex-start",
      },

      statsContainer: {
        justifyContent: "space-around",
      },

      statItem: {
        width: "22%",
      },
    }),
  })
);

export default {
  isLandscape,
  getResponsiveDimensions,
  createOrientationStyles,
  responsivePatterns,
  createHomeStyles,
  createStatsStyles,
  createProfileStyles,
  createCropsStyles,
};
