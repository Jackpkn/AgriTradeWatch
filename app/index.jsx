import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BackHandler,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import logo from "../assets/images/logo.png";
import { GlobalContext } from "../context/GlobalProvider";
import { useContext, useEffect } from "react";
// import api from "../components/GlobalApi";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import {auth} from "../firebase"
import { onAuthStateChanged } from "firebase/auth";
import { enableScreens } from 'react-native-screens';


export default function Index() {
  enableScreens();
  const { setJwt, setMainUser, setIsLogged, mainUser, jwt } =
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

  return (
    <>
      <SafeAreaView>
        <ScrollView contentContainerStyle={{ height: "100%" }}>
          <View
            className="w-full h-[100%] justify-center items-center "
            style={{
              backgroundColor: "#49A760",
              height: "100%",
            }}
          >

            <Image
              source={logo}
              style={{
                resizeMode: "contain",
                width: 200,
                height: 200,
                marginTop: "30%",
                margin: "auto",
                marginBottom: "-30%",
              }}
            />

            <Text
              style={{
                textAlign: "center",
                fontSize: 30,
                fontWeight: "bold",
                marginTop: "35%",
                color: "white",
              }}
            >
              Welcome to
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 40,
                fontWeight: "bold",
                color: "white",
              }}
            >
              AgriTradeWatch
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontSize: 20,
                color: "white",
                marginTop: "15%",
              }}
            >
              Sign In with
            </Text>
            <View
              style={{
                marginTop: 10,
                marginBottom: 10,
                margin: "auto",
                width: "80%",
              }}
            >
              <Link
                href={"/signup"}
                style={{
                  width: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.21)",
                  borderColor: "white",
                  borderWidth: 2,
                  padding: 10,
                  borderRadius: 30,
                  marginBottom: 10,
                  textAlign: "center",
                  fontSize: 20,
                  color: "white",
                }}
              >
                Continue with Email
              </Link>
            </View>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 15,
                  color: "white",
                }}
              >
                Already have an account?
              </Text>
              <Link
                href={"/login"}
                style={{
                  textAlign: "center",
                  fontSize: 15,
                  color: "white",
                  textDecorationLine: "underline",
                  marginLeft: 5,
                }}
              >
                Login
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
