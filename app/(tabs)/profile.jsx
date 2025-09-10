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
  RefreshControl,
  ImageBackground,
} from "react-native";
import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
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

// Custom hooks
const useUserData = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = authService.getCurrentUser();
      if (currentUser && isMountedRef.current) {
        setUser(currentUser);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        handleError(err, ERROR_CONTEXT.PROFILE, { 
          showAlert: false,
          customMessage: "Failed to load user data"
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchUserData]);

  return { user, loading, error, refetch: fetchUserData };
};

const useUserPreferences = (user) => {
  const [selectedUserType, setSelectedUserType] = useState("Farmer");
  const [selectedLocation, setSelectedLocation] = useState("Auto-detect Current");

  useEffect(() => {
    if (user) {
      if (user.job) setSelectedUserType(user.job);
      if (user.locationMethod) setSelectedLocation(user.locationMethod);
    }
  }, [user]);

  return {
    selectedUserType,
    setSelectedUserType,
    selectedLocation,
    setSelectedLocation,
  };
};

// Components
const ProfileHeader = React.memo(({ user, styles }) => (
  <View style={styles.headerSection}>
    <View style={styles.avatarContainer}>
      <LinearGradient
        colors={["#49A760", "#3d8b4f"]}
        style={styles.avatarGradient}
      >
        <Text style={styles.avatarText}>
          {user?.name ? user.name[0].toUpperCase() : "?"}
        </Text>
      </LinearGradient>
      <View style={styles.onlineIndicator} />
    </View>
    <Text style={styles.userName}>{user?.name || "Unknown User"}</Text>
    <Text style={styles.userRole}>{user?.job || "User"}</Text>
    <View style={styles.badgeContainer}>
      <View style={styles.verifiedBadge}>
        <Icon name="checkmark-circle" size={16} color="#49A760" />
        <Text style={styles.badgeText}>Verified</Text>
      </View>
    </View>
  </View>
));

const ProfileField = React.memo(({ field, styles }) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldIcon}>
      <Text style={styles.iconText}>{field.icon}</Text>
    </View>
    <View style={styles.fieldContent}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <Text style={styles.fieldValue} numberOfLines={2}>
        {field.value || "Not provided"}
      </Text>
    </View>
  </View>
));

const PreferenceField = React.memo(({ field, styles }) => (
  <TouchableOpacity 
    style={styles.fieldRow}
    onPress={field.onPress}
    disabled={!field.editable}
    activeOpacity={0.7}
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
    {field.editable ? (
      <Icon name="chevron-forward" size={20} color="#49A760" />
    ) : (
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>Soon</Text>
      </View>
    )}
  </TouchableOpacity>
));

