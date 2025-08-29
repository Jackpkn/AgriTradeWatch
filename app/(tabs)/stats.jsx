import { LineChart } from "react-native-gifted-charts";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchCrops } from "../../components/crud";
import { GlobalContext } from "../../context/GlobalProvider";
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window");

const stats = () => {
  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    console.error("Error accessing GlobalContext in stats:", error);
    contextValue = {};
  }

  const { setIsLoading = () => {} } = contextValue || {};
  const [consumerCrops, setConsumerCrops] = useState([]);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [consumerCropName, setConsumerCropName] = useState("onion"); // Default selection
  const [farmerCropName, setFarmerCropName] = useState("onion"); // Default selection
  const [refreshing, setRefreshing] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  // Add component lifecycle logging
  useEffect(() => {
    console.log("Stats component mounted");
    setIsComponentMounted(true);
    return () => {
      console.log("Stats component unmounted");
      setIsComponentMounted(false);
    };
  }, []);

  const cropOptions = [
    { label: "Onion", value: "onion", icon: "🧅" },
    { label: "Tomato", value: "tomato", icon: "🍅" },
    { label: "Wheat", value: "wheat", icon: "🌾" },
    { label: "Lemon", value: "lemon", icon: "🍋" },
    { label: "Grapes", value: "grape", icon: "🍇" },
    { label: "Coriander", value: "coriander", icon: "🌿" },
    { label: "Drumstick", value: "drumstick", icon: "🥬" },
    { label: "Garlic", value: "garlic", icon: "🧄" },
  ];

  const CropChart = ({ cropsArray, cropName, type }) => {
    try {
      // Add null/undefined checks for cropsArray
      if (!cropsArray || !Array.isArray(cropsArray)) {
        console.log(`CropChart ${type}: Invalid cropsArray`, typeof cropsArray);
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="refresh-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>Loading crop data...</Text>
          </View>
        );
      }
    } catch (error) {
      console.error(`CropChart ${type} error:`, error);
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>Error loading chart</Text>
        </View>
      );
    }

    if (!cropName || cropName.trim() === "") {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
          <Text style={styles.noDataText}>
            Select a crop to view statistics
          </Text>
        </View>
      );
    }

    const filteredCrops = cropsArray.filter(
      (crop) =>
        crop && crop.name && crop.name.toLowerCase() === cropName.toLowerCase()
    );

    if (filteredCrops.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>
            No data available for {cropName}
          </Text>
          <Text style={styles.noDataSubtext}>
            Try selecting a different crop
          </Text>
        </View>
      );
    }

    // Sort by timestamp
    filteredCrops.sort((a, b) => {
      const timestampA = a.location?.timestamp || a.createdAt?.seconds * 1000;
      const timestampB = b.location?.timestamp || b.createdAt?.seconds * 1000;
      return timestampA - timestampB;
    });

    // Process data points with additional safety checks
    const data = filteredCrops
      .filter((crop) => crop && typeof crop === "object") // Ensure crop is a valid object
      .map((crop) => {
        const timestamp =
          crop.location?.timestamp ||
          crop.createdAt?.seconds * 1000 ||
          Date.now();
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });
        const price = Number(crop.pricePerUnit);

        if (!isNaN(price) && price > 0) {
          return {
            label: formattedDate,
            value: price,
            timestamp: timestamp,
            dataPointText: `₹${price}`,
          };
        }
        return null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!data || data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>
            No valid price data for {cropName}
          </Text>
          <Text style={styles.noDataSubtext}>
            Check if price information is available
          </Text>
        </View>
      );
    }

    // Safe calculation of min/max values
    const values = data
      .map((d) => d.value)
      .filter((val) => !isNaN(val) && val > 0);
    if (values.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>
            Invalid price data for {cropName}
          </Text>
        </View>
      );
    }

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const chartWidth = Math.max(width - 40, data.length * 80);

    const gradientColors =
      type === "consumer" ? ["#49A760", "#3d8b4f"] : ["#2196F3", "#1976D2"];

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{maxValue}</Text>
            <Text style={styles.statLabel}>Peak Price</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{minValue}</Text>
            <Text style={styles.statLabel}>Low Price</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.length}</Text>
            <Text style={styles.statLabel}>Data Points</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <View style={styles.chartContainer}>
            <LineChart
              data={data || []}
              width={chartWidth}
              height={280}
              yAxisLabel="₹"
              xAxisLabelTextStyle={styles.xAxisLabel}
              yAxisLabelTextStyle={styles.yAxisLabel}
              showVerticalLines
              verticalLinesColor="rgba(0,0,0,0.1)"
              textColor={gradientColors[0]}
              color={gradientColors[0]}
              thickness={3}
              areaChart
              startFillColor={gradientColors[0]}
              endFillColor={gradientColors[1]}
              startOpacity={0.3}
              endOpacity={0.05}
              maxValue={maxValue + (maxValue - minValue) * 0.1}
              minValue={Math.max(0, minValue - (maxValue - minValue) * 0.1)}
              spacing={(data?.length || 0) > 10 ? 60 : 80}
              initialSpacing={20}
              endSpacing={20}
              rulesColor="rgba(0,0,0,0.1)"
              rulesType="solid"
              xAxisColor="#ddd"
              yAxisColor="#ddd"
              showDataPoints
              dataPointsColor={gradientColors[0]}
              dataPointsRadius={5}
              curved
              animateOnDataChange
              animationDuration={1000}
            />
          </View>
        </ScrollView>
      </View>
    );
  };

  const fetchAllCrops = async () => {
    try {
      setIsLoading(true);
      const [consumerData, farmerData] = await Promise.all([
        fetchCrops("consumers"),
        fetchCrops("farmers"),
      ]);

      // Ensure we always set arrays, even if the response is null/undefined
      setConsumerCrops(Array.isArray(consumerData) ? consumerData : []);
      setFarmerCrops(Array.isArray(farmerData) ? farmerData : []);
    } catch (error) {
      console.error("Error fetching crops:", error);
      // Set empty arrays on error to prevent iteration issues
      setConsumerCrops([]);
      setFarmerCrops([]);
      Alert.alert("Error", "Failed to fetch crop data. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllCrops();
  }, []);

  useEffect(() => {
    // Only fetch data if component is mounted and ready
    if (isComponentMounted) {
      console.log("Fetching crops data for stats component");
      fetchAllCrops();
    }
  }, [isComponentMounted]);

  const CropSelector = ({ selectedValue, onValueChange, crops, type }) => {
    try {
      // Add extensive safety checks
      if (!selectedValue || !onValueChange || !type) {
        console.log("CropSelector: Missing required props", {
          selectedValue,
          onValueChange: !!onValueChange,
          type,
        });
        return (
          <View style={styles.selectorContainer}>
            <Text style={styles.noDataText}>
              Invalid selector configuration
            </Text>
          </View>
        );
      }

      const selectedCrop =
        cropOptions && Array.isArray(cropOptions)
          ? cropOptions.find((crop) => crop && crop.value === selectedValue)
          : null;

      return (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>
            {type === "consumer" ? "Consumer" : "Farmer"} Crop Analysis
          </Text>
          <View style={styles.pickerContainer}>
            <View style={styles.selectedCropDisplay}>
              <Text style={styles.cropIcon}>{selectedCrop?.icon || "🌾"}</Text>
              <Text style={styles.selectedCropText}>
                {selectedCrop?.label || "Select Crop"}
              </Text>
            </View>
            <Picker
              selectedValue={selectedValue || "onion"}
              style={styles.picker}
              onValueChange={(value) => {
                try {
                  if (onValueChange && typeof onValueChange === "function") {
                    onValueChange(value);
                  }
                } catch (error) {
                  console.error("Picker onValueChange error:", error);
                }
              }}
              dropdownIconColor="#49A760"
            >
              {cropOptions && Array.isArray(cropOptions)
                ? cropOptions.map((item, index) => (
                    <Picker.Item
                      key={item?.value || `item-${index}`}
                      label={`${item?.icon || "🌾"} ${
                        item?.label || "Unknown"
                      }`}
                      value={item?.value || `value-${index}`}
                      style={styles.pickerItem}
                    />
                  ))
                : [
                    <Picker.Item
                      key="default"
                      label="🌾 Loading..."
                      value="loading"
                      style={styles.pickerItem}
                    />,
                  ]}
            </Picker>
          </View>
        </View>
      );
    } catch (error) {
      console.error(`CropSelector ${type} error:`, error);
      return (
        <View style={styles.selectorContainer}>
          <Text style={styles.noDataText}>Error loading selector</Text>
        </View>
      );
    }
  };

  // Safety check for component mounting
  if (!isComponentMounted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="refresh-outline" size={48} color="#ccc" />
          <Text style={styles.noDataText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error boundary for the entire component
  if (renderError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>Something went wrong</Text>
          <TouchableOpacity
            onPress={() => {
              setRenderError(null);
              fetchAllCrops();
            }}
          >
            <Text style={{ color: "#49A760", marginTop: 10 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  try {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#49A760"]}
                tintColor="#49A760"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.headerGradient}
              >
                <Ionicons name="analytics" size={32} color="#fff" />
                <Text style={styles.headerTitle}>Market Analytics</Text>
                <Text style={styles.headerSubtitle}>
                  Track and analyze crop price trends over time
                </Text>
              </LinearGradient>
            </View>

            {/* Consumer Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={["#49A760", "#3d8b4f"]}
                  style={styles.sectionHeaderGradient}
                >
                  <Ionicons name="person" size={24} color="#fff" />
                  <Text style={styles.sectionTitle}>Consumer Market</Text>
                </LinearGradient>
              </View>

              <CropSelector
                selectedValue={consumerCropName}
                onValueChange={setConsumerCropName}
                crops={consumerCrops}
                type="consumer"
              />

              <CropChart
                cropsArray={consumerCrops}
                cropName={consumerCropName}
                type="consumer"
              />
            </View>

            {/* Farmer Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={["#2196F3", "#1976D2"]}
                  style={styles.sectionHeaderGradient}
                >
                  <Ionicons name="leaf" size={24} color="#fff" />
                  <Text style={styles.sectionTitle}>Farmer Market</Text>
                </LinearGradient>
              </View>

              <CropSelector
                selectedValue={farmerCropName}
                onValueChange={setFarmerCropName}
                crops={farmerCrops}
                type="farmer"
              />

              <CropChart
                cropsArray={farmerCrops}
                cropName={farmerCropName}
                type="farmer"
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  } catch (error) {
    console.error("Stats component render error:", error);
    setRenderError(error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>Render Error</Text>
          <TouchableOpacity
            onPress={() => {
              setRenderError(null);
              fetchAllCrops();
            }}
          >
            <Text style={{ color: "#49A760", marginTop: 10 }}>Reload</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fffe",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    padding: 24,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 12,
  },
  selectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F4E3D",
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  selectedCropDisplay: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cropIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedCropText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F4E3D",
    flex: 1,
  },
  picker: {
    height: 50,
    color: "#1F4E3D",
  },
  pickerItem: {
    fontSize: 16,
  },
  chartWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chartStats: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  chartScrollContainer: {
    paddingRight: 20,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  xAxisLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "500",
  },
  yAxisLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    marginHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

export default stats;
