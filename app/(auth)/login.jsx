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
import { Link, router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { loginStyles as styles } from "@/components/auth/LoginStyle"; 
import { GlobalContext } from "@/context/GlobalProvider";
import { auth } from "@/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getUserData } from "@/components/crud";
import { FormInput } from "@/components/auth/FormComponents";

import illustration from "@/assets/images/workers-farm-activity-illustration 2.png";

// --- Main LoginScreen Component ---
const LoginScreen = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("LoginScreen must be used within a GlobalProvider");
  }
  const { setJwt, setMainUser, setIsLogged, setIsLoading, isGuest, logoutGuest } = context;

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is authenticated, navigating to home.");
        router.replace("/(tabs)/home");
      } else {
        console.log("No authenticated user found, staying on login page.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleLogin = async () => {
    const { email, password } = form;
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      if (isGuest) {
        await logoutGuest();
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Login successful:", user.email);

      const userData = await getUserData(user.uid);
      if (userData) {
        setMainUser(userData);
        setJwt(user.uid);
        setIsLogged(true);
      } else {
        throw new Error("Could not find user data.");
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "An error occurred during login. Please try again.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed login attempts. Please try again later.";
          break;
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Image source={illustration} style={styles.illustration} />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Please enter your details to continue.</Text>

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

          <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
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

