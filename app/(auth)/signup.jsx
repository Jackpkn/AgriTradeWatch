import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signUpStyles as styles } from "@/components/auth/SignUpStyles";
import { Link, router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

import { GlobalContext } from "@/context/GlobalProvider";
// API IMPORTS
import { authService } from "@/services";
import { FormInput, SelectionButton, SelectionModal } from "@/components/auth/FormComponents"; 
import { USER_TYPES, LOCATION_OPTIONS } from "@/constants/authConstants";

import illustration from "@/assets/images/workers-farm-activity-illustration 2.png";

// --- Main SignUp Component ---
const SignUp = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("SignUp must be used within a GlobalProvider");
  }
  const { setMainUser, setIsLoading } = context;

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    job: "",
    phoneNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState("Farmer");
  const [selectedLocation, setSelectedLocation] = useState("Auto-detect Current");

  useEffect(() => {
    // API AUTH STATE MONITORING
    const unsubscribe = authService.addAuthStateListener((user) => {
      if (user) {
        console.log("User authenticated, navigating to home.");
        router.replace("/(tabs)/home");
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleFormSubmit = async () => {
    const { name, email, password, username, phoneNumber } = form;
    if (!name || !email || !password || !username || !phoneNumber) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Alert.alert("Error", "Please enter a valid email address.");
        return;
    }
    if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long.");
        return;
    }

    setIsLoading(true);
    try {
      const userData = {
        ...form,
        userType: selectedUserType,
        locationMethod: selectedLocation,
      };

      // API REGISTRATION
      const result = await authService.register(userData);
      const { user, token } = result;
      
      setMainUser(user);
      Alert.alert("Success", "Account created successfully!");
      
    } catch (error) {
      console.error("Registration Error:", error);
      let errorMessage = "An unexpected error occurred.";
      
      if (error.status === 400) {
        errorMessage = "Invalid registration data. Please check your input.";
      } else if (error.status === 409) {
        errorMessage = "An account with this email already exists.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Image source={illustration} style={styles.illustration} />
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
          
          <FormInput 
            icon="person-outline" 
            placeholder="Full Name" 
            value={form.name} 
            onChangeText={(text) => handleInputChange("name", text)} 
          />
          <FormInput 
            icon="at-outline" 
            placeholder="Username" 
            value={form.username} 
            onChangeText={(text) => handleInputChange("username", text)} 
            autoCapitalize="none" 
          />
          <FormInput 
            icon="mail-outline" 
            placeholder="Email Address" 
            value={form.email} 
            onChangeText={(text) => handleInputChange("email", text)} 
            keyboardType="email-address" 
            autoCapitalize="none" 
          />
          
          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9A9A9A"
              value={form.password}
              onChangeText={(text) => handleInputChange("password", text)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <FormInput 
            icon="briefcase-outline" 
            placeholder="Job (Optional)" 
            value={form.job} 
            onChangeText={(text) => handleInputChange("job", text)} 
          />
          <FormInput 
            icon="call-outline" 
            placeholder="Phone Number" 
            value={form.phoneNumber} 
            onChangeText={(text) => handleInputChange("phoneNumber", text)} 
            keyboardType="phone-pad" 
            maxLength={10} 
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit}>
            <Text style={styles.submitButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      <SelectionModal
        visible={modalVisible === 'userType'}
        onClose={() => setModalVisible(null)}
        title="Select User Type"
        options={USER_TYPES}
        selectedValue={selectedUserType}
        onSelect={setSelectedUserType}
      />
      <SelectionModal
        visible={modalVisible === 'location'}
        onClose={() => setModalVisible(null)}
        title="Select Location Method"
        options={LOCATION_OPTIONS}
        selectedValue={selectedLocation}
        onSelect={setSelectedLocation}
      />
    </SafeAreaView>
  );
};

export default SignUp;
