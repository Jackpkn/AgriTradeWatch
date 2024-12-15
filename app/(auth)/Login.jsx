import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  BackHandler,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // For icons
import FontAwesome from "react-native-vector-icons/FontAwesome"; // For social media icons
import illustration from "../../assets/images/workers-farm-activity-illustration 2.png";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
// import api from "../../components/GlobalApi";
import { GlobalContext } from "../../context/GlobalProvider";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "../../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getUserData } from "../../components/crud";


const LoginScreen = () => {
  const { setIsLoading , setMainUser} =
    useContext(GlobalContext);

  const onAuthStateChangedApp = (user) => {
    if (user) {
      router.replace("/home");
    } else {
      console.log("No user found");
    }
  };

  useEffect(() => {
    const sub = onAuthStateChanged(auth, onAuthStateChangedApp);
    return sub;
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter your email and password");
      return;
    }
    

    try {
     
      setIsLoading(true);
      const res = await signInWithEmailAndPassword(auth,email, password);
      console.log("Login response:", res.user);
      router.replace("/home");

    } catch (error) {
      console.error("Login failed:", error)
      Alert.alert(error.response.data.error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          backgroundColor: "white",
          height: "100%",
        }}
      >
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            {/* You can add your own illustration here */}
            <Image
              source={illustration} // Add your image to the assets folder
              style={styles.illustration}
            />
          </View>

          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>
            please enter your details to continue
          </Text>

          <View style={styles.inputContainer}>
            <Icon
              name="mail-outline"
              size={20}
              color="#000"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon
              name="lock-closed-outline"
              size={20}
              color="#000"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.eyeIcon}
            >
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              /* Handle forgot password logic */
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or sign in with</Text>

          <View style={styles.socialLoginContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="facebook" size={30} color="#3b5998" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="google" size={30} color="#DB4437" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.signUpText}>
              Don’t have an account?{" "}
              <Link href="/signup" style={styles.signUpLink}>
                {" "}
                Sign Up
              </Link>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
    justifyContent: "center",
    height: "100vh",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  illustration: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    textAlign: "center",
    color: "grey",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  forgotPasswordText: {
    color: "green",
    textAlign: "right",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "green",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    textAlign: "center",
    marginBottom: 20,
    color: "grey",
  },
  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  socialButton: {
    marginHorizontal: 10,
  },
  signUpText: {
    textAlign: "center",
    color: "grey",
  },
  signUpLink: {
    color: "green",
  },
});

export default LoginScreen;
