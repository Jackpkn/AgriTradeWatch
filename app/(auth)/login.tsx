
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
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();

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
      Alert.alert(t.auth.validationError, t.auth.enterUsernamePassword);
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

      Alert.alert(t.auth.loginFailed, errorMessage);
    } finally {
      setIsLoggingIn(false);
      setIsLoading(false);
    }

  }, [form, setIsLoading, t]);


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
            <Text style={styles.title}>{t.auth.welcomeBack}</Text>
            <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>

            <FormInput
              icon="person-outline"
              placeholder={t.auth.username}
              value={form.username}
              onChangeText={(text: string) => handleInputChange("username", text)}
              autoCapitalize="none"
              autoCorrect={false}
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

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                disabled={isLoggingIn}
                onPress={() => Alert.alert(t.auth.forgotPassword, t.home.featureUnavailableMessage)}
              >
                <Text style={[styles.forgotPasswordText, isLoggingIn && { opacity: 0.5 }]}>
                  {t.auth.forgotPassword}
                </Text>
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
                {isLoggingIn ? t.auth.loggingIn : t.auth.login}
              </Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>{t.auth.dontHaveAccount} </Text>
              <TouchableOpacity
                disabled={isLoggingIn}
                onPress={() => navigation.navigate('Signup' as never)}
              >
                <Text style={[styles.signUpLink, isLoggingIn && { opacity: 0.5 }]}>
                  {t.auth.signUp}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GlobalLoader
        visible={isLoggingIn}
        message={t.auth.signingYouIn}
      />
    </SafeAreaView>
  );
};

export default LoginScreen;