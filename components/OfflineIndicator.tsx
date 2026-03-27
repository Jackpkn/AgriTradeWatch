
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useGlobal } from "@/context/global-provider";
import { useTranslation } from "@/hooks/useTranslation";
import { refreshNetworkStatus, getNetworkStatus } from "@/utils/networkUtils";

const OfflineIndicator = ({ style = {} }) => {
  const { isOnline, } = useGlobal();
  const { t, interpolate } = useTranslation();

  if (isOnline) return null; // Don't show anything if online

  const handleCheckConnection = async () => {
    try {
      // Refresh network status
      const isConnected = await refreshNetworkStatus();

      // Get detailed network status
      const networkStatus = await getNetworkStatus();

      if (isConnected) {
        Alert.alert(
          t.network.connectionRestored,
          t.network.connectionRestoredMessage,
          [{ text: t.common.great }]
        );
      } else {
        Alert.alert(
          t.network.stillOffline,
          interpolate(t.network.networkStatus, { type: networkStatus.type || 'Unknown' }) +
          '\n' + interpolate(t.network.internetReachable, { status: networkStatus.isInternetReachable ? 'Yes' : 'No' }) +
          '\n\n' + t.network.checkNetworkSettings,
          [
            { text: t.common.cancel, style: "cancel" },
            { text: t.common.tryAgain, onPress: handleCheckConnection }
          ]
        );
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      Alert.alert(
        t.network.connectionCheckFailed,
        t.network.unableToCheckNetwork,
        [{ text: t.common.ok }]
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
            {t.network.youreOffline}
          </Text>
          <Text style={{
            fontSize: 10,
            color: "#856404",
            opacity: 0.8
          }}>
            {t.network.someFeaturesMayNotWork}
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
          {t.common.retry}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineIndicator;
