

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Local imports
import { signUpStyles as styles } from "@/components/auth/SignUpStyles";
import { useGlobal } from "@/context/global-provider";
import authService, { RegistrationData } from "@/services/auth-service";
import { APIError } from "@/services/api";
import { FormInput, SelectionButton, SelectionModal } from "@/components/auth/FormComponents";
import { USER_TYPES, LOCATION_OPTIONS } from "@/constants/authConstants";
import GlobalLoader from "@/components/Loader";
import illustration from "@/assets/images/workers-farm-activity-illustration 2.png";



interface SignUpFormState {
  name: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
}

type ModalType = 'userType' | 'location' | null;


const SignUp = () => {
  const navigation = useNavigation();
  const { setIsLoading, currentLocation } = useGlobal();

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
  const [selectedLocation, setSelectedLocation] = useState<'Auto-detect Current' | 'Enter Manually'>('Auto-detect Current');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // --- Handlers ---

  const handleInputChange = (field: keyof SignUpFormState, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleFormSubmit = useCallback(async () => {
    const { email, password, username, phoneNumber } = form;

    // Client-side Validation
    if (!username.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Username and password are required.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long.");
      return;
    }

    const job = selectedUserType.toLowerCase() as 'farmer' | 'consumer';

    setIsRegistering(true);
    setIsLoading(true);

    try {
      // Payload Creation
      const payload: RegistrationData = {
        username,
        password,
        job,
        email: email,
        mobile: phoneNumber || '',
        latitude: selectedLocation === 'Auto-detect Current' ? currentLocation?.latitude : 0.0,
        longitude: selectedLocation === 'Auto-detect Current' ? currentLocation?.longitude : undefined,
      };

      // API Call
      const result = await authService.register(payload);

      Alert.alert(
        'Registration Successful',
        result.message,
        [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
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

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsRegistering(false);
      setIsLoading(false);
    }
  }, [form, selectedUserType, selectedLocation, currentLocation, setIsLoading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Image source={illustration} style={styles.illustration} resizeMode="contain" />
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join our community to get started.</Text>

          <SelectionButton
            label="I am a"
            value={selectedUserType}
            icon={USER_TYPES.find(type => type.name === selectedUserType)?.icon || "👤"}
            onPress={() => setModalVisible('userType')}
          />
          <SelectionButton
            label="My Location"
            value={selectedLocation}
            icon={LOCATION_OPTIONS.find(loc => loc.name === selectedLocation)?.icon || "📍"}
            onPress={() => setModalVisible('location')}
          />

          {/* Form Inputs */}
          <FormInput
            icon="person-outline"
            placeholder="Username"
            value={form.username}
            onChangeText={(text: string) => handleInputChange("username", text)}
            autoCapitalize="none"
          />
          <FormInput
            icon="mail-outline"
            placeholder="Email Address (Optional)"
            value={form.email}
            onChangeText={(text: string) => handleInputChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
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
            placeholder="Phone Number (Optional)"
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
              {isRegistering ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              disabled={isRegistering}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Text style={[styles.loginLink, isRegistering && { opacity: 0.5 }]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <SelectionModal
        visible={modalVisible === 'userType' && !isRegistering}
        onClose={() => setModalVisible(null)}
        title="Select Your Role"
        options={USER_TYPES}
        selectedValue={selectedUserType}
        onSelect={(value: string) => setSelectedUserType(value as 'Farmer' | 'Consumer')}
      />
      <SelectionModal
        visible={modalVisible === 'location' && !isRegistering}
        onClose={() => setModalVisible(null)}
        title="Select Location Method"
        options={LOCATION_OPTIONS}
        selectedValue={selectedLocation}
        onSelect={(value: string) => setSelectedLocation(value as 'Auto-detect Current' | 'Enter Manually')}
      />

      <GlobalLoader
        visible={isRegistering}
        message="Creating your account..."
      />
    </SafeAreaView>
  );
};

export default SignUp;