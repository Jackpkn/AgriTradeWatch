import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { loginStyles as styles } from "@/components/auth/LoginStyle";
import { GlobalContext } from "@/context/GlobalProvider";
import { authService } from "@/services";
import { FormInput } from "@/components/auth/FormComponents";
import illustration from "@/assets/images/workers-farm-activity-illustration 2.png";

const LoginScreen = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("LoginScreen must be used within a GlobalProvider");
  }

  const { setJwt, setMainUser, setIsLogged, setIsLoading } = context;
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.addAuthStateListener((user) => {
      if (user) {
        console.log("User authenticated, navigation will be handled by index page");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleLogin = async () => {
    const { username, password } = form;

    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login(username, password);
      const { user, token, message } = result;

      console.log("Login successful:", user.username);
      setMainUser(user);
      setJwt(token);
      setIsLogged(true);

      Alert.alert("Success", message || "Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "An error occurred during login. Please try again.";

      if (error.status === 401) {
        errorMessage = "Invalid username or password.";
      } else if (error.status === 400) {
        errorMessage = "Please enter valid credentials.";
      } else if (error.status === 403) {
        errorMessage = "This account has been disabled.";
      } else if (error.status === 429) {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
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
            onChangeText={(text) => handleInputChange("username", text)}
            autoCapitalize="none"
            autoCorrect={false}
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
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleLogin}
            disabled={!form.username || !form.password}
          >
            <Text style={styles.submitButtonText}>Log In</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;