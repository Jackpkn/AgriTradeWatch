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
import React, { useContext, useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchCrops } from "@/components/crud";
import { GlobalContext } from "@/context/GlobalProvider";
import { Picker } from "@react-native-picker/picker";

// We'll get dimensions dynamically in the component

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
  const [consumerCropName, setConsumerCropName] = useState(""); // Will be set dynamically
  const [farmerCropName, setFarmerCropName] = useState(""); // Will be set dynamically
  const [refreshing, setRefreshing] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [showConsumerAnalytics, setShowConsumerAnalytics] = useState(true);
  const [showFarmerAnalytics, setShowFarmerAnalytics] = useState(true);
  const [screenData, setScreenData] = useState(Dimensions.get("window"));
  const [isLandscape, setIsLandscape] = useState(false);

  // Create styles early so they're available throughout the component
  const styles = useMemo(() => createStyles(isLandscape, screenData.width), [isLandscape, screenData.width]);

  // Add component lifecycle logging
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  // Handle orientation changes
  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
      setIsLandscape(result.window.width > result.window.height);
    };

    const subscription = Dimensions.addEventListener("change", onChange);

    // Set initial orientation
    const initialDimensions = Dimensions.get("window");
    setScreenData(initialDimensions);
    setIsLandscape(initialDimensions.width > initialDimensions.height);

    return () => subscription?.remove();
  }, []);

  // Dynamic crop options based on available data
  const cropOptions = useMemo(() => {
    const allCrops = [...consumerCrops, ...farmerCrops];
    const uniqueCrops = [...new Set(allCrops.map(crop => crop?.name || crop?.commodity).filter(Boolean))];
    
    const cropIcons = {
      'onion': '🧅',
      'tomato': '🍅',
      'wheat': '🌾',
      'lemon': '🍋',
      'grape': '🍇',
      'grapes': '🍇',
      'coriander': '🌿',
      'drumstick': '🥬',
      'garlic': '🧄',
      'default': '🌾'
    };
    
    return uniqueCrops.map(crop => ({
      label: crop.charAt(0).toUpperCase() + crop.slice(1),
      value: crop.toLowerCase(),
      icon: cropIcons[crop.toLowerCase()] || cropIcons.default
    }));
  }, [consumerCrops, farmerCrops]);

  const CropChart = ({
    cropsArray,
    cropName,
    type,
    showAnalytics,
    onToggleAnalytics,
    screenData,
    isLandscape,
  }) => {
    try {
      // Add null/undefined checks for cropsArray
      if (!cropsArray || !Array.isArray(cropsArray)) { 
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="refresh-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>Loading crop data...</Text>
          </View>
        );
      }
    } catch (error) {
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
      (crop) => {
        if (!crop) return false;
        const cropNameToCheck = crop.name || crop.commodity;
        return cropNameToCheck && cropNameToCheck.toLowerCase() === cropName.toLowerCase();
      }
    );

    // Debug logging
    console.log(`Stats: Filtering ${cropName} from ${cropsArray.length} crops`);
    console.log(`Stats: Found ${filteredCrops.length} matching crops`);
    
    // Show available crop names for debugging
    const availableCrops = [...new Set(cropsArray.map(crop => crop?.name || crop?.commodity).filter(Boolean))];
    console.log('Stats: Available crop names:', availableCrops);
    console.log('Stats: Looking for crop name:', cropName);
    
    if (filteredCrops.length > 0) {
      console.log('Stats: Sample filtered crop:', filteredCrops[0]);
    } else {
      console.log('Stats: No crops found. Sample crop data:', cropsArray[0]);
    }

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

    // Sort by timestamp (handle null dates by using current time)
    filteredCrops.sort((a, b) => {
      const timestampA = a.location?.timestamp || a.createdAt?.seconds * 1000 || Date.now();
      const timestampB = b.location?.timestamp || b.createdAt?.seconds * 1000 || Date.now();
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

    // Safe calculation of min/max values and additional statistics
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

    // Calculate median price
    const sortedValues = [...values].sort((a, b) => a - b);
    let medianValue;
    if (sortedValues.length % 2 === 0) {
      const mid1 = sortedValues[Math.floor(sortedValues.length / 2) - 1];
      const mid2 = sortedValues[Math.floor(sortedValues.length / 2)];
      medianValue = (mid1 + mid2) / 2;
    } else {
      medianValue = sortedValues[Math.floor(sortedValues.length / 2)];
    }

    // Calculate average price
    const averageValue =
      values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate price range
    const priceRange = maxValue - minValue;

    // Calculate price volatility (percentage)
    const priceVolatility =
      minValue > 0 ? ((priceRange / minValue) * 100).toFixed(1) : 0;

    // Calculate TODAY's prices specifically
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const todayData = data.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= startOfToday && itemDate < endOfToday;
    });

    const todayValues = todayData
      .map((d) => d.value)
      .filter((val) => !isNaN(val) && val > 0);

    let todayHighest = 0;
    let todayLowest = 0;
    let todayAverage = 0;

    if (todayValues.length > 0) {
      todayHighest = Math.max(...todayValues);
      todayLowest = Math.min(...todayValues);
      todayAverage =
        todayValues.reduce((sum, val) => sum + val, 0) / todayValues.length;
    }

    const chartWidth = Math.max(
      screenData.width - 40,
      data.length * (isLandscape ? 100 : 80)
    );

    const gradientColors =
      type === "consumer" ? ["#49A760", "#3d8b4f"] : ["#2196F3", "#1976D2"];

    return (
      <View style={styles.chartWrapper}>
        {/* Toggle Button for Market Analytics */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={onToggleAnalytics}
        >
          <Ionicons
            name={showAnalytics ? "eye-off" : "eye"}
            size={20}
            color="#49A760"
          />
          <Text style={styles.toggleButtonText}>
            {showAnalytics ? "Hide" : "Show"} Market Analytics
          </Text>
          <Ionicons
            name={showAnalytics ? "chevron-up" : "chevron-down"}
            size={16}
            color="#49A760"
          />
        </TouchableOpacity>

        {/* Enhanced Market Analytics Stats */}
        {showAnalytics && (
          <View style={styles.marketAnalyticsContainer}>
            <Text style={styles.marketAnalyticsTitle}>Market Analytics</Text>

            {/* TODAY'S PRICES - Highlighted Section */}
            <View style={styles.todayPricesSection}>
              <Text style={styles.todayPricesTitle}>📅 Today's Prices</Text>
              <View style={styles.todayPricesRow}>
                <View style={styles.todayPriceItem}>
                  <Ionicons name="trending-up" size={24} color="#49A760" />
                  <Text style={styles.todayPriceValue}>₹{todayHighest}</Text>
                  <Text style={styles.todayPriceLabel}>Highest Today</Text>
                  <Text style={styles.todayPriceCount}>
                    {todayValues.length} entries
                  </Text>
                </View>
                <View style={styles.todayPriceItem}>
                  <Ionicons name="trending-down" size={24} color="#FF6B6B" />
                  <Text style={styles.todayPriceValue}>₹{todayLowest}</Text>
                  <Text style={styles.todayPriceLabel}>Lowest Today</Text>
                  <Text style={styles.todayPriceCount}>
                    {todayValues.length} entries
                  </Text>
                </View>
              </View>
              {todayValues.length > 0 && (
                <View style={styles.todayAverageRow}>
                  <Ionicons name="analytics" size={20} color="#FF9800" />
                  <Text style={styles.todayAverageText}>
                    Today's Average: ₹{todayAverage.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* OVERALL MARKET STATS */}
            <Text style={styles.overallStatsTitle}>
              📊 Overall Market Stats
            </Text>

            {/* Primary Stats Row */}
            <View style={styles.primaryStatsRow}>
              <View style={styles.primaryStatItem}>
                <Ionicons name="trending-up" size={20} color="#49A760" />
                <Text style={styles.primaryStatValue}>₹{maxValue}</Text>
                <Text style={styles.primaryStatLabel}>All Time High</Text>
              </View>
              <View style={styles.primaryStatItem}>
                <Ionicons name="trending-down" size={20} color="#FF6B6B" />
                <Text style={styles.primaryStatValue}>₹{minValue}</Text>
                <Text style={styles.primaryStatLabel}>All Time Low</Text>
              </View>
              <View style={styles.primaryStatItem}>
                <Ionicons name="analytics" size={20} color="#FF9800" />
                <Text style={styles.primaryStatValue}>
                  ₹{medianValue.toFixed(1)}
                </Text>
                <Text style={styles.primaryStatLabel}>Overall Median</Text>
              </View>
            </View>

            {/* Secondary Stats Row */}
            <View style={styles.secondaryStatsRow}>
              <View style={styles.secondaryStatItem}>
                <Ionicons name="pulse" size={16} color="#9C27B0" />
                <Text style={styles.secondaryStatValue}>
                  ₹{averageValue.toFixed(1)}
                </Text>
                <Text style={styles.secondaryStatLabel}>Overall Avg</Text>
              </View>
              <View style={styles.secondaryStatItem}>
                <Ionicons name="resize" size={16} color="#607D8B" />
                <Text style={styles.secondaryStatValue}>₹{priceRange}</Text>
                <Text style={styles.secondaryStatLabel}>Price Range</Text>
              </View>
              <View style={styles.secondaryStatItem}>
                <Ionicons name="trending-up" size={16} color="#E91E63" />
                <Text style={styles.secondaryStatValue}>
                  {priceVolatility}%
                </Text>
                <Text style={styles.secondaryStatLabel}>Volatility</Text>
              </View>
              <View style={styles.secondaryStatItem}>
                <Ionicons name="bar-chart" size={16} color="#795548" />
                <Text style={styles.secondaryStatValue}>{data.length}</Text>
                <Text style={styles.secondaryStatLabel}>Total Points</Text>
              </View>
            </View>
          </View>
        )}

        {/* Original Chart Stats (keeping for compatibility) */}
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
      
      // Debug logging
      console.log('Stats: Consumer data received:', consumerData?.length || 0, 'items');
      console.log('Stats: Farmer data received:', farmerData?.length || 0, 'items');
      if (consumerData && consumerData.length > 0) {
        console.log('Stats: Sample consumer data:', consumerData[0]);
        console.log('Stats: Consumer data names:', consumerData.slice(0, 5).map(c => c?.name || c?.commodity));
      }
      if (farmerData && farmerData.length > 0) {
        console.log('Stats: Sample farmer data:', farmerData[0]);
        console.log('Stats: Farmer data names:', farmerData.slice(0, 5).map(c => c?.name || c?.commodity));
      }
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

  // Set default crop names when data is loaded
  useEffect(() => {
    if (cropOptions.length > 0) {
      if (!consumerCropName) {
        setConsumerCropName(cropOptions[0].value);
      }
      if (!farmerCropName) {
        setFarmerCropName(cropOptions[0].value);
      }
    }
  }, [cropOptions, consumerCropName, farmerCropName]);

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
              selectedValue={selectedValue || (cropOptions.length > 0 ? cropOptions[0].value : "")}
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
                showAnalytics={showConsumerAnalytics}
                onToggleAnalytics={() =>
                  setShowConsumerAnalytics(!showConsumerAnalytics)
                }
                screenData={screenData}
                isLandscape={isLandscape}
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
                showAnalytics={showFarmerAnalytics}
                onToggleAnalytics={() =>
                  setShowFarmerAnalytics(!showFarmerAnalytics)
                }
                screenData={screenData}
                isLandscape={isLandscape}
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

// Function to create responsive styles
const createStyles = (isLandscape, screenWidth) =>
  StyleSheet.create({
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
      fontSize: 24,
      fontWeight: "800",
      color: "#fff",
      marginTop: 12,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      lineHeight: 20,
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
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
      marginLeft: 12,
    },
    selectorContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    selectorLabel: {
      fontSize: 14,
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
      fontSize: 20,
      marginRight: 12,
    },
    selectedCropText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1F4E3D",
      flex: 1,
    },
    picker: {
      height: 50,
      color: "#1F4E3D",
    },
    pickerItem: {
      fontSize: 14,
    },
    chartWrapper: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    toggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#e9ecef",
      gap: 8,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#49A760",
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
      fontSize: 16,
      fontWeight: "700",
      color: "#1F4E3D",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: "#666",
      fontWeight: "500",
    },
    chartScrollContainer: {
      paddingRight: 20,
    },
    chartContainer: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: isLandscape ? 20 : 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
      minHeight: isLandscape ? 320 : 280,
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
      fontSize: 14,
      fontWeight: "600",
      color: "#666",
      marginTop: 16,
      textAlign: "center",
    },
    noDataSubtext: {
      fontSize: 12,
      color: "#999",
      marginTop: 8,
      textAlign: "center",
    },
    // Market Analytics Styles
    marketAnalyticsContainer: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: "#f0f0f0",
    },
    marketAnalyticsTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1F4E3D",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    primaryStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: isLandscape ? 16 : 12,
      flexWrap: isLandscape ? "nowrap" : "wrap",
    },
    primaryStatItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e9ecef",
      minHeight: 80,
    },
    primaryStatValue: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1F4E3D",
      marginTop: 8,
      marginBottom: 4,
    },
    primaryStatLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: "#666",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    secondaryStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: isLandscape ? 12 : 8,
      flexWrap: isLandscape ? "nowrap" : "wrap",
    },
    secondaryStatItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#e9ecef",
      minHeight: 60,
    },
    secondaryStatValue: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F4E3D",
      marginTop: 6,
      marginBottom: 2,
    },
    secondaryStatLabel: {
      fontSize: 9,
      fontWeight: "600",
      color: "#666",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    // Today's Prices Styles
    todayPricesSection: {
      backgroundColor: "#f0f9ff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: "#49A760",
      borderStyle: "dashed",
    },
    todayPricesTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#49A760",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    todayPricesRow: {
      flexDirection: isLandscape ? "row" : "row",
      justifyContent: "space-between",
      gap: isLandscape ? 20 : 16,
      flexWrap: isLandscape ? "nowrap" : "wrap",
    },
    todayPriceItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    todayPriceValue: {
      fontSize: 20,
      fontWeight: "800",
      color: "#1F4E3D",
      marginTop: 8,
      marginBottom: 4,
    },
    todayPriceLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: "#49A760",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    todayPriceCount: {
      fontSize: 9,
      color: "#666",
      textAlign: "center",
      fontStyle: "italic",
    },
    todayAverageRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
      gap: 8,
    },
    todayAverageText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FF9800",
      textAlign: "center",
    },
    overallStatsTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F4E3D",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

export default stats;
