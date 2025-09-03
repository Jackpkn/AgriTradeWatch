import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "@/context/GlobalProvider";
import { router } from "expo-router";
import { auth } from "@/firebase";
import { getUserData } from "@/components/crud";
import Icon from "react-native-vector-icons/Ionicons";
import { LANGUAGES, USER_TYPES, LOCATION_OPTIONS } from "@/constants/authConstants";

const profile = () => {
  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    console.error("Error accessing GlobalContext in profile:", error);
    contextValue = {};
  }

  const { setIsLoading = () => {} } = contextValue || {};

  const [user, setUser] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedUserType, setSelectedUserType] = useState("Farmer");
  const [selectedLocation, setSelectedLocation] = useState("Auto-detect Current");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await getUserData(auth.currentUser.uid);
        setUser(userData);
        
        // Set preferences from user data
        if (userData.userType) setSelectedUserType(userData.userType);
        if (userData.locationMethod) setSelectedLocation(userData.locationMethod);
        // Language will be stored in app state/context later
      } catch (error) {
        console.error("Error fetching user data: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await auth.signOut();
      router.replace("/");
      console.log("User has been logged out successfully");
    } catch (error) {
      console.error("Error during logout: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // TODO: Save language preference to user profile/database
    Alert.alert("Language Changed", `${language} will be applied to the app.`);
  };

  const handleUserTypeChange = (userType) => {
    setSelectedUserType(userType);
    // TODO: Update user type in database
    Alert.alert("User Type Updated", `Your profile has been updated to ${userType}.`);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    // TODO: Update location preference in database
    Alert.alert("Location Updated", `Location preference updated to ${location}.`);
  };

  const profileFields = [
    { label: "Full Name", value: user?.name, icon: "👤" },
    { label: "Email Address", value: user?.email, icon: "📧" },
    { label: "Username", value: user?.username, icon: "@" },
    { label: "Occupation", value: user?.job, icon: "💼" },
    { label: "Phone Number", value: user?.phoneNumber, icon: "📱" },
  ];

  const preferenceFields = [
    { 
      label: "Language", 
      value: selectedLanguage, 
      icon: "🌐", 
      onPress: () => setShowLanguageModal(true),
      editable: true 
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
  ];

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
                  {field.editable && (
                    <Icon name="chevron-forward" size={20} color="#49A760" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.secondaryButton}>
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
        </ScrollView>
      </LinearGradient>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.modalItem,
                    selectedLanguage === language.name && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleLanguageChange(language.name);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={styles.modalItemFlag}>{language.flag}</Text>
                  <Text style={[
                    styles.modalItemText,
                    selectedLanguage === language.name && styles.selectedModalItemText
                  ]}>
                    {language.name}
                  </Text>
                  {selectedLanguage === language.name && (
                    <Icon name="checkmark" size={20} color="#49A760" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}> 
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
        <View style={styles.modalContent}>
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
      </Modal>
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
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F4E3D",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#49A760",
    borderRadius: 20,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fieldsContainer: {
    padding: 24,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8fffe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1F4E3D",
    fontWeight: "600",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 16,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#49A760",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#49A760",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fffe",
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#49A760",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedModalItem: {
    backgroundColor: "#e8f5e8",
  },
  modalItemFlag: {
    fontSize: 20,
    marginRight: 12,
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
    color: "#333",
    fontWeight: "500",
  },
  selectedModalItemText: {
    color: "#49A760",
    fontWeight: "600",
  },
  modalItemDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
