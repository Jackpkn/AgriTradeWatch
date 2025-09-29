
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useGlobal } from "@/context/global-provider";
import { refreshNetworkStatus, getNetworkStatus } from "@/utils/networkUtils";

const OfflineIndicator = ({ style = {} }) => {
  const { isOnline, } = useGlobal();

  if (isOnline) return null; // Don't show anything if online

  const handleCheckConnection = async () => {
    try {
      // Refresh network status
      const isConnected = await refreshNetworkStatus();

      // Get detailed network status
      const networkStatus = await getNetworkStatus();

      if (isConnected) {
        Alert.alert(
          "Connection Restored! 🎉",
          "Your internet connection is now active. The app will automatically refresh.",
          [{ text: "Great!" }]
        );
      } else {
        Alert.alert(
          "Still Offline",
          `Network Status: ${networkStatus.type || 'Unknown'}\nInternet Reachable: ${networkStatus.isInternetReachable ? 'Yes' : 'No'}\n\nPlease check your internet connection and try again.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Try Again", onPress: handleCheckConnection }
          ]
        );
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      Alert.alert(
        "Connection Check Failed",
        "Unable to check network status. Please try again.",
        [{ text: "OK" }]
      );
    }
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
          borderRadius: 4,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <Ionicons name="refresh" size={12} color="#fff" style={{ marginRight: 4 }} />
        <Text style={{
          fontSize: 10,
          color: "#fff",
          fontWeight: "600"
        }}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineIndicator;
