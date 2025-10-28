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

// ========================================================================
// Forgot Password Screen Component
// ========================================================================

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { setIsLoading } = useGlobal();
  const { t } = useTranslation();

  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Handlers ---

  const handlePasswordReset = useCallback(async () => {
    // Validate email
    if (!email.trim()) {
      Alert.alert(t.auth.validationError, "Please enter your email address.");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t.auth.validationError, "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const result = await authService.requestPasswordReset(email);

      Alert.alert(
        t.common.success,
        result.message || "Password reset email sent successfully",
        [
          {
            text: t.common.ok,
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: unknown) {
      // Handle errors gracefully
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof APIError) {
        errorMessage = error.message;
        if (__DEV__) console.error(`Password Reset APIError (${error.status}):`, error.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (__DEV__) console.error("Password Reset Generic Error:", error);
      }

      Alert.alert(t.common.error, errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }, [email, setIsLoading, t, navigation]);

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
            <Text style={styles.title}>{t.auth.forgotPassword}</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <FormInput
              icon="mail-outline"
              placeholder={t.auth.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || !email) && styles.submitButtonDisabled
              ]}
              onPress={handlePasswordReset}
              disabled={isSubmitting || !email}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Remember your password? </Text>
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.signUpLink, isSubmitting && { opacity: 0.5 }]}>
                  {t.auth.login}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GlobalLoader
        visible={isSubmitting}
        message="Sending reset link..."
      />
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
