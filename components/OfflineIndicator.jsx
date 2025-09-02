import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useContext } from "react";
import { GlobalContext } from "@/context/GlobalProvider";

const OfflineIndicator = ({ style = {} }) => {
  const { isOnline, networkType } = useContext(GlobalContext);

  if (isOnline) return null; // Don't show anything if online

  const handleCheckConnection = () => {
    Alert.alert(
      "Connection Check",
      `Network Status: ${networkType || 'Unknown'}\n\nIf you're seeing this message, your device may be offline. Please check your internet connection and try again.`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[{
      backgroundColor: "#fff3cd",
      padding: 8,
      margin: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#ffeaa7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>📶</Text>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 12,
            color: "#856404",
            fontWeight: "600"
          }}>
            You're offline
          </Text>
          <Text style={{
            fontSize: 10,
            color: "#856404",
            opacity: 0.8
          }}>
            Some features may not work
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleCheckConnection}
        style={{
          backgroundColor: "#856404",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4
        }}
      >
        <Text style={{
          fontSize: 10,
          color: "#fff",
          fontWeight: "600"
        }}>
          Check
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineIndicator;
