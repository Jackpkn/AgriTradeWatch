import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import React, { useContext, useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "@/context/GlobalProvider";
import { router } from "expo-router";
// API IMPORTS
import { authService } from "@/services";
import Icon from "react-native-vector-icons/Ionicons";
import { USER_TYPES, LOCATION_OPTIONS } from "@/constants/authConstants";
import { useOrientation } from "@/utils/orientationUtils";
import { handleError, ERROR_CONTEXT } from "@/utils/errorHandler";
import { createProfileStyles } from "@/utils/responsiveStyles";

const profile = () => {
  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    handleError(error, ERROR_CONTEXT.PROFILE, { showAlert: false });
    contextValue = {};
  }

  const { setIsLoading = () => {}, isLoading = false } = contextValue || {};

  const [user, setUser] = useState(null);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState("Farmer");
  const [selectedLocation, setSelectedLocation] = useState("Auto-detect Current");
  const [showNotifications, setShowNotifications] = useState(true);
  const [showPriceAlerts, setShowPriceAlerts] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const [autoLocation, setAutoLocation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Use orientation hook
  const { screenData, isLandscape, width, breakpoints } = useOrientation();

  // Create responsive styles
  const styles = useMemo(() => createProfileStyles(isLandscape, width), [isLandscape, width]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // API GET USER DATA
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Set preferences from user data
          if (currentUser.job) setSelectedUserType(currentUser.job);
          if (currentUser.locationMethod) setSelectedLocation(currentUser.locationMethod);
        }
      } catch (error) {
        handleError(error, ERROR_CONTEXT.PROFILE, { 
          showAlert: false,
          customMessage: "Failed to load user data"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);
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
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to open About Us page"
      });
    }
  };
  const handleLogout = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      // API LOGOUT
      await authService.logout();
      
      router.replace("/");
      console.log("User has been logged out successfully");
    } catch (error) {
      handleError(error, ERROR_CONTEXT.AUTH, { 
        showAlert: true,
        customMessage: "Failed to logout. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const handleLanguageChange = async (language) => {
    setSelectedLanguage(language);
    try {
      // Save language preference to user profile
      await authService.updateUserProfile({ language });
      Alert.alert("Language Changed", `${language} will be applied to the app.`);
    } catch (error) {
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to save language preference. Please try again."
      });
    }
  };

  const handleUserTypeChange = async (userType) => {
    setSelectedUserType(userType);
    try {
      // Update user type in database
      await authService.updateUserProfile({ job: userType });
      Alert.alert("User Type Updated", `Your profile has been updated to ${userType}.`);
    } catch (error) {
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to update user type. Please try again."
      });
    }
  };

  const handleLocationChange = async (location) => {
    setSelectedLocation(location);
    try {
      // Update location preference in database
      await authService.updateUserProfile({ locationMethod: location });
      Alert.alert("Location Updated", `Location preference updated to ${location}.`);
    } catch (error) {
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to update location preference. Please try again."
      });
    }
  };

  const profileFields = [
    { label: "Full Name", value: user?.name, icon: "👤" },
    { label: "Email Address", value: user?.email, icon: "📧" },
    { label: "Username", value: user?.username, icon: "@" },
    { label: "User Type", value: selectedUserType, icon: "👥" },
    { label: "Phone Number", value: user?.phoneNumber, icon: "📱" },
    { label: "Location", value: user?.location || "Not set", icon: "📍" },
    { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A", icon: "📅" },
    { label: "Last Active", value: "Today", icon: "🔄" },
  ];

  const preferenceFields = [
    { 
      label: "Language", 
      value: "Coming Soon", 
      icon: "🌐", 
      onPress: () => Alert.alert("Coming Soon", "Language selection will be available in the next update!"),
      editable: false 
    },
    { 
      label: "User Type", 
      value: selectedUserType, 
      icon: "👥", 
      onPress: () => setShowUserTypeModal(true),
      editable: true 
    },
    { 
      label: "Location Method", 
      value: selectedLocation, 
      icon: "📍", 
      onPress: () => setShowLocationModal(true),
      editable: true 
    },
    // { 
    //   label: "Notifications", 
    //   value: showNotifications ? "Enabled" : "Disabled", 
    //   icon: "🔔", 
    //   onPress: () => setShowNotifications(!showNotifications),
    //   editable: true,
    //   isToggle: true
    // },
    // { 
    //   label: "Price Alerts", 
    //   value: showPriceAlerts ? "Enabled" : "Disabled", 
    //   icon: "💰", 
    //   onPress: () => setShowPriceAlerts(!showPriceAlerts),
    //   editable: true,
    //   isToggle: true
    // },
  ];

  // Show loading while fetching user data
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#f8fffe", "#eafbe7"]}
          style={styles.gradientBackground}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#49A760" style={{ marginBottom: 18 }} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return user ? (
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
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {user.name ? user.name[0].toUpperCase() : "?"}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.job}</Text>
          </View>

          {/* Profile Information Card */}
          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Profile Information</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldsContainer}>
              {profileFields.map((field, index) => (
                <View key={index} style={styles.fieldRow}>
                  <View style={styles.fieldIcon}>
                    <Text style={styles.iconText}>{field.icon}</Text>
                  </View>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue} numberOfLines={1}>
                      {field.value || "Not provided"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Preferences Card */}
          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Preferences</Text>
              <Text style={styles.cardSubtitle}>Customize your experience</Text>
            </View>

            <View style={styles.fieldsContainer}>
              {preferenceFields.map((field, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.fieldRow}
                  onPress={field.onPress}
                  disabled={!field.editable}
                >
                  <View style={styles.fieldIcon}>
                    <Text style={styles.iconText}>{field.icon}</Text>
                  </View>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue} numberOfLines={1}>
                      {field.value || "Not set"}
                    </Text>
                  </View>
                  {field.editable && field.isToggle ? (
                    <View style={[
                      styles.toggleSwitch,
                      { backgroundColor: field.value === "Enabled" ? "#49A760" : "#ddd" }
                    ]}>
                      <View style={[
                        styles.toggleCircle,
                        { transform: [{ translateX: field.value === "Enabled" ? 18 : 0 }] }
                      ]} />
                    </View>
                  ) : field.editable ? (
                    <Icon name="chevron-forward" size={20} color="#49A760" />
                  ) : (
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Statistics Card */}
          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Activity</Text>
              <Text style={styles.cardSubtitle}>Your MandiGo journey</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Icon name="eye" size={24} color="#49A760" />
                </View>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Price Checks</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Icon name="star" size={24} color="#FFD700" />
                </View>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Icon name="notifications" size={24} color="#FF6B35" />
                </View>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Alerts Set</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Icon name="trending-up" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Markets Visited</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={["#ff4757", "#ff3742"]}
                style={styles.logoutGradient}
              >
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* About Us Section */}
          <View style={styles.aboutSection}>
            <TouchableOpacity 
              style={styles.aboutButton}
              onPress={handleAboutUsPress}
            >
              <Icon name="information-circle" size={20} color="#49A760" />
              <Text style={styles.aboutButtonText}>About Us</Text>
              <Icon name="chevron-forward" size={16} color="#49A760" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>



      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.bottomSheetStyle]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User Type</Text>
              <TouchableOpacity onPress={() => setShowUserTypeModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {USER_TYPES.map((userType) => (
                <TouchableOpacity
                  key={userType.id}
                  style={[
                    styles.modalItem,
                    selectedUserType === userType.name && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleUserTypeChange(userType.name);
                    setShowUserTypeModal(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{userType.icon}</Text>
                  <View style={styles.modalItemContent}>
                    <Text style={[
                      styles.modalItemText,
                      selectedUserType === userType.name && styles.selectedModalItemText
                    ]}>
                      {userType.name}
                    </Text>
                    <Text style={styles.modalItemDescription}>
                      {userType.description}
                    </Text>
                  </View>
                  {selectedUserType === userType.name && (
                    <Icon name="checkmark" size={20} color="#49A760" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.bottomSheetStyle]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location Method</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {LOCATION_OPTIONS.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.modalItem,
                    selectedLocation === location.name && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleLocationChange(location.name);
                    setShowLocationModal(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{location.icon}</Text>
                  <View style={styles.modalItemContent}>
                    <Text style={[
                      styles.modalItemText,
                      selectedLocation === location.name && styles.selectedModalItemText
                    ]}>
                      {location.name}
                    </Text>
                    <Text style={styles.modalItemDescription}>
                      {location.description}
                    </Text>
                  </View>
                  {selectedLocation === location.name && (
                    <Icon name="checkmark" size={20} color="#49A760" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
     

     
    </SafeAreaView>
  ) : (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Text style={styles.errorIcon}>🚫</Text>
        <Text style={styles.errorTitle}>No Profile Found</Text>
        <Text style={styles.errorMessage}>
          Please sign in to view your profile information
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default profile;
