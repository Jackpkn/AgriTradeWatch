
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Modal, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Ionicons } from "@expo/vector-icons";
import { useGlobal } from "@/context/global-provider";

// Custom hooks
import { useMapData } from "@/hooks/useMapData";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTranslation } from "@/hooks/useTranslation";

// Components
import MapHeader from "@/components/map/MapHeader";
import InteractiveMap from "@/components/map/InteractiveMap";
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
import { performanceMonitor } from "@/utils/performance";
import { useOrientation } from "@/utils/orientationUtils";

// #region STYLES
// NOTE: Styles are included here to make the component self-contained and fix all errors.
// In a real project, this would be in a separate `mapStyles.ts` file.
const createMapStyles = (isLandscape: boolean, width: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fffe' },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  autoRefreshContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  autoRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#49A760',
  },
  autoRefreshButtonActive: {
    backgroundColor: '#49A760',
  },
  autoRefreshText: {
    marginLeft: 6,
    color: '#49A760',
    fontWeight: '600',
    fontSize: 12,
  },
  autoRefreshTextActive: {
    color: '#fff',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#49A760',
  },
  contentScroll: { flex: 1 },
  mapContainer: {
    height: isLandscape ? width * 0.4 : 300,
    backgroundColor: '#EFEFEF',
    position: 'relative',
  },
  mapInstructions: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  mapInstructionsText: {
    fontSize: 12,
    color: '#49A760',
    fontWeight: '600',
    textAlign: 'center',
  },
  priceDisplaySection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  priceSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateRangeSelectorScroll: { marginBottom: 16 },
  dateRangeSelector: { flexDirection: 'row', gap: 8 },
  dateButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  dateButtonActive: {
    backgroundColor: '#49A760',
  },
  dateButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  dateButtonTextActive: {
    color: '#fff',
  },
  priceCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minWidth: '48%',
    alignItems: 'flex-start',
  },
  priceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  priceCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  priceCardCount: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  noDataMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef3e9',
    borderRadius: 8,
    marginTop: 12,
  },
  noDataText: {
    marginLeft: 8,
    color: '#666',
  },
  radiusSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  radiusSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  radiusSectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  favoriteLocationsContainer: {
    marginBottom: 16,
  },
  favoriteLocationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  favoriteLocationsList: {
    flexDirection: 'row',
    gap: 8,
  },
  favoriteLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e9f5ec',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0e5d5',
  },
  favoriteLocationText: {
    marginLeft: 6,
    color: '#49A760',
    fontSize: 12,
    fontWeight: '500',
  },
  radiusTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  radiusTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  radiusTypeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  radiusTypeButtonText: {
    fontWeight: '600',
    color: '#666',
  },
  radiusTypeButtonTextActive: {
    color: '#49A760',
  },
  radiusSliderContainer: {},
  radiusValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  radiusDataCount: {
    fontSize: 14,
    color: '#666',
  },
  sliderContainer: {},
  sliderHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
  },
  sliderFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#49A760',
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#49A760',
    transform: [{ translateX: -10 }],
  },
  sliderStepsScroll: { marginTop: 12 },
  sliderSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sliderStep: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  sliderStepActive: {
    backgroundColor: '#d0e5d5',
  },
  sliderStepText: {
    fontSize: 12,
    color: '#555',
  },
  sliderStepTextActive: {
    color: '#49A760',
    fontWeight: 'bold',
  },
  kmSliderContainer: {},
  kmButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kmButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexGrow: 1,
  },
  kmButtonActive: {
    backgroundColor: '#49A760',
  },
  kmButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  kmButtonTextActive: {
    color: '#fff',
  },
  dataSummarySection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  dataSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dataSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  dataSummaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: '48%',
  },
  dataSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  dataSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  dataSummarySubtext: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f5ec',
    padding: 12,
    borderRadius: 8,
    minWidth: '48%',
  },
  quickActionText: {
    marginLeft: 8,
    color: '#49A760',
    fontWeight: '600',
  },
  noChartDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  noChartDataText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  mapLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerContainer: {},
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerLabel: {
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  datePickerButtonText: {
    marginRight: 8,
  },
  quickDateRanges: {
    marginBottom: 20,
  },
  quickDateRangesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  quickDateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickDateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  quickDateButtonText: {
    fontSize: 12,
    color: '#333',
  },
  applyDateButton: {
    backgroundColor: '#49A760',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyDateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyDateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyDateButtonTextDisabled: {
    color: '#888',
  },
});
// #endregion

