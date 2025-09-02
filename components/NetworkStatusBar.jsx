import React, { useContext } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalContext } from "@/context/GlobalProvider";

const NetworkStatusBar = () => {
  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    console.error("Error accessing GlobalContext in NetworkStatusBar:", error);
    contextValue = {};
  }

  const { isOnline = true, networkType = "unknown" } = contextValue || {};
  const [slideAnim] = React.useState(new Animated.Value(-50));

  React.useEffect(() => {
    if (!isOnline) {
      // Slide down when offline
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide up when online
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color="#fff" />
        <Text style={styles.text}>You're offline. Using cached data.</Text>
        <Ionicons name="information-circle" size={16} color="#fff" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ff6b6b",
    zIndex: 1000,
    elevation: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 44, // Account for status bar
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 8,
  },
});

export default NetworkStatusBar;
