

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Local imports
import { signUpStyles as styles } from "@/components/auth/SignUpStyles";
import { useGlobal } from "@/context/global-provider";
import { useTranslation } from "@/hooks/useTranslation";
import authService, { RegistrationData } from "@/services/auth-service";
import * as Location from "expo-location";
import { APIError } from "@/services/api";
import { FormInput, SelectionButton, SelectionModal } from "@/components/auth/FormComponents";
import { USER_TYPES } from "@/constants/authConstants";
import GlobalLoader from "@/components/Loader";
import illustration from "@/assets/images/workers-farm-activity-illustration 2.png";



interface SignUpFormState {
  name: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
}

type ModalType = 'userType' | null;


const SignUp = () => {
  const navigation = useNavigation();
  const { setIsLoading, currentLocation } = useGlobal();
  const { t } = useTranslation();

  const [form, setForm] = useState<SignUpFormState>({
    name: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<ModalType>(null);
  const [selectedUserType, setSelectedUserType] = useState<'Farmer' | 'Consumer'>('Farmer');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(true); // Start as true to show waiting state

  // --- Effects ---

  // Check if location is available from global context
  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      // Location is already available from global context
      console.log('Signup: Using existing location from global context:', currentLocation);
      setIsRequestingLocation(false);
    } else {
      // Show that we're waiting for location from global context
      console.log('Signup: Waiting for location from global context...');
      setIsRequestingLocation(true);

      // If no location after a reasonable wait time, stop showing loading
      const timer = setTimeout(() => {
        if (!currentLocation?.latitude) {
          console.log('Signup: No location available after waiting');
          setIsRequestingLocation(false);
        }
      }, 3000); // Wait 3 seconds for global location to be available

      return () => clearTimeout(timer);
    }
  }, [currentLocation]);

  // --- Handlers ---

  const handleInputChange = (field: keyof SignUpFormState, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleFormSubmit = useCallback(async () => {
    const { email, password, username, phoneNumber } = form;

    // Client-side Validation
    if (!username.trim() || !password.trim()) {
      Alert.alert(t.auth.validationError, t.auth.enterUsernamePassword);
      return;
    }
    if (!email.trim()) {
      Alert.alert(t.auth.validationError, "Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t.auth.validationError, "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(t.auth.validationError, "Password must be at least 6 characters long.");
      return;
    }

    // Check if location is available
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      Alert.alert(
        t.auth.locationRequired,
        t.auth.locationRequiredMessage,
        [{ text: t.common.ok }]
      );
      return;
    }

    const job = selectedUserType.toLowerCase() as 'farmer' | 'consumer';

    setIsRegistering(true);
    setIsLoading(true);

    try {
      // Payload Creation - Always use current location
      const payload: RegistrationData = {
        username,
        password,
        job,
        email: email,
        mobile: phoneNumber || '',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      // API Call
      const result = await authService.register(payload);

      Alert.alert(
        t.auth.registrationSuccessful,
        result.message,
        [{ text: t.common.ok, onPress: () => navigation.navigate('Login' as never) }]
      );

    } catch (error: unknown) {
      // Error Handling
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof APIError) {
        errorMessage = error.message;
        if (__DEV__) console.error(`Registration APIError (${error.status}):`, error.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (__DEV__) console.error("Registration Generic Error:", error);
      }

      Alert.alert(t.auth.registrationFailed, errorMessage);
    } finally {
      setIsRegistering(false);
      setIsLoading(false);
    }
  }, [form, selectedUserType, currentLocation, setIsLoading, t]);

  const handleRetryLocation = useCallback(async () => {
    setIsRequestingLocation(true);
    try {
      console.log('Signup: Checking location permission status...');
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        // Permission not granted - direct user to settings instead of requesting again
        console.log('Signup: Permission not granted, directing to settings');
        Alert.alert(
          t.auth.locationRequired,
          "Please enable location permission in your device settings.",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
            { text: t.common.cancel, style: "cancel" },
          ]
        );
        setIsRequestingLocation(false);
        return;
      }

      // Permission granted - fetch location
      console.log('Signup: Permission granted, fetching location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (location) {
        console.log('Signup: Location fetched successfully:', location.coords);
        // Note: This updates local state only. The global context should be updated
        // via the GlobalProvider's location request on app start.
      }
    } catch (error) {
      console.error('Signup: Location request failed:', error);
      Alert.alert(
        t.common.error,
        "Unable to get your location. Please check your GPS settings and try again.",
        [{ text: t.common.ok }]
      );
    } finally {
      setIsRequestingLocation(false);
    }
  }, [t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Image source={illustration} style={styles.illustration} resizeMode="contain" />
            <Text style={styles.title}>{t.auth.createAccount}</Text>
            <Text style={styles.subtitle}>{t.auth.signupSubtitle}</Text>
            <Text style={styles.locationNote}>
              {t.auth.locationRequiredMessage}
            </Text>

            <SelectionButton
              label={t.auth.iAmA}
              value={selectedUserType}
              icon={USER_TYPES.find(type => type.name === selectedUserType)?.icon || "👤"}
              onPress={() => setModalVisible('userType')}
            />

            {/* Location Status Display */}
            <View style={styles.locationContainer}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color="#49A760" />
                <Text style={styles.locationLabel}>{t.auth.locationRequired}</Text>
              </View>

              {isRequestingLocation && !currentLocation?.latitude ? (
                <View style={styles.locationStatus}>
                  <Ionicons name="time" size={16} color="#49A760" />
                  <Text style={styles.locationText}>
                    {t.auth.waitingForLocation}
                  </Text>
                </View>
              ) : currentLocation?.latitude && currentLocation?.longitude ? (
                <>
                  <View style={styles.locationStatus}>
                    <Ionicons name="checkmark-circle" size={16} color="#49A760" />
                    <Text style={styles.locationText}>
                      {t.auth.currentLocationDetected}
                    </Text>
                  </View>
                  <Text style={styles.locationCoords}>
                    {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.locationStatus}>
                    <Ionicons name="warning" size={16} color="#ff6b6b" />
                    <Text style={[styles.locationText, { color: '#ff6b6b' }]}>
                      {t.auth.locationRequired}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.retryLocationButton}
                    onPress={handleRetryLocation}
                    disabled={isRequestingLocation}
                  >
                    <Ionicons name="refresh" size={14} color="#49A760" />
                    <Text style={styles.retryLocationText}>
                      {t.auth.enableLocation}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Form Inputs */}
            <FormInput
              icon="person-outline"
              placeholder={t.auth.username}
              value={form.username}
              onChangeText={(text: string) => handleInputChange("username", text)}
              autoCapitalize="none"
            />
            <FormInput
              icon="mail-outline"
              placeholder={t.auth.email}
              value={form.email}
              onChangeText={(text: string) => handleInputChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.auth.password}
                placeholderTextColor="#9A9A9A"
                value={form.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <FormInput
              icon="call-outline"
              placeholder={t.auth.phoneNumber}
              value={form.phoneNumber}
              onChangeText={(text: string) => handleInputChange("phoneNumber", text)}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                isRegistering && styles.submitButtonDisabled
              ]}
              onPress={handleFormSubmit}
              disabled={isRegistering}
            >
              <Text style={styles.submitButtonText}>
                {isRegistering ? t.auth.creatingAccount : t.auth.signUp}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t.auth.alreadyHaveAccount} </Text>
              <TouchableOpacity
                disabled={isRegistering}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={[styles.loginLink, isRegistering && { opacity: 0.5 }]}>
                  {t.auth.login}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <SelectionModal
        visible={modalVisible === 'userType' && !isRegistering}
        onClose={() => setModalVisible(null)}
        title="Select Your Role"
        options={USER_TYPES}
        selectedValue={selectedUserType}
        onSelect={(value: string) => setSelectedUserType(value as 'Farmer' | 'Consumer')}
      />

      <GlobalLoader
        visible={isRegistering}
        message={t.auth.creatingAccount}
      />


    </SafeAreaView>
  );
};

export default SignUp;