// Types
interface PriceData {
  min: number;
  max: number;
  modal: number;
  average: number;
  count: number;
}

interface MarkerPosition {
  latitude: number;
  longitude: number;
}

type DateRangeType = 'custom';

interface MapState {
  selectedCrop: string;
  selectedMapType: string;
  radius: number;
  markerPosition: MarkerPosition | null;
  priceUnit: string;
  selectedDateRange: DateRangeType;
  customStartDate: Date;
  customEndDate: Date;
  priceData: Record<DateRangeType, PriceData>;
  priceLoading: boolean;
  showCropModal: boolean;
  showCustomDateModal: boolean;
  showNativeDatePicker: boolean;
  datePickerMode: 'start' | 'end';
  favoriteLocations: MarkerPosition[];
  mapViewMode: 'standard' | 'satellite' | 'hybrid';
  autoRefresh: boolean;
}

// Custom hook for managing map state
const useMapState = () => {
  const [state, setState] = useState<MapState>({
    selectedCrop: "onion",
    selectedMapType: "default",
    radius: MAP_CONFIG.RADIUS.DEFAULT,
    markerPosition: null,
    priceUnit: MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_KG,
    selectedDateRange: 'custom',
    customStartDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    customEndDate: new Date(),
    priceData: {
      custom: { min: 0, max: 0, modal: 0, average: 0, count: 0 }
    },
    priceLoading: false,
    showCropModal: false,
    showCustomDateModal: false,
    showNativeDatePicker: false,
    datePickerMode: 'start',
    favoriteLocations: [],
    mapViewMode: 'standard',
    autoRefresh: false
  });

  const updateState = useCallback((updates: Partial<MapState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState] as const;
};

// Custom hook for price calculations with improved logic
const usePriceCalculations = (allCrops: any[], selectedCrop: string) => {
  const calculatePriceData = useCallback((
    dateRange: DateRangeType,
    startDate: Date | null = null,
    endDate: Date | null = null
  ): PriceData => {
    try {
      const relevantCrops = allCrops.filter(crop => {
        if (!crop) return false;
        const cropNameToCheck = crop.name || crop.commodity;
        return cropNameToCheck && cropNameToCheck.toLowerCase() === selectedCrop.toLowerCase();
      });

      if (relevantCrops.length === 0) {
        return { min: 0, max: 0, modal: 0, average: 0, count: 0 };
      }

      let filteredCrops = relevantCrops;

      if (startDate && endDate) {
        const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);

        filteredCrops = relevantCrops.filter(crop => {
          if (!crop.createdAt?.seconds) return false;
          const cropDate = new Date(crop.createdAt.seconds * 1000);
          return cropDate >= startOfDay && cropDate <= endOfDay;
        });
      }

      if (filteredCrops.length === 0) {
        return { min: 0, max: 0, modal: 0, average: 0, count: 0 };
      }

      const prices = filteredCrops
        .map(crop => {
          const price = parseFloat(crop.pricePerUnit);
          return isNaN(price) || price <= 0 ? null : price;
        })
        .filter(price => price !== null) as number[];

      if (prices.length === 0) {
        return { min: 0, max: 0, modal: 0, average: 0, count: 0 };
      }

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      // *** FIXED MODAL PRICE CALCULATION ***
      const priceCounts = new Map<number, number>();
      prices.forEach(price => {
        priceCounts.set(price, (priceCounts.get(price) || 0) + 1);
      });

      let modalPrice = prices[0] || 0; // Provide fallback value
      let maxCount = 0;
      for (const [price, count] of priceCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          modalPrice = price;
        }
      }

      return {
        min: Math.round(minPrice * 100) / 100,
        max: Math.round(maxPrice * 100) / 100,
        modal: Math.round(modalPrice * 100) / 100,
        average: Math.round(averagePrice * 100) / 100,
        count: prices.length
      };

    } catch (error) {
      console.error('Error calculating price data:', error);
      return { min: 0, max: 0, modal: 0, average: 0, count: 0 };
    }
  }, [allCrops, selectedCrop]);

  return { calculatePriceData };
};

