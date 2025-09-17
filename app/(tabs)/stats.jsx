import { LineChart } from "react-native-gifted-charts";
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useContext, useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchCrops } from "@/components/crud";
import { GlobalContext } from "@/context/GlobalProvider";
import { authService } from "@/services";
import { debugTokenStatus, testAPIConnection } from "@/services/api";
import { Picker } from "@react-native-picker/picker";
import { useOrientation } from "@/utils/orientationUtils";
import { createStatsStyles } from "@/utils/responsiveStyles";

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

  const { setIsLoading = () => {}, isLogged = false } = contextValue || {};
  const [consumerCrops, setConsumerCrops] = useState([]);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [consumerCropName, setConsumerCropName] = useState(""); // Will be set dynamically
  const [farmerCropName, setFarmerCropName] = useState(""); // Will be set dynamically
  const [refreshing, setRefreshing] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [showConsumerAnalytics, setShowConsumerAnalytics] = useState(true);
  const [showFarmerAnalytics, setShowFarmerAnalytics] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Use orientation hook
  const { screenData, isLandscape, width, breakpoints } = useOrientation();

  // Create responsive styles
  const styles = useMemo(() => createStatsStyles(isLandscape, width), [isLandscape, width]);

  // Add component lifecycle logging
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
    };
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


    
    // Show available crop names for debugging
    const availableCrops = [...new Set(cropsArray.map(crop => crop?.name || crop?.commodity).filter(Boolean))];
    
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
      // Check if user is logged in
      if (!isLogged) {
        setAuthError("Please login to view market analytics");
        setConsumerCrops([]);
        setFarmerCrops([]);
        return;
      }

      // Check if we have a valid token
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setAuthError("Authentication required. Please login again.");
        setConsumerCrops([]);
        setFarmerCrops([]);
        return;
      }

      // Debug token status
      await debugTokenStatus();
      
      // Test API connection
      await testAPIConnection();

      setAuthError(null);
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

      // Show success message if we got data
      const totalData = (consumerData?.length || 0) + (farmerData?.length || 0);
      if (totalData > 0) {
        console.log(`✅ Successfully loaded ${totalData} market data points`);
      } else {
        console.log('ℹ️ No market data available yet');
      }
    } catch (error) {
      console.error("Error fetching crops:", error);
      
      // Handle authentication errors specifically
      if (error.status === 401 || error.status === 403) {
        setAuthError("Server authentication issue detected. The API server may not be properly configured for JWT authentication. Please contact the administrator.");
        Alert.alert(
          "Authentication Error", 
          "The server is not accepting authentication tokens. This appears to be a server configuration issue. Please contact the administrator or try again later."
        );
      } else {
        setAuthError("Failed to fetch market data. Please try again.");
        Alert.alert("Error", "Failed to fetch crop data. Please try again.");
      }
      
      // Set empty arrays on error to prevent iteration issues
      setConsumerCrops([]);
      setFarmerCrops([]);
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

  // Listen for auth state changes to refetch data when user logs in
  useEffect(() => {
    if (isComponentMounted && isLogged) {
      console.log("User logged in, refetching stats data");
      fetchAllCrops();
    }
  }, [isLogged, isComponentMounted]);

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

  // Authentication error screen
  const AuthErrorScreen = () => (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
        <View style={styles.noDataContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#ff6b6b" />
          <Text style={styles.noDataText}>Authentication Required</Text>
          <Text style={styles.noDataSubtext}>
            {authError || "Please login to view market analytics"}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              borderRadius: 12,
              overflow: 'hidden',
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={() => {
              // Navigate to login screen
              const { router } = require('expo-router');
              router.replace('/');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#49A760", "#3d8b4f"]}
              style={{
                paddingVertical: 15,
                paddingHorizontal: 30,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="log-in-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}>Go to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );

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

  // Show auth error screen if not logged in or auth error
  if (!isLogged || authError) {
    return <AuthErrorScreen />;
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

export default stats;
