import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "react-native-paper";
import { useEffect } from "react";

export default function Index() {

  return (
    <>
      <SafeAreaView>
        <ScrollView contentContainerStyle={{ height: "100%" }}>
          <View className="w-full h-[100%] justify-center items-center ">
            <ImageBackground
              style={{
                height: "100%",
                width: "100%",
                opacity: 0.85,
                backgroundColor: "rgba(255,255,255,0.5)",
              }}
              source={require("../assets/images/backgroundImg.png")}
            >
               <Button
                style={{
                  width:"20%",
                  position: "absolute", 
                  top: 0,
                  right: 0,
                  margin: 10,
                  backgroundColor: "#49A760",
                }}
                textColor="white"
                mode="contained"
                onPress={() => router.push("/home")}
              >
                Skip
              </Button>
              <Text style={{
                textAlign: "center",
                fontSize: 30,
                fontWeight: "bold",
                marginTop: "40%",
                color: "white",
              }}>
                Welcome to 
              </Text>
              <Text>
                AgriTradeWatch
              </Text>
            </ImageBackground>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
