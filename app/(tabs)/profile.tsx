
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

// Local Imports
import { useGlobal } from "@/context/global-provider";
import { authService, profileService } from "@/services";
import { USER_TYPES, LOCATION_OPTIONS, LANGUAGES } from "@/constants/authConstants";
import { createProfileStyles } from "@/utils/responsiveStyles";
import { useOrientation } from "@/utils/orientationUtils";
import { EnhancedProfileData } from "@/services/profile-service";
import GlobalLoader from "@/components/Loader";
import { useTranslation } from "@/hooks/useTranslation";

// ========================================================================
// Type Definitions
// ========================================================================


// Type alias for better readability in this component
type ProfileData = EnhancedProfileData;

// Props for memoized components
interface ProfileHeaderProps { user: ProfileData; styles: any; }
interface ProfileFieldProps { field: { label: string; value: string | null; icon: string }; styles: any; }
interface PreferenceFieldProps { field: { label: string; value: string; icon: string; onPress: () => void; editable: boolean }; styles: any; }

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: typeof USER_TYPES | typeof LOCATION_OPTIONS | typeof LANGUAGES;
  selectedValue: string;
  onSelect: (value: string) => void;
  styles: any;
}

type UserPreference = 'Farmer' | 'Consumer';
type LocationPreference = 'Auto-detect Current' | 'Enter Manually';

// ========================================================================
// Custom Hooks (Preserved Original Structure)
// ========================================================================

const useUserData = () => {
  const { updateUserProfile } = useGlobal();
  const [user, setUser] = useState<ProfileData | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const profileData = await profileService.getProfile();
      setUser(profileData);
      // Update the global context with fresh profile data
      updateUserProfile(profileData);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    }
  }, [updateUserProfile]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return { user, refetch: fetchUserData };
};

const useUserPreferences = (user: ProfileData | null) => {
  const [selectedUserType, setSelectedUserType] = useState<UserPreference>('Farmer');
  const [selectedLocation, setSelectedLocation] = useState<LocationPreference>('Auto-detect Current');

  useEffect(() => {
    if (user?.job) {
      setSelectedUserType(user.job.toLowerCase() === 'farmer' ? 'Farmer' : 'Consumer');
    }
  }, [user]);

  return {
    selectedUserType,
    setSelectedUserType,
    selectedLocation,
    setSelectedLocation,
  };
};

// ========================================================================
// Memoized UI Components (Restored)
// ========================================================================

const ProfileHeader: React.FC<ProfileHeaderProps> = React.memo(({ user, styles }) => (
  <View style={styles.headerSection}>
    <View style={styles.avatarContainer}>
      <LinearGradient colors={["#49A760", "#3d8b4f"]} style={styles.avatarGradient}>
        <Text style={styles.avatarText}>
          {user.displayName ? user.displayName[0]?.toUpperCase() : user.username[0]?.toUpperCase()}
        </Text>
      </LinearGradient>
    </View>
    <Text style={styles.userName}>{user.displayName || user.username}</Text>
    <Text style={styles.userRole}>{user.role || "User"}</Text>
  </View>
));

const ProfileField: React.FC<ProfileFieldProps> = React.memo(({ field, styles }) => {
  // Import t inside the component if needed, or pass it as a prop
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}><Text style={styles.iconText}>{field.icon}</Text></View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <Text style={styles.fieldValue} numberOfLines={1}>{field.value || "Not provided"}</Text>
      </View>
    </View>
  );
});

const PreferenceField: React.FC<PreferenceFieldProps> = React.memo(({ field, styles }) => (
  <TouchableOpacity style={styles.fieldRow} onPress={field.onPress} disabled={!field.editable}>
    <View style={styles.fieldIcon}><Text style={styles.iconText}>{field.icon}</Text></View>
    <View style={styles.fieldContent}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <Text style={styles.fieldValue}>{field.value || "Not set"}</Text>
    </View>
    {field.editable && <Ionicons name="chevron-forward" size={20} color="#49A760" />}
  </TouchableOpacity>
));

