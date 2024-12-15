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
import { GlobalContext } from "../../context/GlobalProvider";
import { Picker } from "@react-native-picker/picker";
import { auth } from "../../firebase";
import {  onAuthStateChanged } from "firebase/auth";
import { registerUser } from "../../components/crud";


export const FormInput = ({ icon, placeholder, value, handleChangeText, keyboardType = "default", style }) => {
  return (
    <View style={style ? style : styles.inputContainer }>
      <Icon name={icon} size={20} color="#000" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChangeText}
        keyboardType={ keyboardType }
      />
    </View>
  );
};

const SignUp = () => {
  const { setJwt, setMainUser, setIsLogged, mainUser, jwt, setIsLoading } =
    useContext(GlobalContext);

    // useEffect(() => {
    //   if (jwt) {
    //     const fetchUserData = async () => {
    //       try {
    //         setIsLoading(true);
    //         const res = await api.get("/users/me", {
    //           headers: {
    //       Authorization: `bearer ${jwt}`,
    //           },
    //         });


    //         setMainUser(res.data);
    //         setIsLogged(true);
    //         router.push("/home");
    //         console.log(res.data);

    //       } catch (err) {
    //         console.error("Error:", err.response.data);
    //       }finally {
    //         setIsLoading(false);
    //       }
    //     };

    //     fetchUserData();
    //   }
    //   else {
    //     console.log("No JWT token found in local storage");
    //   }
    // }
    // , []);

    const onAuthStateChangedApp = (user) => {
      if (user) {
        router.replace("/home");
      } else {
        console.log("No user found");
      }
    };
  
    useEffect(() => {

      // GoogleSignin.configure({
      //   webClientId: '809126175103-5q48dvth8pirnjom3mt6vols0njo2tmh.apps.googleusercontent.com',
      // });      

      const sub = onAuthStateChanged(auth, onAuthStateChangedApp);
      return sub;
    }, []);

    // const onGoogleButtonPress = async () => {
    //   try {
    //     setIsLoading(true);
    //     const { idToken } = await GoogleSignin.signIn();

    //     if (!idToken) {
    //         // if you are using older versions of google-signin, try old style result
    //         idToken = signInResult.idToken;
    //       }
    //       if (!idToken) {
    //         throw new Error('No ID token found');
    //       }

    //     const googleCredential = GoogleAuthProvider.credential(idToken);
    //     const user = await signInWithCredential(auth, googleCredential);
    //     console.log("User:", user);

    //   //   // Check if your device supports Google Play
    //   // await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    //   // // Get the users ID token
    //   // const signInResult = await GoogleSignin.signIn();
    
    //   // // Try the new style of google-sign in result, from v13+ of that module
    //   // idToken = signInResult.data?.idToken;
    //   // if (!idToken) {
    //   //   // if you are using older versions of google-signin, try old style result
    //   //   idToken = signInResult.idToken;
    //   // }
    //   // if (!idToken) {
    //   //   throw new Error('No ID token found');
    //   // }
      
    //   // console.log('Google ID token:', idToken);

    //   // // Create a Google credential with the token
    //   // const googleCredential = auth.GoogleAuthProvider.credential(signInResult.data.idToken);
    //   // console.log('Google credential:', googleCredential);
    //   // // Sign-in the user with the credential
    //   // return signInWithCredential(  auth, googleCredential);

    //   } catch (error) {
    //     console.error("Error:", error.message);
    //     alert(error.message);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }


  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    job: "",
    phoneNumber: "",
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

    try{
      setIsLoading(true);
     
      registerUser(user.email, user.password, user);

      setMainUser(user);
      router.replace("/home");

    } catch (error) {
      console.error("Error:", error.message );
      alert(error);
    } finally {
      setIsLoading(false);
    }
  };
  
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

          <View style={styles.inputContainer}>
            <Icon name="briefcase-outline" size={20} color="#000" style={styles.inputIcon} />
            <Picker
              selectedValue={user.job}
              style={styles.input}
              onValueChange={(itemValue) => setUser({ ...user, job: itemValue })}
            >
              <Picker.Item label="Select Job" value="" />
              <Picker.Item label="Consumer" value="consumer" />
              <Picker.Item label="Farmer" value="farmer" />
            </Picker>
          </View>

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
            <TouchableOpacity style={styles.socialButton} >
              <FontAwesome name="google" size={30} color="#DB4437" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity >
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


export default SignUp;

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