const StatisticsCard = React.memo(({ styles }) => {
  const stats = [
    { icon: "eye", value: "24", label: "Price Checks", color: "#49A760" },
    { icon: "star", value: "8", label: "Favorites", color: "#FFD700" },
    { icon: "notifications", value: "5", label: "Alerts Set", color: "#FF6B35" },
    { icon: "trending-up", value: "12", label: "Markets", color: "#9C27B0" },
  ];

  return (
    <View style={styles.profileCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Your Activity</Text>
        <Text style={styles.cardSubtitle}>Your MandiGo journey</Text>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
              <Icon name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statNumber}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const SelectionModal = React.memo(({ 
  visible, 
  onClose, 
  title, 
  options, 
  selectedValue, 
  onSelect,
  styles 
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, styles.bottomSheetStyle]}> 
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.modalItem,
                selectedValue === option.name && styles.selectedModalItem
              ]}
              onPress={() => {
                onSelect(option.name);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalItemIcon}>{option.icon}</Text>
              <View style={styles.modalItemContent}>
                <Text style={[
                  styles.modalItemText,
                  selectedValue === option.name && styles.selectedModalItemText
                ]}>
                  {option.name}
                </Text>
                <Text style={styles.modalItemDescription}>
                  {option.description}
                </Text>
              </View>
              {selectedValue === option.name && (
                <Icon name="checkmark-circle" size={20} color="#49A760" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
));

const LoadingScreen = React.memo(({ styles }) => (
  <SafeAreaView style={styles.container}>
    <LinearGradient
      colors={["#f8fffe", "#eafbe7"]}
      style={styles.gradientBackground}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#49A760" style={{ marginBottom: 18 }} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </LinearGradient>
  </SafeAreaView>
));

const ErrorScreen = React.memo(({ styles }) => (
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
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#49A760", "#3d8b4f"]}
          style={styles.loginButtonGradient}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
));

// Main Component
const Profile = () => {
  // Context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    handleError(error, ERROR_CONTEXT.PROFILE, { showAlert: false });
    contextValue = {};
  }

  const { setIsLoading = () => {}, isLoading = false } = contextValue || {};
  
  // Custom hooks
  const { user, loading, error, refetch } = useUserData();
  const { selectedUserType, setSelectedUserType, selectedLocation, setSelectedLocation } = useUserPreferences(user);
  
  // Modal states
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Orientation and styles
  const { screenData, isLandscape, width, breakpoints } = useOrientation();
  const styles = useMemo(() => createProfileStyles(isLandscape, width), [isLandscape, width]);

  // Handlers with useCallback for performance
  const handleAboutUsPress = useCallback(async () => {
    try {
      const url = 'https://mandigo.in/page/aboutus/';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open the About Us page");
      }
    } catch (error) {
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to open About Us page"
      });
    }
  }, []);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await authService.logout();
              router.replace("/");
            } catch (error) {
              handleError(error, ERROR_CONTEXT.AUTH, { 
                showAlert: true,
                customMessage: "Failed to logout. Please try again."
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [setIsLoading]);

  const handleUserTypeChange = useCallback(async (userType) => {
    setSelectedUserType(userType);
    try {
      await authService.updateUserProfile({ job: userType });
      Alert.alert("Success", `Your profile has been updated to ${userType}.`);
    } catch (error) {
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to update user type. Please try again."
      });
    }
  }, []);

  const handleLocationChange = useCallback(async (location) => {
    setSelectedLocation(location);
    try {
      await authService.updateUserProfile({ locationMethod: location });
      Alert.alert("Success", `Location preference updated to ${location}.`);
    } catch (error) {
      handleError(error, ERROR_CONTEXT.PROFILE, { 
        showAlert: true,
        customMessage: "Failed to update location preference. Please try again."
      });
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Memoized field data
  const profileFields = useMemo(() => [
    { label: "Full Name", value: user?.name, icon: "👤" },
    { label: "Email Address", value: user?.email, icon: "📧" },
    { label: "Username", value: user?.username, icon: "@" },
    { label: "User Type", value: selectedUserType, icon: "👥" },
    { label: "Phone Number", value: user?.phoneNumber, icon: "📱" },
    { label: "Location", value: user?.location || "Not set", icon: "📍" },
    { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A", icon: "📅" },
    { label: "Last Active", value: "Today", icon: "🔄" },
  ], [user, selectedUserType]);

  const preferenceFields = useMemo(() => [
    { 
      label: "Language", 
      value: "English", 
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
  ], [selectedUserType, selectedLocation]);

  // Loading state
  if (loading || isLoading) {
    return <LoadingScreen styles={styles} />;
  }

  // Error or no user state
  if (!user) {
    return <ErrorScreen styles={styles} />;
  }

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#49A760']}
              tintColor="#49A760"
            />
          }
        >
          {/* Header Section */}
          <ProfileHeader user={user} styles={styles} />

          {/* Profile Information Card */}
          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Profile Information</Text>
              <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
                <Icon name="create-outline" size={16} color="#49A760" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldsContainer}>
              {profileFields.map((field, index) => (
                <ProfileField key={index} field={field} styles={styles} />
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
                <PreferenceField key={index} field={field} styles={styles} />
              ))}
            </View>
          </View>

          {/* Statistics Card */}
          {/* <StatisticsCard styles={styles} /> */}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Icon name="settings-outline" size={20} color="#49A760" />
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#ff4757", "#ff3742"]}
                style={styles.logoutGradient}
              >
                <Icon name="log-out-outline" size={20} color="white" />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* About Us Section */}
          <View style={styles.aboutSection}>
            <TouchableOpacity 
              style={styles.aboutButton}
              onPress={handleAboutUsPress}
              activeOpacity={0.7}
            >
              <Icon name="information-circle-outline" size={20} color="#49A760" />
              <Text style={styles.aboutButtonText}>About MandiGo</Text>
              <Icon name="chevron-forward" size={16} color="#49A760" />
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* User Type Selection Modal */}
      <SelectionModal
        visible={showUserTypeModal}
        onClose={() => setShowUserTypeModal(false)}
        title="Select User Type"
        options={USER_TYPES}
        selectedValue={selectedUserType}
        onSelect={handleUserTypeChange}
        styles={styles}
      />

      {/* Location Selection Modal */}
      <SelectionModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="Select Location Method"
        options={LOCATION_OPTIONS}
        selectedValue={selectedLocation}
        onSelect={handleLocationChange}
        styles={styles}
      />
    </SafeAreaView>
  );
};

export default Profile;