const SelectionModal: React.FC<SelectionModalProps> = React.memo(({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  styles
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll}>
          {options.map((option: any) => {
            const optionValue = option.id || option.code || option.name;
            const optionName = option.name;
            const optionIcon = option.icon || option.flag;
            const optionDesc = option.description;
            const isSelected = selectedValue === optionName || selectedValue === optionValue;

            return (
              <TouchableOpacity
                key={optionValue}
                style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                onPress={() => {
                  onSelect(optionValue);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionIcon}>{optionIcon}</Text>
                <View style={styles.modalOptionContent}>
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {optionName}
                  </Text>
                  {optionDesc && (
                    <Text style={styles.modalOptionDesc}>{optionDesc}</Text>
                  )}
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#49A760" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
));



// ========================================================================
// Main Profile Component
// ========================================================================

const Profile = () => {
  const navigation = useNavigation();
  const { setIsLoading } = useGlobal();
  const { t, language, setLanguage } = useTranslation();
  const { user, refetch } = useUserData();
  const { selectedUserType, selectedLocation } = useUserPreferences(user);

  const [modal, setModal] = useState<'userType' | 'location' | 'language' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { isLandscape, width } = useOrientation() as unknown as {
    isLandscape: boolean;
    width: number;
    height: number;
    screenData: { width: number; height: number };
    breakpoints: Record<string, boolean>;
  };
  const styles = useMemo(() => createProfileStyles(isLandscape, width), [isLandscape, width]);

  const handleLogout = useCallback(() => {
    Alert.alert(t.auth.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.auth.logout, style: "destructive", onPress: async () => {
          setIsLoading(true);
          try {
            await authService.logout();
            // The global provider will handle auth state change
            // Navigate back to the root index screen
            navigation.navigate('index' as never);
            console.log('✅ Logout successful, navigated to index');
          } catch (error) {
            console.error('❌ Logout error:', error);
            Alert.alert(t.common.error, t.auth.logoutFailed);
          } finally {
            setIsLoading(false);
          }
        }
      },
    ]);
  }, [setIsLoading, t, navigation]);

  const handleUserTypeChange = useCallback(async (userType: string) => {
    const jobValue = userType.toLowerCase() as 'farmer' | 'consumer';
    setIsLoading(true);
    try {
      await profileService.updateProfile({ job: jobValue });
      await refetch();
      Alert.alert(t.common.success, t.profile.roleUpdated.replace('{{userType}}', userType));
    } catch (err: any) {
      Alert.alert(t.common.error, err.message || t.profile.roleUpdateFailed);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, refetch, t]);

  const handleLanguageChange = useCallback(async (languageCode: string) => {
    setIsLoading(true);
    try {
      await setLanguage(languageCode as 'en' | 'hi' | 'mr');
      setModal(null);
      Alert.alert(t.common.success, "Language updated successfully");
    } catch (err: any) {
      Alert.alert(t.common.error, err.message || "Failed to update language.");
    } finally {
      setIsLoading(false);
    }
  }, [setLanguage, setIsLoading, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const profileFields = useMemo(() => {
    if (user) {
      console.log("User date_joined:", user.date_joined);
      return [
        { label: t.profile.username, value: user.username, icon: "👤" },
        { label: t.profile.email, value: user.email, icon: "📧" },
        { label: t.profile.mobile, value: user.mobile, icon: "📱" },
        { label: t.profile.memberSince, value: profileService.formatDate(user.date_joined), icon: "📅" },
      ];
    }
    return [];
  }, [user, t]);

  // Get current language display name
  const currentLanguageName = useMemo(() => {
    const lang = LANGUAGES.find(l => l.code === language);
    return lang ? lang.name : "English";
  }, [language]);

  const preferenceFields = useMemo(() => [
    {
      label: t.profile.language,
      value: currentLanguageName,
      icon: "🌐",
      onPress: () => setModal('language'),
      editable: true
    },
    {
      label: t.profile.userType,
      value: selectedUserType,
      icon: "👥",
      onPress: () => {
        // setModal('userType')
      },
      editable: false
    },
    {
      label: t.profile.locationMethod,
      value: selectedLocation,
      icon: "📍",
      onPress: () => {
        //  setModal('location')
      },
      editable: false
    },
  ], [selectedUserType, selectedLocation, t, currentLanguageName]);

  // Show loading state only if user data hasn't loaded yet
  if (!user) {
    return (
      <>
        <SafeAreaView style={styles.container}>
          <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradientBackground}>
            <View style={{ flex: 1 }} />
          </LinearGradient>
        </SafeAreaView>
        <GlobalLoader visible={true} message={t.profile.loadingProfile} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradientBackground}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#49A760']} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <ProfileHeader user={user} styles={styles} />

          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t.profile.header}</Text>
            </View>
            {profileFields.map((field, index) => <ProfileField key={index} field={field} styles={styles} />)}
          </View>

          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t.profile.preferences}</Text>
            </View>
            {preferenceFields.map((field, index) => <PreferenceField key={index} field={field} styles={styles} />)}
          </View>

          {/* Statistics Card and other components can be restored here */}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient colors={["#ff4757", "#ff3742"]} style={styles.logoutGradient}>
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text style={styles.logoutButtonText}>{t.auth.logout}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.versionText}>{t.common.version} {Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <SelectionModal
        visible={modal === 'userType'}
        onClose={() => setModal(null)}
        title="Select User Type"
        options={USER_TYPES}
        selectedValue={selectedUserType}
        onSelect={handleUserTypeChange}
        styles={styles}
      />

      <SelectionModal
        visible={modal === 'language'}
        onClose={() => setModal(null)}
        title={t.home.chooseLanguage}
        options={LANGUAGES}
        selectedValue={language}
        onSelect={handleLanguageChange}
        styles={styles}
      />

      {/* Add Location modal similarly */}
    </SafeAreaView>
  );
};

export default Profile;