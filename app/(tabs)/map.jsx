import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Modal, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlobalContext } from "@/context/GlobalProvider"; 
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";

// Custom hooks
import { useMapData } from "@/hooks/useMapData";
import { useGeolocation } from "@/hooks/useGeolocation";

// Components
import ErrorBoundary from "@/components/ErrorBoundary";
import MapHeader from "@/components/map/MapHeader";
import InteractiveMap from "@/components/map/InteractiveMap";
import ConsumerInfoPanel from "@/components/map/ConsumerInfoPanel";
import PriceUnitToggle from "@/components/map/PriceUnitToggle";
import MapLegend from "@/components/map/MapLegend";
import PriceChart from "@/components/map/PriceChart";
import CropSelectionModal from "@/components/map/CropSelectionModal";
import OfflineIndicator from "@/components/OfflineIndicator";

// Utils and constants
import {
  processChartData,
  calculateConsumerStats,
} from "@/utils/chartDataProcessor";
import { MAP_CONFIG } from "@/constants/mapConfig";
import { createMapStyles } from "@/components/map/mapStyles";
import { performanceMonitor } from "@/utils/performance";
import { useOrientation } from "@/utils/orientationUtils";

const Map = () => {
  const { currentLocation } = useContext(GlobalContext);

  // Use orientation hook
  const { screenData, isLandscape, width, breakpoints } = useOrientation();

  // Create responsive styles
  const mapStyles = useMemo(() => createMapStyles(isLandscape, width), [isLandscape, width]);

  // State management
  const [selectedCrop, setSelectedCrop] = useState("onion");
  const [selectedMapType, setSelectedMapType] = useState("default");
  const [radius, setRadius] = useState(MAP_CONFIG.RADIUS.DEFAULT);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [priceUnit, setPriceUnit] = useState(
    MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_UNIT
  );
  
  // Price display states
  const [selectedDateRange, setSelectedDateRange] = useState('today'); // 'today', 'yesterday', 'custom'
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  
  // Price data state (will be populated from API)
  const [priceData, setPriceData] = useState({
    today: { min: 0, max: 0, modal: 0 },
    yesterday: { min: 0, max: 0, modal: 0 },
    custom: { min: 0, max: 0, modal: 0 }
  });
  const [priceLoading, setPriceLoading] = useState(false);

  // Custom hooks
  const {
    allConsumerCrops,
    allFarmerCrops,
    allCrops,
    loading: dataLoading,
    error: dataError,
  } = useMapData();
  const { filterCropsInRadius } = useGeolocation();

  // Refs
  const radiusTimeoutRef = useRef(null);
  const webViewRef = useRef(null);
  const sliderContainerRef = useRef(null);

  // Debounced radius setter to prevent infinite loops
  const debouncedSetRadius = useCallback((value) => {
    if (radiusTimeoutRef.current) {
      clearTimeout(radiusTimeoutRef.current);
    }
    radiusTimeoutRef.current = setTimeout(() => {
      setRadius(value);
      // Send radius update to WebView
      if (webViewRef.current) {
        const message = JSON.stringify({
          type: 'updateRadius',
          radius: value
        });
        webViewRef.current.injectJavaScript(`
          window.postMessage('${message}', '*');
        `);
      }
    }, MAP_CONFIG.RADIUS.DEBOUNCE_MS);
  }, []);

  // PanResponder for slider dragging
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (sliderContainerRef.current) {
        sliderContainerRef.current.measure((x, y, width, height, pageX, pageY) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          const percentage = Math.max(0, Math.min(1, touchX / width));
          const newRadius = (percentage * 500) / 1000; // Convert to km
          // Round to nearest 50m
          const roundedRadius = Math.round(newRadius * 1000 / 50) * 50 / 1000;
          debouncedSetRadius(roundedRadius);
        });
      }
    },
    onPanResponderRelease: () => {},
  }), [debouncedSetRadius]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (radiusTimeoutRef.current) {
        clearTimeout(radiusTimeoutRef.current);
      }
    };
  }, []);

  // Set initial marker position
  useEffect(() => {
    if (currentLocation?.coords && !markerPosition) {
      console.log("Setting initial marker position:", currentLocation.coords);
      setMarkerPosition({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
  }, [
    currentLocation?.coords?.latitude,
    currentLocation?.coords?.longitude,
    markerPosition,
  ]);

  // Fetch price data when date range changes or crop changes
  useEffect(() => {
    if (selectedDateRange === 'custom') {
      fetchPriceData('custom', customStartDate, customEndDate);
    } else {
      fetchPriceData(selectedDateRange);
    }
  }, [selectedDateRange, customStartDate, customEndDate, fetchPriceData]);
  
  // Fetch price data when crop changes
  useEffect(() => {
    if (selectedCrop && allCrops.length > 0) {
      fetchPriceData(selectedDateRange, customStartDate, customEndDate);
    }
  }, [selectedCrop, allCrops, fetchPriceData, selectedDateRange, customStartDate, customEndDate]);
  
  // Fetch initial price data when component mounts
  useEffect(() => {
    if (selectedCrop && allCrops.length > 0 && !dataLoading) {
      fetchPriceData('today');
    }
  }, [selectedCrop, allCrops, dataLoading, fetchPriceData]);

  // Filter crops based on radius and name with performance monitoring
  const filteredCrops = useMemo(() => {
    const startTime = performance.now();
    const result = filterCropsInRadius(
      allCrops,
      markerPosition,
      radius,
      selectedCrop
    );
    performanceMonitor.recordOperation(
      "filterCrops",
      performance.now() - startTime
    );
    return result;
  }, [allCrops, markerPosition, radius, selectedCrop, filterCropsInRadius]);

  // Filter consumers within radius
  const consumersInRadius = useMemo(
    () =>
      filterCropsInRadius(
        allConsumerCrops,
        markerPosition,
        radius,
        selectedCrop
      ),
    [
      allConsumerCrops,
      markerPosition,
      radius,
      selectedCrop,
      filterCropsInRadius,
    ]
  );

  // Consumer statistics
  const consumerStats = useMemo(
    () => calculateConsumerStats(consumersInRadius, priceUnit, selectedCrop),
    [consumersInRadius, priceUnit, selectedCrop]
  );

  // Process chart data with performance monitoring
  const consumerChartData = useMemo(() => {
    const startTime = performance.now();
    const result = processChartData(allConsumerCrops, selectedCrop, priceUnit);
    performanceMonitor.recordOperation(
      "processConsumerChart",
      performance.now() - startTime
    );
    return result;
  }, [allConsumerCrops, selectedCrop, priceUnit]);

  const farmerChartData = useMemo(() => {
    const startTime = performance.now();
    const result = processChartData(allFarmerCrops, selectedCrop, priceUnit);
    performanceMonitor.recordOperation(
      "processFarmerChart",
      performance.now() - startTime
    );
    return result;
  }, [allFarmerCrops, selectedCrop, priceUnit]);

  // Event handlers
  const handleMarkerMove = useCallback((newPosition) => {
    setMarkerPosition(newPosition);
  }, []);

  // Calculate price data from existing crop data based on date range
  const calculatePriceData = useCallback((dateRange, startDate = null, endDate = null) => {
    try {
      setPriceLoading(true);
      
      // Filter crops by the selected crop type
      const relevantCrops = allCrops.filter(crop => 
        crop.name?.toLowerCase() === selectedCrop.toLowerCase()
      );
      
      if (relevantCrops.length === 0) {
        setPriceData(prev => ({
          ...prev,
          [dateRange]: { min: 0, max: 0, modal: 0 }
        }));
        return;
      }
      
      let filteredCrops = relevantCrops;
      
      // Filter by date range if needed
      if (dateRange === 'custom' && startDate && endDate) {
        filteredCrops = relevantCrops.filter(crop => {
          if (!crop.createdAt) return false;
          
          const cropDate = new Date(crop.createdAt.seconds * 1000);
          return cropDate >= startDate && cropDate <= endDate;
        });
      } else if (dateRange === 'today') {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        
        filteredCrops = relevantCrops.filter(crop => {
          if (!crop.createdAt) return false;
          const cropDate = new Date(crop.createdAt.seconds * 1000);
          return cropDate >= startOfDay && cropDate < endOfDay;
        });
      } else if (dateRange === 'yesterday') {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000);
        
        filteredCrops = relevantCrops.filter(crop => {
          if (!crop.createdAt) return false;
          const cropDate = new Date(crop.createdAt.seconds * 1000);
          return cropDate >= startOfYesterday && cropDate < endOfYesterday;
        });
      }
      
      if (filteredCrops.length === 0) {
        setPriceData(prev => ({
          ...prev,
          [dateRange]: { min: 0, max: 0, modal: 0 }
        }));
        return;
      }
      
      // Extract prices and convert to numbers
      const prices = filteredCrops
        .map(crop => parseFloat(crop.pricePerUnit))
        .filter(price => !isNaN(price) && price > 0);
      
      if (prices.length === 0) {
        setPriceData(prev => ({
          ...prev,
          [dateRange]: { min: 0, max: 0, modal: 0 }
        }));
        return;
      }
      
      // Calculate min, max, and modal (most common) price
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Calculate modal price (most frequent price)
      const priceCounts = {};
      prices.forEach(price => {
        priceCounts[price] = (priceCounts[price] || 0) + 1;
      });
      
      let modalPrice = prices[0];
      let maxCount = 1;
      
      Object.entries(priceCounts).forEach(([price, count]) => {
        if (count > maxCount) {
          maxCount = count;
          modalPrice = parseFloat(price);
        }
      });
      
      const newPriceData = {
        min: minPrice,
        max: maxPrice,
        modal: modalPrice
      };
      
      setPriceData(prev => ({
        ...prev,
        [dateRange]: newPriceData
      }));
      
      console.log(`Price data calculated for ${dateRange}:`, {
        crop: selectedCrop,
        totalCrops: relevantCrops.length,
        filteredCrops: filteredCrops.length,
        prices: prices.length,
        priceData: newPriceData
      });
      
    } catch (error) {
      console.error('Error calculating price data:', error);
      setPriceData(prev => ({
        ...prev,
        [dateRange]: { min: 0, max: 0, modal: 0 }
      }));
    } finally {
      setPriceLoading(false);
    }
  }, [allCrops, selectedCrop]);
  
  // Fetch price data based on date range (now uses calculatePriceData)
  const fetchPriceData = useCallback(async (dateRange, startDate = null, endDate = null) => {
    calculatePriceData(dateRange, startDate, endDate);
  }, [calculatePriceData]);

  const handleCropSelect = useCallback((crop) => {
    setSelectedCrop(crop);
  }, []);

  const handleMapTypeChange = useCallback((mapType) => {
    setSelectedMapType(mapType);
  }, []);

  const handlePriceUnitChange = useCallback((unit) => {
    setPriceUnit(unit);
  }, []);

  // Debug logging (only in development)
  useEffect(() => {
    if (__DEV__) {
      console.log("Map visibility check:", {
        hasCurrentLocation: !!currentLocation,
        hasMarkerPosition: !!markerPosition,
        allCropsCount: allCrops.length,
        dataLoading,
        dataError: !!dataError,
      });
    }
  }, [currentLocation, markerPosition, allCrops, dataLoading, dataError]);

  // Loading state
  if (dataLoading) {
    return (
      <SafeAreaView style={mapStyles.container}>
        <View style={mapStyles.mapLoading}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={mapStyles.mapLoadingText}>Loading crop data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (dataError) {
    return (
      <SafeAreaView style={mapStyles.container}>
        <View style={mapStyles.mapLoading}>
          <Text style={mapStyles.mapLoadingText}>
            Error loading data. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={mapStyles.container}>
          {/* Header with controls */}
          <MapHeader
            selectedCrop={selectedCrop}
            selectedMapType={selectedMapType}
            onCropPress={() => setShowCropModal(true)}
            onMapTypeChange={handleMapTypeChange}
          />

          {/* Main Content Area */}
          <ScrollView
            style={mapStyles.contentScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Interactive Map Section */}
            <View style={mapStyles.mapContainer}>
              <InteractiveMap
                ref={webViewRef}
                markerPosition={markerPosition}
                allCrops={allCrops}
                radius={radius}
                selectedCrop={selectedCrop}
                selectedMapType={selectedMapType}
                onMarkerMove={handleMarkerMove}
              />
            </View>

            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Map Legend */}
            <MapLegend selectedCrop={selectedCrop} radius={radius} />

            {/* Price Information Section */}
            <View style={mapStyles.priceDisplaySection}>
              <Text style={mapStyles.priceSectionTitle}>Price Information</Text>
              
              {/* Show no data message */}
              {!priceLoading && priceData[selectedDateRange]?.min === 0 && (
                <View style={mapStyles.noDataMessage}>
                  <Text style={mapStyles.noDataText}>
                    No price data available for {selectedDateRange}. 
                    {selectedDateRange === 'custom' ? ' Select a date range to view prices.' : ' Prices will appear here once data is available.'}
                  </Text>
                </View>
              )}
            
              {/* Date Range Selector */}
              <View style={mapStyles.dateRangeSelector}>
                <TouchableOpacity
                  style={[
                    mapStyles.dateButton,
                    selectedDateRange === 'today' && mapStyles.dateButtonActive
                  ]}
                  onPress={() => {
                    setSelectedDateRange('today');
                    fetchPriceData('today');
                  }}
                >
                  <Text style={[
                    mapStyles.dateButtonText,
                    selectedDateRange === 'today' && mapStyles.dateButtonTextActive
                  ]}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    mapStyles.dateButton,
                    selectedDateRange === 'yesterday' && mapStyles.dateButtonActive
                  ]}
                  onPress={() => {
                    setSelectedDateRange('yesterday');
                    fetchPriceData('yesterday');
                  }}
                >
                  <Text style={[
                    mapStyles.dateButtonText,
                    selectedDateRange === 'yesterday' && mapStyles.dateButtonTextActive
                  ]}>Yesterday</Text>
                </TouchableOpacity>
                  
                <TouchableOpacity
                  style={[
                    mapStyles.dateButton,
                    selectedDateRange === 'custom' && mapStyles.dateButtonActive
                  ]}
                  onPress={() => setShowCustomDateModal(true)}
                >
                  <Text style={[
                    mapStyles.dateButtonText,
                    selectedDateRange === 'custom' && mapStyles.dateButtonTextActive
                  ]}>
                    {selectedDateRange === 'custom' 
                      ? `Custom (${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()})`
                      : 'Custom Range'
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Price Cards */}
              <View style={mapStyles.priceCardsContainer}>
                <View style={mapStyles.priceCard}>
                  <Text style={mapStyles.priceCardTitle}>Min Price</Text>
                  {priceLoading ? (
                    <ActivityIndicator size="small" color="#49A760" />
                  ) : (
                    <Text style={mapStyles.priceCardValue}>
                      {priceData[selectedDateRange]?.min > 0 
                        ? `₹${priceData[selectedDateRange].min}` 
                        : 'No data'
                      }
                    </Text>
                  )}
                </View>
                
                <View style={mapStyles.priceCard}>
                  <Text style={mapStyles.priceCardTitle}>Max Price</Text>
                  {priceLoading ? (
                    <ActivityIndicator size="small" color="#49A760" />
                  ) : (
                    <Text style={mapStyles.priceCardValue}>
                      {priceData[selectedDateRange]?.max > 0 
                        ? `₹${priceData[selectedDateRange].max}` 
                        : 'No data'
                      }
                    </Text>
                  )}
                </View>
                
                <View style={mapStyles.priceCard}>
                  <Text style={mapStyles.priceCardTitle}>Modal Price</Text>
                  {priceLoading ? (
                    <ActivityIndicator size="small" color="#49A760" />
                  ) : (
                    <Text style={mapStyles.priceCardValue}>
                      {priceData[selectedDateRange]?.modal > 0 
                        ? `₹${priceData[selectedDateRange].modal}` 
                        : 'No data'
                      }
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Location Radius Section */}
            <View style={mapStyles.radiusSection}>
              <Text style={mapStyles.radiusSectionTitle}>Location Radius</Text>
              <Text style={mapStyles.radiusSectionSubtitle}>
                Drag the marker on the map to change location, then adjust radius below
              </Text>
              
              {/* Radius Type Toggle */}
              <View style={mapStyles.radiusTypeToggle}>
                <TouchableOpacity
                  style={[
                    mapStyles.radiusTypeButton,
                    radius <= 0.5 && mapStyles.radiusTypeButtonActive
                  ]}
                  onPress={() => {
                    if (radius > 0.5) setRadius(0.1); // Reset to 100m when switching to meters
                  }}
                >
                  <Text style={[
                    mapStyles.radiusTypeButtonText,
                    radius <= 0.5 && mapStyles.radiusTypeButtonTextActive
                  ]}>Meters</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    mapStyles.radiusTypeButton,
                    radius > 0.5 && mapStyles.radiusTypeButtonActive
                  ]}
                  onPress={() => {
                    if (radius <= 0.5) setRadius(2); // Reset to 2km when switching to km
                  }}
                >
                  <Text style={[
                    mapStyles.radiusTypeButtonText,
                    radius > 0.5 && mapStyles.radiusTypeButtonTextActive
                  ]}>Kilometers</Text>
                </TouchableOpacity>
              </View>

              {/* Radius Slider */}
              <View style={mapStyles.radiusSliderContainer}>
                <Text style={mapStyles.radiusValue}>
                  {radius <= 0.5 
                    ? `${Math.round(radius * 1000)}m` 
                    : `${radius}km`
                  }
                </Text>
                
                {/* Meter-based slider (0-500m with draggable slider) */}
                {radius <= 0.5 && (
                  <View style={mapStyles.sliderContainer}>
                    <Text style={mapStyles.sliderHint}>
                      Drag the slider or tap steps below to adjust radius
                    </Text>
                    <View 
                      ref={sliderContainerRef}
                      style={mapStyles.sliderTrack}
                      {...panResponder.panHandlers}
                    >
                      <View 
                        style={[
                          mapStyles.sliderFill, 
                          { width: `${(radius * 1000 / 500) * 100}%` }
                        ]} 
                      />
                      <View
                        style={[
                          mapStyles.sliderThumb,
                          { left: `${(radius * 1000 / 500) * 100}%` }
                        ]}
                      />
                    </View>
                    
                    {/* Step indicators below slider */}
                    <View style={mapStyles.sliderSteps}>
                      {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((step) => (
                        <TouchableOpacity
                          key={step}
                          style={[
                            mapStyles.sliderStep,
                            Math.round(radius * 1000) === step && mapStyles.sliderStepActive
                          ]}
                          onPress={() => debouncedSetRadius(step / 1000)}
                        >
                          <Text style={[
                            mapStyles.sliderStepText,
                            Math.round(radius * 1000) === step && mapStyles.sliderStepTextActive
                          ]}>{step}m</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Kilometer-based slider (2, 3, 4, 5, 50km) */}
                {radius > 0.5 && (
                  <View style={mapStyles.kmSliderContainer}>
                    {[2, 3, 4, 5, 50].map((km) => (
                      <TouchableOpacity
                        key={km}
                        style={[
                          mapStyles.kmButton,
                          radius === km && mapStyles.kmButtonActive
                        ]}
                        onPress={() => debouncedSetRadius(km)}
                      >
                        <Text style={[
                          mapStyles.kmButtonText,
                          radius === km && mapStyles.kmButtonTextActive
                        ]}>{km}km</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Consumer Information Panel */}
            <ConsumerInfoPanel
              selectedCrop={selectedCrop}
              radius={radius}
              consumerStats={consumerStats}
              priceUnit={priceUnit}
              onRadiusIncrease={() => {
                const newRadius = Math.min(radius + 0.2, MAP_CONFIG.RADIUS.MAX); // Increase by 200m, max 700m
                debouncedSetRadius(newRadius);
              }}
            />

            {/* Price Unit Toggle */}
            <PriceUnitToggle
              priceUnit={priceUnit}
              onPriceUnitChange={handlePriceUnitChange}
            />

            {/* Data Summary Section */}
            <View style={mapStyles.dataSummarySection}>
              <Text style={mapStyles.dataSummaryTitle}>Data Summary</Text>
              <View style={mapStyles.dataSummaryGrid}>
                <View style={mapStyles.dataSummaryCard}>
                  <Text style={mapStyles.dataSummaryLabel}>Total Data Points</Text>
                  <Text style={mapStyles.dataSummaryValue}>{allCrops.length}</Text>
                  <Text style={mapStyles.dataSummarySubtext}>All crops in database</Text>
                </View>
                
                <View style={mapStyles.dataSummaryCard}>
                  <Text style={mapStyles.dataSummaryLabel}>In Selected Radius</Text>
                  <Text style={mapStyles.dataSummaryValue}>{filteredCrops.length}</Text>
                  <Text style={mapStyles.dataSummarySubtext}>
                    {selectedCrop} within {radius <= 0.5 ? `${Math.round(radius * 1000)}m` : `${radius}km`}
                  </Text>
                </View>
                
                <View style={mapStyles.dataSummaryCard}>
                  <Text style={mapStyles.dataSummaryLabel}>Consumers</Text>
                  <Text style={mapStyles.dataSummaryValue}>{allConsumerCrops.length}</Text>
                  <Text style={mapStyles.dataSummarySubtext}>Buying data points</Text>
                </View>
                
                <View style={mapStyles.dataSummaryCard}>
                  <Text style={mapStyles.dataSummaryLabel}>Farmers</Text>
                  <Text style={mapStyles.dataSummaryValue}>{allFarmerCrops.length}</Text>
                  <Text style={mapStyles.dataSummarySubtext}>Selling data points</Text>
                </View>
              </View>
            </View>

            {/* Consumer Chart Section */}
            {consumerChartData.length > 0 && (
              <PriceChart
                chartData={consumerChartData}
                selectedCrop={selectedCrop}
                priceUnit={priceUnit}
                title="Consumer Buying Price Trends"
                isConsumerChart={true}
              />
            )}

            {/* Farmer Chart Section */}
            {farmerChartData.length > 0 && (
              <PriceChart
                chartData={farmerChartData}
                selectedCrop={selectedCrop}
                priceUnit={priceUnit}
                title="Farmer Selling Price Trends"
                isConsumerChart={false}
              />
            )}
          </ScrollView>

          {/* Crop Selection Modal */}
          <CropSelectionModal
            visible={showCropModal}
            selectedCrop={selectedCrop}
            onSelect={handleCropSelect}
            onClose={() => setShowCropModal(false)}
          />

          {/* Date Range Picker Modal */}
          <Modal
            visible={showCustomDateModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCustomDateModal(false)}
          >
            <View style={mapStyles.modalOverlay}>
              <View style={mapStyles.modalContent}>
                <View style={mapStyles.modalHeader}>
                  <Text style={mapStyles.modalTitle}>Select Date Range</Text>
                  <TouchableOpacity onPress={() => setShowCustomDateModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={mapStyles.datePickerContainer}>
                  <View style={mapStyles.datePickerRow}>
                    <Text style={mapStyles.datePickerLabel}>From Date:</Text>
                    <TouchableOpacity
                      style={mapStyles.datePickerButton}
                      onPress={() => {
                        setDatePickerMode('start');
                        setShowNativeDatePicker(true);
                      }}
                    >
                      <Text style={mapStyles.datePickerButtonText}>
                        {customStartDate.toLocaleDateString()}
                      </Text>
                      <Ionicons name="calendar" size={20} color="#49A760" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={mapStyles.datePickerRow}>
                    <Text style={mapStyles.datePickerLabel}>To Date:</Text>
                    <TouchableOpacity
                      style={mapStyles.datePickerButton}
                      onPress={() => {
                        setDatePickerMode('end');
                        setShowNativeDatePicker(true);
                      }}
                    >
                      <Text style={mapStyles.datePickerButtonText}>
                        {customEndDate.toLocaleDateString()}
                      </Text>
                      <Ionicons name="calendar" size={20} color="#49A760" />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      mapStyles.applyDateButton,
                      customEndDate < customStartDate && mapStyles.applyDateButtonDisabled
                    ]}
                    onPress={() => {
                      if (customEndDate >= customStartDate) {
                        setSelectedDateRange('custom');
                        setShowCustomDateModal(false);
                        fetchPriceData('custom', customStartDate, customEndDate);
                      }
                    }}
                    disabled={customEndDate < customStartDate}
                  >
                    <Text style={[
                      mapStyles.applyDateButtonText,
                      customEndDate < customStartDate && mapStyles.applyDateButtonTextDisabled
                    ]}>
                      {customEndDate < customStartDate ? 'Invalid Date Range' : 'Apply Date Range'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Native Date Picker */}
          {showNativeDatePicker && (
            <DateTimePicker
              value={datePickerMode === 'start' ? customStartDate : customEndDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  if (datePickerMode === 'start') {
                    setCustomStartDate(selectedDate);
                  } else {
                    setCustomEndDate(selectedDate);
                  }
                }
                setShowNativeDatePicker(false);
              }}
            />
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default Map;
