import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // For icons
import FontAwesome from "react-native-vector-icons/FontAwesome"; // For social media icons
import illustration from "../../assets/images/workers-farm-activity-illustration 2.png";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../components/GlobalApi";
import { GlobalContext } from "../../context/GlobalProvider";

const FormInput = ({ icon, placeholder, value, handleChangeText }) => {
  return (
    <View style={styles.inputContainer}>
      <Icon name={icon} size={20} color="#000" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="email-address"
      />
    </View>
  );
};

const SignUp = ({ navigation }) => {
  const { setJwt, setMainUser, setIsLogged, mainUser, jwt } =
    useContext(GlobalContext);

    useEffect(() => {
      if (jwt) {
        const fetchUserData = async () => {
          try {
            const res = await api.get("/users/me", {
              headers: {
          Authorization: `bearer ${jwt}`,
              },
            });


            setMainUser(res.data);
            setIsLogged(true);
            router.push("/home");
            console.log(res.data);

          } catch (err) {
            console.error("Error:", err.response.data);
          }
        };

        fetchUserData();
      }
      else {
        console.log("No JWT token found in local storage");
      }
    }
    , []);

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    job: "",
    phoneNumber: 0,
  });

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFormSubmit = async () => {
    console.log(user);

    if (
      !user.name ||
      !user.email ||
      !user.password ||
      !user.username ||
      !user.job ||
      !user.phoneNumber
    ) {
      alert("Please fill all the fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Validate phone number (example: must be 10 digits)
    if (user.phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const response = await api.post(
        "auth/local/register",
        {
          email: user.email,
          password: user.password,
          username: user.username,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response register :", response.data);

      if (response.status === 200) {
        setMainUser(response.data.user);
        setIsLogged(true);
        setJwt(response.data.jwt);
        alert("Account created successfully");
        router.push("/home");
      } 
    } catch (error) {
      console.error("Error:", error.response.data.error.message);
      alert(error.response.data.error.message);
    }
  };

  const updateMainUser = async () => {
    console.log("User:", user);

    try {
      const response = await api.put(
        `users/${mainUser.id}`,
        {
          job: user.job,
          phoneNumber: user.phoneNumber,
          name: user.name,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response update :", response.data);
    } catch (error) {
      console.error("Error:", error.response.data.error.message);
      alert(error.response.data.error.message);
    }
  };

  console.log("main User:", mainUser);
  console.log("JWT:", jwt);

  setTimeout(() => {
    if (jwt && mainUser.id) {
      updateMainUser();
    }
  }, 5000);

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%" }}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            {/* You can add your own illustration here */}
            <Image
              source={illustration} // Add your image to the assets folder
              style={styles.illustration}
            />
          </View>

          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Create an account to Continue</Text>

          <FormInput
            icon="person-outline"
            placeholder="Name"
            value={user.name}
            handleChangeText={(text) => setUser({ ...user, name: text })}
          />
          <FormInput
            icon="person-outline"
            placeholder="Username"
            value={user.username}
            handleChangeText={(text) => setUser({ ...user, username: text })}
          />
          <FormInput
            icon="mail-outline"
            placeholder="Email"
            value={user.email}
            handleChangeText={(text) => setUser({ ...user, email: text })}
          />

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
              value={user.password}
              onChangeText={(text) => setUser({ ...user, password: text })}
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

          <FormInput
            icon="call-outline"
            placeholder="Phone Number"
            value={user.phoneNumber}
            handleChangeText={(text) => setUser({ ...user, phoneNumber: text })}
          />
          <FormInput
            icon="briefcase-outline"
            placeholder="Job"
            value={user.job}
            handleChangeText={(text) => setUser({ ...user, job: text })}
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleFormSubmit}
          >
            <Text style={styles.loginButtonText}>Sign Up</Text>
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

          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signUpText}>
              Already have an account?{" "}
              <Link href="/login" style={styles.signUpLink}>
                {" "}
                Log In
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
    backgroundColor: "#fff",
    justifyContent: "center",
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
    marginTop: 10,
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

export default SignUp;
