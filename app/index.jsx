import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../assets/images/logo.png";
import { GlobalContext } from "../context/GlobalProvider";
import { useContext, useEffect, useCallback } from "react";
// import api from "../components/GlobalApi";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth";
import { enableScreens } from 'react-native-screens';


export default function Index() {
  enableScreens();
  const { setJwt, setMainUser, setIsLogged, mainUser, jwt } = useContext(GlobalContext);

  const onAuthStateChangedApp = useCallback((user) => {
    if (user) {
      router.replace("/home");
    } else {
      console.log("No user found");
    }
  }, []);

  useEffect(() => {
    const sub = onAuthStateChanged(auth, onAuthStateChangedApp);
    return sub;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7" }}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require("../assets/images/backgroundImg.png")}
        style={{ flex: 1, resizeMode: "cover" }}
        imageStyle={{ opacity: 0.15 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <View
              style={{
                backgroundColor: "#49A760",
                borderRadius: 100,
                padding: 10,
                elevation: 8,
                shadowColor: "#1F4E3D",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                marginBottom: 10,
              }}
            >
              <Image
                source={logo}
                style={{ width: 120, height: 120, resizeMode: "contain" }}
              />
            </View>
            <Text
              style={{
                fontSize: 36,
                fontWeight: "bold",
                color: "#1F4E3D",
                marginTop: 10,
                letterSpacing: 1,
                textShadowColor: "#aaf0c9",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}
            >
              MandiGo
            </Text>
            <Text
              style={{
                fontSize: 20,
                color: "#49A760",
                marginTop: 8,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Empowering Farmers & Consumers
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#1F4E3D",
                marginTop: 18,
                marginBottom: 18,
                textAlign: "center",
                paddingHorizontal: 30,
                lineHeight: 24,
              }}
            >
              Welcome! Connect, trade, and grow.
              Sign in to get started.
            </Text>
            <View style={{ width: "80%", marginTop: 10 }}>
              <Link
                href={"/signup"}
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  borderColor: "#49A760",
                  borderWidth: 2,
                  paddingVertical: 16,
                  paddingHorizontal: 0,
                  borderRadius: 30,
                  marginBottom: 14,
                  textAlign: "center",
                  fontSize: 20,
                  color: "#1F4E3D",
                  fontWeight: "bold",
                  letterSpacing: 1,
                  shadowColor: "#49A760",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 2,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#1F4E3D", fontWeight: "bold", fontSize: 20 }}>
                  Sign up with Email
                </Text>
              </Link>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontSize: 15, color: "#1F4E3D" }}>Already have an account?</Text>
              <Link
                href={"/login"}
                style={{
                  fontSize: 15,
                  color: "#49A760",
                  textDecorationLine: "underline",
                  marginLeft: 5,
                  fontWeight: "bold",
                }}
              >
                Login
              </Link>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}
