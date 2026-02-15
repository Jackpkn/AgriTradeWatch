import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  InteractionManager,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

import { produceService } from "@/services";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobal } from "@/context/global-provider";
import DigitalThelaMap from "@/components/map/DigitalThelaMap";

// Types
interface DTEntry {
  id: number;
  username_id: string;
  sale_commodity: string;
  variety_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  quantity_for_sale: number;
  cost: number;
  unit: string;
  photo_or_video?: string;
  description?: string;
  description_voice?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fffe"
  },
  pickerContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: -22,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#9C27B0",
    overflow: "hidden",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7B1FA2",
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 4,
    marginBottom: -4,
    backgroundColor: "#f3e5f5",
  },
  picker: {
    color: "#333",
    height: 56,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loadingText: {
    marginTop: 0,
    fontSize: 16,
    color: "#666",
  },
  mapContainer: {
    flex: 1,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#9C27B0",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabContainer: {
    position: "absolute",
    bottom: 36,
    left: 12,
    zIndex: 1000,
    elevation: 10,
  },
  detailsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxHeight: 200,
  },
  detailsHeader: {
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  detailsHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7B1FA2",
  },
  detailsList: {
    maxHeight: 160,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailItemLeft: {
    flex: 1,
  },
  detailItemRight: {
    alignItems: "flex-end",
  },
  detailSeller: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  detailVariety: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  detailQuantity: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9C27B0",
    textAlign: "right",
  },
  detailPrice: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    textAlign: "right",
  },
});

const DigitalThela: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { userRole, currentLocation } = useGlobal();

  // Check if user can add produce (only farmers and retailers)
  const canAddProduce = userRole === 'farmer' || userRole === 'retailer';

  // Get user location from global context
  const userLocation: UserLocation | null = currentLocation
    ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
    : null;

  // State
  const [allEntries, setAllEntries] = useState<DTEntry[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<string[]>([]);

  // Auto-reload data and handle Android hardware back button when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      console.log("Digital Thela screen focused - refreshing data");
      fetchAllEntries();

      // Handle back button
      const onBackPress = () => {
        navigation.goBack();
        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [navigation])
  );

  const fetchAllEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await produceService.getAllDTEntries();

      if (response.success && response.data) {
        setAllEntries(response.data);

        // Extract unique commodities from the data
        const uniqueCommodities = Array.from(
          new Set(response.data.map((entry: DTEntry) => entry.sale_commodity))
        ).sort();

        setCommodities(uniqueCommodities);

        // Set the first commodity as default if not already set
        if (uniqueCommodities.length > 0 && !selectedCommodity) {
          setSelectedCommodity(uniqueCommodities[0]);
        }
      } else {
        setError(response.error || "Failed to fetch entries");
        setAllEntries([]);
      }
    } catch (err: any) {
      console.error("Error fetching DT entries:", err);
      setError(err.message || "An unexpected error occurred");
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Use ref to prevent duplicate navigation calls
  const navigatingRef = React.useRef(false);

  const handleAddProduce = useCallback(() => {
    if (navigatingRef.current) return;

    navigatingRef.current = true;
    requestAnimationFrame(() => {
      navigation.navigate("add-produce" as never);
      // Reset after navigation
      setTimeout(() => {
        navigatingRef.current = false;
      }, 1000);
    });
  }, [navigation]);

  const handleUsernamePress = useCallback((username: string) => {
    if (navigatingRef.current) return;

    navigatingRef.current = true;
    requestAnimationFrame(() => {
      navigation.navigate("farmer-profile" as never, { username } as never);
      // Reset after navigation
      setTimeout(() => {
        navigatingRef.current = false;
      }, 500);
    });
  }, [navigation]);

  // Filter entries based on selected commodity
  const filteredEntries = useMemo(() => {
    if (!selectedCommodity) {
      return allEntries;
    }
    return allEntries.filter(
      (entry) => entry.sale_commodity.toLowerCase() === selectedCommodity.toLowerCase()
    );
  }, [allEntries, selectedCommodity]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>
            {t.digitalThela?.loadingEntries || "Loading entries..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllEntries}>
            <Text style={styles.retryButtonText}>
              {t.common?.retry || "Retry"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Commodity Picker */}
      {commodities.length > 0 && (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Commodity</Text>
          <Picker
            selectedValue={selectedCommodity}
            onValueChange={(value) => setSelectedCommodity(value)}
            style={styles.picker}
            dropdownIconColor="#7B1FA2"
          >
            <Picker.Item label="All Commodities" value={null} />
            {commodities.map((commodity) => (
              <Picker.Item
                key={commodity}
                label={commodity.charAt(0).toUpperCase() + commodity.slice(1)}
                value={commodity}
              />
            ))}
          </Picker>
        </View>
      )}

      {/* Commodity Details */}
      {filteredEntries.length > 0 && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsHeaderText}>
              {selectedCommodity
                ? `${selectedCommodity.charAt(0).toUpperCase() + selectedCommodity.slice(1)} Listings (${filteredEntries.length})`
                : `All Listings (${filteredEntries.length})`
              }
            </Text>
          </View>
          <ScrollView style={styles.detailsList}>
            {filteredEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.detailItem}
                onPress={() => handleUsernamePress(entry.username_id)}
                activeOpacity={0.7}
              >
                <View style={styles.detailItemLeft}>
                  <Text style={styles.detailSeller}>{entry.username_id}</Text>
                  <Text style={styles.detailVariety}>
                    {entry.variety_name}
                  </Text>
                </View>
                <View style={styles.detailItemRight}>
                  <Text style={styles.detailQuantity}>
                    {entry.quantity_for_sale} {entry.unit}
                  </Text>
                  <Text style={styles.detailPrice}>
                    ₹{entry.cost}/{entry.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map Section */}
      {filteredEntries.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.noDataText}>
            {selectedCommodity
              ? `No ${selectedCommodity} listings available`
              : "No entries available"}
          </Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <DigitalThelaMap
            entries={filteredEntries}
            selectedCommodity={selectedCommodity}
            onUsernamePress={handleUsernamePress}
            userLocation={userLocation}
          />
        </View>
      )}

      {/* Floating Add Button - only for farmers and retailers */}
      {canAddProduce && (
        <View style={styles.fabContainer} collapsable={false}>
          <TouchableOpacity
            onPress={handleAddProduce}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={["#9C27B0", "#7B1FA2"]}
              style={styles.fabButton}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default DigitalThela;