const MapScreen = () => {
  const { currentLocation, isLogged, mainUser } = useGlobal();
  const { t } = useTranslation();
  const [state, updateState] = useMapState();

  const orientationData = useOrientation();
  const { isLandscape, width } = orientationData as unknown as {
    screenData: { width: number; height: number };
    isLandscape: boolean;
    width: number;
    height: number;
    breakpoints: Record<string, boolean>;
  };

  const mapStyles = useMemo(() => createMapStyles(isLandscape, width), [isLandscape, width]);

  const {
    allConsumerCrops,
    allFarmerCrops,
    allCrops,
    loading: dataLoading,
    error: dataError,
    refetch,
  } = useMapData();

  // Auto-reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Map screen focused - refreshing data");
      refetch();
    }, [refetch])
  );

  const { filterCropsInRadius } = useGeolocation();
  const { calculatePriceData } = usePriceCalculations(allCrops, state.selectedCrop);

  const radiusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<any>(null);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setRadius = useCallback((value: number) => {
    updateState({ radius: value });
    try {
      if (webViewRef.current) {
        const message = JSON.stringify({
          type: 'updateRadius',
          radius: value
        });
        webViewRef.current.injectJavaScript(`
          try {
            window.postMessage('${message}', '*');
          } catch(e) {
            console.error('WebView message error:', e);
          }
        `);
      }
    } catch (error) {
      console.error('WebView communication error:', error);
    }
  }, [updateState]);

  const debouncedSetRadius = useCallback((value: number) => {
    if (radiusTimeoutRef.current) {
      clearTimeout(radiusTimeoutRef.current);
    }
    radiusTimeoutRef.current = setTimeout(() => {
      setRadius(value);
    }, 100);
  }, [setRadius]);

  useEffect(() => {
    return () => {
      if (radiusTimeoutRef.current) {
        clearTimeout(radiusTimeoutRef.current);
      }
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('Map: Location effect triggered:', {
      hasCurrentLocation: !!currentLocation,
      currentLocation,
      hasMarkerPosition: !!state.markerPosition,
      markerPosition: state.markerPosition
    });

    if (currentLocation && !state.markerPosition) {
      const { latitude, longitude } = currentLocation;
      console.log('Map: Setting marker position from current location:', { latitude, longitude });
      if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
        updateState({
          markerPosition: { latitude, longitude }
        });
      } else {
        console.log('Map: Invalid coordinates:', { latitude, longitude, types: { lat: typeof latitude, lng: typeof longitude } });
      }
    } else if (!currentLocation && !state.markerPosition) {
      // Fallback to a default location (Delhi, India) if no location is available
      console.log('Map: No current location, using fallback location');
      updateState({
        markerPosition: { latitude: 28.6139, longitude: 77.2090 }
      });
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, state.markerPosition, updateState]);

  useEffect(() => {
    if (state.selectedCrop && allCrops.length > 0 && !dataLoading) {
      updateState({ priceLoading: true });
      try {
        const newPriceData = {
          custom: calculatePriceData('custom', state.customStartDate, state.customEndDate)
        };
        updateState({
          priceData: newPriceData,
          priceLoading: false
        });
      } catch (error) {
        console.error('Error updating price data:', error);
        updateState({ priceLoading: false });
      }
    }
  }, [state.customStartDate, state.customEndDate, state.selectedCrop, allCrops, dataLoading, calculatePriceData, updateState]);

  // The rest of your component logic follows, and should now work without TypeScript errors.
  // ... (The entire Map component's return JSX remains the same as in your original post) ...
  // Full component JSX is included below for completeness.
  const filteredCrops = useMemo(() => {
    const startTime = performance.now();
    const result = filterCropsInRadius(
      allCrops,
      state.markerPosition,
      state.radius,
      state.selectedCrop
    );
    performanceMonitor.recordOperation(
      "filterCrops",
      performance.now() - startTime
    );
    return result;
  }, [allCrops, state.markerPosition, state.radius, state.selectedCrop, filterCropsInRadius]);

  const consumersInRadius = useMemo(
    () => filterCropsInRadius(
      allConsumerCrops,
      state.markerPosition,
      state.radius,
      state.selectedCrop
    ),
    [allConsumerCrops, state.markerPosition, state.radius, state.selectedCrop, filterCropsInRadius]
  );

  const consumerStats = useMemo(() => {
    try {
      return calculateConsumerStats(consumersInRadius, state.priceUnit, state.selectedCrop);
    } catch (error) {
      console.error('Error calculating consumer stats:', error);
      return { averagePrice: 0, totalConsumers: 0, priceRange: { min: 0, max: 0 } };
    }
  }, [consumersInRadius, state.priceUnit, state.selectedCrop]);

  const consumerChartData = useMemo(() => {
    const startTime = performance.now();
    try {
      const result = processChartData(allConsumerCrops, state.selectedCrop, state.priceUnit);
      performanceMonitor.recordOperation("processConsumerChart", performance.now() - startTime);
      return result;
    } catch (error) {
      console.error('Error processing consumer chart data:', error);
      return [];
    }
  }, [allConsumerCrops, state.selectedCrop, state.priceUnit]);

  const farmerChartData = useMemo(() => {
    const startTime = performance.now();
    try {
      const result = processChartData(allFarmerCrops, state.selectedCrop, state.priceUnit);
      performanceMonitor.recordOperation("processFarmerChart", performance.now() - startTime);
      return result;
    } catch (error) {
      console.error('Error processing farmer chart data:', error);
      return [];
    }
  }, [allFarmerCrops, state.selectedCrop, state.priceUnit]);

  const handleMarkerMove = useCallback((newPosition: MarkerPosition) => {
    if (newPosition.latitude && newPosition.longitude &&
      !isNaN(newPosition.latitude) && !isNaN(newPosition.longitude)) {
      updateState({ markerPosition: newPosition });
    }
  }, [updateState]);

  const handleCropSelect = useCallback((crop: string) => {
    updateState({ selectedCrop: crop, showCropModal: false });
  }, [updateState]);

  const handleMapTypeChange = useCallback((mapType: string) => {
    updateState({ selectedMapType: mapType });
  }, [updateState]);

  const handlePriceUnitChange = useCallback((unit: string) => {
    updateState({ priceUnit: unit });
  }, [updateState]);

  const handleSaveFavoriteLocation = useCallback(() => {
    if (state.markerPosition) {
      const newFavorites = [...state.favoriteLocations, state.markerPosition];
      updateState({ favoriteLocations: newFavorites });
      Alert.alert(t.common.success, t.map.locationSavedToFavorites);
    }
  }, [state.markerPosition, state.favoriteLocations, updateState, t]);

  const handleLoadFavoriteLocation = useCallback((location: MarkerPosition) => {
    updateState({ markerPosition: location });
  }, [updateState]);

  const handleDatePickerChange = useCallback((event: any, selectedDate?: Date) => {
    updateState({ showNativeDatePicker: false });

    if (selectedDate) {
      if (state.datePickerMode === 'start') {
        updateState({ customStartDate: selectedDate });
      } else {
        updateState({ customEndDate: selectedDate });
      }
    }
  }, [state.datePickerMode, updateState]);

  const handleRetry = useCallback(() => {
    updateState({ priceLoading: true });
    setTimeout(() => {
      // In a real app, you might trigger a refetch of your data hook instead.
      // window.location.reload?.(); // For web
      updateState({ priceLoading: false }); // Simulating a retry
    }, 1000);
  }, [updateState]);

  // Debug logging to understand what's happening
  console.log('Map Debug Info:', {
    dataLoading,
    allCropsLength: allCrops.length,
    allConsumerCropsLength: allConsumerCrops.length,
    allFarmerCropsLength: allFarmerCrops.length,
    dataError,
    shouldShowLoading: dataLoading && allCrops.length === 0,
    hasMarkerPosition: !!state.markerPosition,
    markerPosition: state.markerPosition
  });

  // Show loading only if data is actually loading and we don't have any data yet
  if (dataLoading && allCrops.length === 0) {
    return (
      <SafeAreaView style={mapStyles.container}>
        <View style={mapStyles.mapLoading}>
          <ActivityIndicator size="large" color="#49A760" />
          <Text style={mapStyles.mapLoadingText}>{t.map.loadingCropData}</Text>
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              {t.common.pleaseWait}
            </Text>
            <Text style={{ color: '#666', fontSize: 12, marginTop: 10 }}>
              Debug: Loading={dataLoading ? 'true' : 'false'}, Crops={allCrops.length}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (dataError) {
    return (
      <SafeAreaView style={mapStyles.container}>
        <View style={mapStyles.mapLoading}>
          <Ionicons name="warning" size={64} color="#ff6b6b" style={{ marginBottom: 16 }} />
          <Text style={[mapStyles.mapLoadingText, { fontSize: 18, fontWeight: 'bold', marginBottom: 8 }]}>
            {t.map.errorLoadingData}
          </Text>
          <Text style={[mapStyles.mapLoadingText, { fontSize: 14, textAlign: 'center', marginBottom: 24 }]}>
            {dataError || t.map.unableToLoadMapData}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#49A760',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={handleRetry}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {t.common.retry}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={mapStyles.container}>
        <View style={mapStyles.headerContainer}>
          <MapHeader
            selectedCrop={state.selectedCrop}
            selectedMapType={state.selectedMapType}
            onCropPress={() => updateState({ showCropModal: true })}
            onMapTypeChange={handleMapTypeChange}
          />
          <View style={mapStyles.autoRefreshContainer}>
            {/* <TouchableOpacity
              style={[
                mapStyles.autoRefreshButton,
                state.autoRefresh && mapStyles.autoRefreshButtonActive
              ]}
              onPress={() => updateState({ autoRefresh: !state.autoRefresh })}
            >
              <Ionicons
                name={state.autoRefresh ? "refresh" : "refresh-outline"}
                size={20}
                color={state.autoRefresh ? "#fff" : "#49A760"}
              />
              <Text style={[
                mapStyles.autoRefreshText,
                state.autoRefresh && mapStyles.autoRefreshTextActive
              ]}>
                Auto Refresh
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={mapStyles.favoriteButton}
              onPress={handleSaveFavoriteLocation}
            >
              <Ionicons name="heart-outline" size={20} color="#49A760" />
            </TouchableOpacity> */}
          </View>
        </View>
        <ScrollView
          style={mapStyles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={mapStyles.mapContainer}>
            <InteractiveMap
              ref={webViewRef}
              markerPosition={state.markerPosition}
              allCrops={allCrops}
              radius={state.radius}
              selectedCrop={state.selectedCrop}
              selectedMapType={state.selectedMapType}
              onMarkerMove={handleMarkerMove}
            />
            <View style={mapStyles.mapInstructions}>
              <Text style={mapStyles.mapInstructionsText}>
                {t.map.dragPinInstruction}
              </Text>
            </View>
          </View>
          <OfflineIndicator />
          <MapLegend selectedCrop={state.selectedCrop} radius={state.radius} />
          <View style={mapStyles.priceDisplaySection}>
            <Text style={mapStyles.priceSectionTitle}>{t.map.priceInformation}</Text>
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                style={[
                  mapStyles.dateButton,
                  mapStyles.dateButtonActive,
                  { width: '100%', alignItems: 'center' }
                ]}
                onPress={() => updateState({ showCustomDateModal: true })}
              >
                <Text style={[mapStyles.dateButtonText, mapStyles.dateButtonTextActive]}>
                  {state.customStartDate.toLocaleDateString() === state.customEndDate.toLocaleDateString()
                    ? state.customStartDate.toLocaleDateString()
                    : `${state.customStartDate.toLocaleDateString()} - ${state.customEndDate.toLocaleDateString()}`
                  }
                </Text>
              </TouchableOpacity>
            </View>
            {/* <View style={mapStyles.priceCardsContainer}>
              {[
                { key: 'min', title: t.map.minPrice, color: '#ff6b6b' },
                { key: 'max', title: t.map.maxPrice, color: '#4ecdc4' },
                { key: 'average', title: t.map.avgPrice, color: '#45b7d1' },
                { key: 'modal', title: t.map.modalPrice, color: '#96ceb4' }
              ].map(({ key, title, color }) => (
                <View key={key} style={[mapStyles.priceCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                  <Text style={mapStyles.priceCardTitle}>{title}</Text>
                  {state.priceLoading ? (
                    <ActivityIndicator size="small" color="#49A760" />
                  ) : (
                    <>
                      <Text style={mapStyles.priceCardValue}>
                        {state.priceData.custom?.[key as keyof PriceData] > 0
                          ? `₹${state.priceData.custom[key as keyof PriceData]}`
                          : t.map.noData
                        }
                      </Text>
                      <Text style={mapStyles.priceCardCount}>
                        {state.priceData.custom?.count || 0} {t.map.dataPoints}
                      </Text>
                    </>
                  )}
                </View>
              ))}
            </View>
            {!state.priceLoading && state.priceData.custom?.count === 0 && (
              <View style={mapStyles.noDataMessage}>
                <Ionicons name="information-circle-outline" size={24} color="#666" />
                <Text style={mapStyles.noDataText}>
                  {t.map.noPriceDataAvailable}
                </Text>
              </View>
            )} */}
          </View>
          <View style={mapStyles.radiusSection}>
            <Text style={mapStyles.radiusSectionTitle}>{t.map.locationRadiusControl}</Text>
            <Text style={mapStyles.radiusSectionSubtitle}>
              {t.map.locationRadiusSubtitle}
            </Text>
            {state.favoriteLocations.length > 0 && (
              <View style={mapStyles.favoriteLocationsContainer}>
                <Text style={mapStyles.favoriteLocationsTitle}>{t.map.favoriteLocations}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={mapStyles.favoriteLocationsList}>
                    {state.favoriteLocations.map((location, index) => (
                      <TouchableOpacity
                        key={index}
                        style={mapStyles.favoriteLocationButton}
                        onPress={() => handleLoadFavoriteLocation(location)}
                      >
                        <Ionicons name="location" size={16} color="#49A760" />
                        <Text style={mapStyles.favoriteLocationText}>
                          {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
            <View style={mapStyles.radiusSliderContainer}>
              <View style={mapStyles.radiusValueContainer}>
                <Text style={mapStyles.radiusValue}>
                  {state.radius}km
                </Text>
                <Text style={mapStyles.radiusDataCount}>
                  {filteredCrops.length} {t.map.itemsInRange}
                </Text>
              </View>
              <View style={mapStyles.sliderContainer}>
                <Text style={mapStyles.sliderHint}>
                  {t.map.dragSliderHint}
                </Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0.5}
                  maximumValue={500}
                  step={0.5}
                  value={state.radius}
                  onValueChange={debouncedSetRadius}
                  onSlidingComplete={setRadius}
                  minimumTrackTintColor="#49A760"
                  maximumTrackTintColor="#e0e0e0"
                  thumbTintColor="#49A760"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={mapStyles.sliderStepsScroll}
                >
                  <View style={mapStyles.sliderSteps}>
                    {[0.5, 1, 5, 10, 25, 50, 100, 150, 200, 300, 400, 500].map((step) => (
                      <TouchableOpacity
                        key={step}
                        style={[
                          mapStyles.sliderStep,
                          state.radius === step && mapStyles.sliderStepActive
                        ]}
                        onPress={() => setRadius(step)}
                      >
                        <Text style={[
                          mapStyles.sliderStepText,
                          state.radius === step && mapStyles.sliderStepTextActive
                        ]}>{step}km</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
          
          <PriceUnitToggle
            priceUnit={state.priceUnit}
            onPriceUnitChange={handlePriceUnitChange}
          />

          {consumerChartData.length > 0 ? (
            <PriceChart
              chartData={consumerChartData}
              selectedCrop={state.selectedCrop}
              priceUnit={state.priceUnit}
              title={t.map.consumerBuyingPriceTrends}
              isConsumerChart={true}
            />
          ) : (
            <View style={mapStyles.noChartDataContainer}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={mapStyles.noChartDataText}>
                {t.map.noConsumerChartData} {state.selectedCrop}
              </Text>
            </View>
          )}
          {farmerChartData.length > 0 ? (
            <PriceChart
              chartData={farmerChartData}
              selectedCrop={state.selectedCrop}
              priceUnit={state.priceUnit}
              title={t.map.farmerSellingPriceTrends}
              isConsumerChart={false}
            />
          ) : (
            <View style={mapStyles.noChartDataContainer}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={mapStyles.noChartDataText}>
                {t.map.noFarmerChartData} {state.selectedCrop}
              </Text>
            </View>
          )}
          <View style={{ height: 50 }} />
        </ScrollView>
        <CropSelectionModal
          visible={state.showCropModal}
          selectedCrop={state.selectedCrop}
          onSelect={handleCropSelect}
          onClose={() => updateState({ showCropModal: false })}
        />
        <Modal
          visible={state.showCustomDateModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => updateState({ showCustomDateModal: false })}
        >
          <View style={mapStyles.modalOverlay}>
            <View style={mapStyles.modalContent}>
              <View style={mapStyles.modalHeader}>
                <Text style={mapStyles.modalTitle}>{t.map.selectDateRange}</Text>
                <TouchableOpacity onPress={() => updateState({ showCustomDateModal: false })}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={mapStyles.datePickerContainer}>
                <View style={mapStyles.datePickerRow}>
                  <Text style={mapStyles.datePickerLabel}>{t.map.fromDate}:</Text>
                  <TouchableOpacity
                    style={mapStyles.datePickerButton}
                    onPress={() => {
                      updateState({
                        datePickerMode: 'start',
                        showNativeDatePicker: true
                      });
                    }}
                  >
                    <Text style={mapStyles.datePickerButtonText}>
                      {state.customStartDate.toLocaleDateString()}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#49A760" />
                  </TouchableOpacity>
                </View>

                <View style={mapStyles.datePickerRow}>
                  <Text style={mapStyles.datePickerLabel}>{t.map.toDate}:</Text>
                  <TouchableOpacity
                    style={mapStyles.datePickerButton}
                    onPress={() => {
                      updateState({
                        datePickerMode: 'end',
                        showNativeDatePicker: true
                      });
                    }}
                  >
                    <Text style={mapStyles.datePickerButtonText}>
                      {state.customEndDate.toLocaleDateString()}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#49A760" />
                  </TouchableOpacity>
                </View>
                <View style={mapStyles.quickDateRanges}>
                  <Text style={mapStyles.quickDateRangesTitle}>{t.map.quickSelect}:</Text>
                  <View style={mapStyles.quickDateButtons}>
                    {[
                      { label: t.map.last7Days, days: 7 },
                      { label: t.map.last30Days, days: 30 },
                      { label: t.map.last3Months, days: 90 }
                    ].map(({ label, days }) => (
                      <TouchableOpacity
                        key={days}
                        style={mapStyles.quickDateButton}
                        onPress={() => {
                          const endDate = new Date();
                          const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
                          updateState({
                            customStartDate: startDate,
                            customEndDate: endDate
                          });
                        }}
                      >
                        <Text style={mapStyles.quickDateButtonText}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    mapStyles.applyDateButton,
                    state.customEndDate < state.customStartDate && mapStyles.applyDateButtonDisabled
                  ]}
                  onPress={() => {
                    if (state.customEndDate >= state.customStartDate) {
                      updateState({ showCustomDateModal: false });
                    } else {
                      Alert.alert(t.map.invalidDateRange, t.map.endDateMustBeAfterStartDate);
                    }
                  }}
                  disabled={state.customEndDate < state.customStartDate}
                >
                  <Text style={[
                    mapStyles.applyDateButtonText,
                    state.customEndDate < state.customStartDate && mapStyles.applyDateButtonTextDisabled
                  ]}>
                    {state.customEndDate < state.customStartDate ? t.map.invalidDateRange : t.map.applyDateRange}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {state.showNativeDatePicker && (
          <DateTimePicker
            value={state.datePickerMode === 'start' ? state.customStartDate : state.customEndDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDatePickerChange}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default MapScreen;