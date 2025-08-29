import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { View, ScrollView, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlobalContext } from "../../context/GlobalProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Custom hooks
import { useMapData } from "../../hooks/useMapData";
import { useGeolocation } from "../../hooks/useGeolocation";

// Components
import ErrorBoundary from "../../components/ErrorBoundary";
import MapHeader from "../../components/map/MapHeader";
import InteractiveMap from "../../components/map/InteractiveMap";
import RadiusSlider from "../../components/map/RadiusSlider";
import ConsumerInfoPanel from "../../components/map/ConsumerInfoPanel";
import PriceUnitToggle from "../../components/map/PriceUnitToggle";
import MapLegend from "../../components/map/MapLegend";
import PriceChart from "../../components/map/PriceChart";
import CropSelectionModal from "../../components/map/CropSelectionModal";

// Utils and constants
import {
  processChartData,
  calculateConsumerStats,
} from "../../utils/chartDataProcessor";
import { MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "../../components/map/mapStyles";
import { performanceMonitor } from "../../utils/performance";

const Map = () => {
  const { currentLocation } = useContext(GlobalContext);

  // State management
  const [selectedCrop, setSelectedCrop] = useState("onion");
  const [selectedMapType, setSelectedMapType] = useState("default");
  const [radius, setRadius] = useState(MAP_CONFIG.RADIUS.DEFAULT);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [priceUnit, setPriceUnit] = useState(
    MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_UNIT
  );

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

  // Debounced radius setter to prevent infinite loops
  const debouncedSetRadius = useCallback((value) => {
    if (radiusTimeoutRef.current) {
      clearTimeout(radiusTimeoutRef.current);
    }
    radiusTimeoutRef.current = setTimeout(() => {
      setRadius(value);
    }, MAP_CONFIG.RADIUS.DEBOUNCE_MS);
  }, []);

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

  const handleCropSelect = useCallback((crop) => {
    setSelectedCrop(crop);
  }, []);

  const handleMapTypeChange = useCallback((mapType) => {
    setSelectedMapType(mapType);
  }, []);

  const handlePriceUnitChange = useCallback((unit) => {
    setPriceUnit(unit);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("Map visibility check:", {
      hasCurrentLocation: !!currentLocation,
      hasMarkerPosition: !!markerPosition,
      allCropsCount: allCrops.length,
      dataLoading,
      dataError: !!dataError,
    });
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

          {/* ScrollView for content below header */}
          <ScrollView
            style={mapStyles.contentScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Interactive Map */}
            <View style={mapStyles.mapContainer}>
              <InteractiveMap
                markerPosition={markerPosition}
                allCrops={allCrops}
                radius={radius}
                selectedCrop={selectedCrop}
                selectedMapType={selectedMapType}
                onMarkerMove={handleMarkerMove}
              />
            </View>

            {/* Distance slider below map */}
            <RadiusSlider radius={radius} onRadiusChange={debouncedSetRadius} />

            {/* Consumer Information Panel */}
            <ConsumerInfoPanel
              selectedCrop={selectedCrop}
              radius={radius}
              consumerStats={consumerStats}
              priceUnit={priceUnit}
            />

            {/* Price Unit Toggle */}
            <PriceUnitToggle
              priceUnit={priceUnit}
              onPriceUnitChange={handlePriceUnitChange}
            />

            {/* Map Legend */}
            <MapLegend selectedCrop={selectedCrop} radius={radius} />

            {/* Debug info */}
            <View style={mapStyles.debugSection}>
              <Text style={mapStyles.debugText}>
                Total crops: {allCrops.length} | Consumer:{" "}
                {allConsumerCrops.length} | Farmer: {allFarmerCrops.length}
              </Text>
              <Text style={mapStyles.debugText}>
                Selected: {selectedCrop} | Radius: {Math.round(radius * 1000)}m
                | Unit: {priceUnit}
              </Text>
              <Text style={mapStyles.debugText}>
                In radius: {filteredCrops.length} | Outside:{" "}
                {allCrops.filter(
                  (crop) =>
                    crop.name?.toLowerCase() === selectedCrop.toLowerCase()
                ).length - filteredCrops.length}
              </Text>
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
        </SafeAreaView>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default Map;
