
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Local imports
import { loginStyles as styles } from "@/components/auth/LoginStyle";
import { useGlobal } from "@/context/global-provider";
import { authService } from "@/services";
import { APIError } from "@/services/api";
import { FormInput } from "@/components/auth/FormComponents";
import GlobalLoader from "@/components/Loader";
import illustration from "@/assets/images/workers-farm-activity-illustration 2.png";

// Define the shape of our form's state
interface LoginFormState {
  username: string;
  password: string;
}

// ========================================================================
// Login Screen Component
// ========================================================================

const LoginScreen = () => {
  const navigation = useNavigation();
  const { setIsLoading } = useGlobal();

  const [form, setForm] = useState<LoginFormState>({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // --- Handlers ---

  const handleInputChange = (field: keyof LoginFormState, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleLogin = useCallback(async () => {
    const { username, password } = form;

    if (!username.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please enter both username and password.");
      return;
    }

    setIsLoggingIn(true);
    setIsLoading(true);

    try {
      await authService.login(username, password);

      if (__DEV__) {
        console.log("Login call successful. Navigation will be handled by the root layout/router.");
      }

      // Navigation will be handled by the root layout based on auth state
      // No need to manually navigate here

    } catch (error: unknown) {
      // Handle errors gracefully.
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof APIError) {
        errorMessage = error.message;
        if (__DEV__) console.error(`Login APIError (${error.status}):`, error.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (__DEV__) console.error("Login Generic Error:", error);
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoggingIn(false);
      setIsLoading(false);
    }

  }, [form, setIsLoading]);


  // --- Render ---

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
            <Image
              source={illustration}
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Please enter your details to continue.</Text>

            <FormInput
              icon="person-outline"
              placeholder="Username"
              value={form.username}
              onChangeText={(text: string) => handleInputChange("username", text)}
              autoCapitalize="none"
              autoCorrect={false}
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
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoggingIn || !form.username || !form.password) && styles.submitButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoggingIn || !form.username || !form.password}
            >
              <Text style={styles.submitButtonText}>
                {isLoggingIn ? "Logging In..." : "Log In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity
                disabled={isLoggingIn}
                onPress={() => navigation.navigate('Signup' as never)}
              >
                <Text style={[styles.signUpLink, isLoggingIn && { opacity: 0.5 }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GlobalLoader
        visible={isLoggingIn}
        message="Signing you in..."
      />
    </SafeAreaView>
  );
};

export default LoginScreen;