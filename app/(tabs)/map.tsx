
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Modal, PanResponder, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import { useGlobal } from "@/context/global-provider";

// Custom hooks
import { useMapData } from "@/hooks/useMapData";
import { useGeolocation } from "@/hooks/useGeolocation";

// Components
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
  marketInsightsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  marketInsightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#49A760',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noInsightsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noInsightsText: {
    marginTop: 8,
    color: '#888',
    textAlign: 'center',
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

type DateRangeType = 'today' | 'yesterday' | 'custom' | 'week' | 'month';

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
    priceUnit: MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_UNIT,
    selectedDateRange: 'today',
    customStartDate: new Date(),
    customEndDate: new Date(),
    priceData: {
      today: { min: 0, max: 0, modal: 0, average: 0, count: 0 },
      yesterday: { min: 0, max: 0, modal: 0, average: 0, count: 0 },
      custom: { min: 0, max: 0, modal: 0, average: 0, count: 0 },
      week: { min: 0, max: 0, modal: 0, average: 0, count: 0 },
      month: { min: 0, max: 0, modal: 0, average: 0, count: 0 }
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
      const now = new Date();

      switch (dateRange) {
        case 'custom':
          if (startDate && endDate) {
            filteredCrops = relevantCrops.filter(crop => {
              if (!crop.createdAt?.seconds) return false;
              const cropDate = new Date(crop.createdAt.seconds * 1000);
              return cropDate >= startDate && cropDate <= endDate;
            });
          }
          break;
        case 'today':
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
          filteredCrops = relevantCrops.filter(crop => {
            if (!crop.createdAt?.seconds) return false;
            const cropDate = new Date(crop.createdAt.seconds * 1000);
            return cropDate >= startOfDay && cropDate < endOfDay;
          });
          break;
        case 'yesterday':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000);
          filteredCrops = relevantCrops.filter(crop => {
            if (!crop.createdAt?.seconds) return false;
            const cropDate = new Date(crop.createdAt.seconds * 1000);
            return cropDate >= startOfYesterday && cropDate < endOfYesterday;
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredCrops = relevantCrops.filter(crop => {
            if (!crop.createdAt?.seconds) return false;
            const cropDate = new Date(crop.createdAt.seconds * 1000);
            return cropDate >= weekAgo && cropDate <= now;
          });
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredCrops = relevantCrops.filter(crop => {
            if (!crop.createdAt?.seconds) return false;
            const cropDate = new Date(crop.createdAt.seconds * 1000);
            return cropDate >= monthAgo && cropDate <= now;
          });
          break;
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
  } = useMapData();

  const { filterCropsInRadius } = useGeolocation();
  const { calculatePriceData } = usePriceCalculations(allCrops, state.selectedCrop);

  const radiusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<any>(null);
  const sliderContainerRef = useRef<any>(null);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const debouncedSetRadius = useCallback((value: number) => {
    if (radiusTimeoutRef.current) {
      clearTimeout(radiusTimeoutRef.current);
    }
    radiusTimeoutRef.current = setTimeout(() => {
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
    }, MAP_CONFIG.RADIUS.DEBOUNCE_MS);
  }, [updateState]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { },
    onPanResponderMove: (evt: any, gestureState: any) => {
      if (sliderContainerRef.current) {
        sliderContainerRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          const percentage = Math.max(0, Math.min(1, touchX / width));
          const newRadius = (percentage * 500) / 1000;
          const roundedRadius = Math.round(newRadius * 1000 / 50) * 50 / 1000;
          debouncedSetRadius(Math.max(0.05, roundedRadius));
        });
      }
    },
    onPanResponderRelease: () => { },
  }), [debouncedSetRadius]);

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
        const newPriceData = { ...state.priceData };
        if (state.selectedDateRange === 'custom') {
          newPriceData.custom = calculatePriceData('custom', state.customStartDate, state.customEndDate);
        } else {
          newPriceData.today = calculatePriceData('today');
          newPriceData.yesterday = calculatePriceData('yesterday');
          newPriceData.week = calculatePriceData('week');
          newPriceData.month = calculatePriceData('month');
        }
        updateState({
          priceData: newPriceData,
          priceLoading: false
        });
      } catch (error) {
        console.error('Error updating price data:', error);
        updateState({ priceLoading: false });
      }
    }
  }, [state.selectedDateRange, state.customStartDate, state.customEndDate, state.selectedCrop, allCrops, dataLoading, calculatePriceData, updateState]);

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
      Alert.alert('Success', 'Location saved to favorites!');
    }
  }, [state.markerPosition, state.favoriteLocations, updateState]);

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
          <Text style={mapStyles.mapLoadingText}>Loading crop data...</Text>
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              This may take a moment
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
            Error Loading Data
          </Text>
          <Text style={[mapStyles.mapLoadingText, { fontSize: 14, textAlign: 'center', marginBottom: 24 }]}>
            {dataError || 'Unable to load map data. Please check your connection and try again.'}
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
              Retry
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
          </View>
          <OfflineIndicator />
          <MapLegend selectedCrop={state.selectedCrop} radius={state.radius} />
          <View style={mapStyles.priceDisplaySection}>
            <Text style={mapStyles.priceSectionTitle}>Price Information</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={mapStyles.dateRangeSelectorScroll}
            >
              <View style={mapStyles.dateRangeSelector}>
                {(['today', 'yesterday', 'week', 'month', 'custom'] as DateRangeType[]).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      mapStyles.dateButton,
                      state.selectedDateRange === range && mapStyles.dateButtonActive
                    ]}
                    onPress={() => {
                      if (range === 'custom') {
                        updateState({ showCustomDateModal: true });
                      } else {
                        updateState({ selectedDateRange: range });
                      }
                    }}
                  >
                    <Text style={[
                      mapStyles.dateButtonText,
                      state.selectedDateRange === range && mapStyles.dateButtonTextActive
                    ]}>
                      {range === 'custom' && state.selectedDateRange === 'custom'
                        ? `${state.customStartDate.toLocaleDateString()} - ${state.customEndDate.toLocaleDateString()}`
                        : range.charAt(0).toUpperCase() + range.slice(1)
                      }
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={mapStyles.priceCardsContainer}>
              {[
                { key: 'min', title: 'Min Price', color: '#ff6b6b' },
                { key: 'max', title: 'Max Price', color: '#4ecdc4' },
                { key: 'average', title: 'Avg Price', color: '#45b7d1' },
                { key: 'modal', title: 'Modal Price', color: '#96ceb4' }
              ].map(({ key, title, color }) => (
                <View key={key} style={[mapStyles.priceCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                  <Text style={mapStyles.priceCardTitle}>{title}</Text>
                  {state.priceLoading ? (
                    <ActivityIndicator size="small" color="#49A760" />
                  ) : (
                    <>
                      <Text style={mapStyles.priceCardValue}>
                        {state.priceData[state.selectedDateRange]?.[key as keyof PriceData] > 0
                          ? `₹${state.priceData[state.selectedDateRange][key as keyof PriceData]}`
                          : 'No data'
                        }
                      </Text>
                      <Text style={mapStyles.priceCardCount}>
                        {state.priceData[state.selectedDateRange]?.count || 0} data points
                      </Text>
                    </>
                  )}
                </View>
              ))}
            </View>
            {!state.priceLoading && state.priceData[state.selectedDateRange]?.count === 0 && (
              <View style={mapStyles.noDataMessage}>
                <Ionicons name="information-circle-outline" size={24} color="#666" />
                <Text style={mapStyles.noDataText}>
                  No price data available for {state.selectedDateRange}.
                  {state.selectedDateRange === 'custom' ? ' Try adjusting your date range.' : ' Data will appear here once available.'}
                </Text>
              </View>
            )}
          </View>
          <View style={mapStyles.radiusSection}>
            <Text style={mapStyles.radiusSectionTitle}>Location & Radius Control</Text>
            <Text style={mapStyles.radiusSectionSubtitle}>
              Drag the marker on the map to change location, then adjust radius below
            </Text>
            {state.favoriteLocations.length > 0 && (
              <View style={mapStyles.favoriteLocationsContainer}>
                <Text style={mapStyles.favoriteLocationsTitle}>Favorite Locations</Text>
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
            <View style={mapStyles.radiusTypeToggle}>
              <TouchableOpacity
                style={[
                  mapStyles.radiusTypeButton,
                  state.radius <= 0.5 && mapStyles.radiusTypeButtonActive
                ]}
                onPress={() => {
                  if (state.radius > 0.5) updateState({ radius: 0.1 });
                }}
              >
                <Text style={[
                  mapStyles.radiusTypeButtonText,
                  state.radius <= 0.5 && mapStyles.radiusTypeButtonTextActive
                ]}>Meters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  mapStyles.radiusTypeButton,
                  state.radius > 0.5 && mapStyles.radiusTypeButtonActive
                ]}
                onPress={() => {
                  if (state.radius <= 0.5) updateState({ radius: 2 });
                }}
              >
                <Text style={[
                  mapStyles.radiusTypeButtonText,
                  state.radius > 0.5 && mapStyles.radiusTypeButtonTextActive
                ]}>Kilometers</Text>
              </TouchableOpacity>
            </View>
            <View style={mapStyles.radiusSliderContainer}>
              <View style={mapStyles.radiusValueContainer}>
                <Text style={mapStyles.radiusValue}>
                  {state.radius <= 0.5
                    ? `${Math.round(state.radius * 1000)}m`
                    : `${state.radius}km`
                  }
                </Text>
                <Text style={mapStyles.radiusDataCount}>
                  {filteredCrops.length} items in range
                </Text>
              </View>
              {state.radius <= 0.5 && (
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
                        { width: `${(state.radius * 1000 / 500) * 100}%` }
                      ]}
                    />
                    <View
                      style={[
                        mapStyles.sliderThumb,
                        { left: `${(state.radius * 1000 / 500) * 100}%` }
                      ]}
                    />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={mapStyles.sliderStepsScroll}
                  >
                    <View style={mapStyles.sliderSteps}>
                      {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((step) => (
                        <TouchableOpacity
                          key={step}
                          style={[
                            mapStyles.sliderStep,
                            Math.round(state.radius * 1000) === step && mapStyles.sliderStepActive
                          ]}
                          onPress={() => debouncedSetRadius(step / 1000)}
                        >
                          <Text style={[
                            mapStyles.sliderStepText,
                            Math.round(state.radius * 1000) === step && mapStyles.sliderStepTextActive
                          ]}>{step}m</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
              {state.radius > 0.5 && (
                <View style={mapStyles.kmSliderContainer}>
                  <View style={mapStyles.kmButtonsGrid}>
                    {[1, 2, 3, 4, 5, 10, 20, 50].map((km) => (
                      <TouchableOpacity
                        key={km}
                        style={[
                          mapStyles.kmButton,
                          state.radius === km && mapStyles.kmButtonActive
                        ]}
                        onPress={() => debouncedSetRadius(km)}
                      >
                        <Text style={[
                          mapStyles.kmButtonText,
                          state.radius === km && mapStyles.kmButtonTextActive
                        ]}>{km}km</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
          <ConsumerInfoPanel
            selectedCrop={state.selectedCrop}
            radius={state.radius}
            consumerStats={consumerStats}
            priceUnit={state.priceUnit}
            onRadiusIncrease={() => {
              const increment = state.radius <= 0.5 ? 0.05 : 1;
              const maxRadius = state.radius <= 0.5 ? 0.5 : 50;
              const newRadius = Math.min(state.radius + increment, maxRadius);
              debouncedSetRadius(newRadius);
            }}
          />
          <PriceUnitToggle
            priceUnit={state.priceUnit}
            onPriceUnitChange={handlePriceUnitChange}
          />
          <View style={mapStyles.dataSummarySection}>
            <Text style={mapStyles.dataSummaryTitle}>Data Summary & Analytics</Text>
            <View style={mapStyles.dataSummaryGrid}>
              <View style={mapStyles.dataSummaryCard}>
                <Ionicons name="analytics" size={24} color="#49A760" style={{ marginBottom: 8 }} />
                <Text style={mapStyles.dataSummaryLabel}>Total Data Points</Text>
                <Text style={mapStyles.dataSummaryValue}>{allCrops.length.toLocaleString()}</Text>
                <Text style={mapStyles.dataSummarySubtext}>All crops in database</Text>
              </View>

              <View style={mapStyles.dataSummaryCard}>
                <Ionicons name="location" size={24} color="#4ecdc4" style={{ marginBottom: 8 }} />
                <Text style={mapStyles.dataSummaryLabel}>In Selected Radius</Text>
                <Text style={mapStyles.dataSummaryValue}>{filteredCrops.length}</Text>
                <Text style={mapStyles.dataSummarySubtext}>
                  {state.selectedCrop} within {state.radius <= 0.5 ? `${Math.round(state.radius * 1000)}m` : `${state.radius}km`}
                </Text>
              </View>

              <View style={mapStyles.dataSummaryCard}>
                <Ionicons name="people" size={24} color="#45b7d1" style={{ marginBottom: 8 }} />
                <Text style={mapStyles.dataSummaryLabel}>Active Consumers</Text>
                <Text style={mapStyles.dataSummaryValue}>{consumersInRadius.length}</Text>
                <Text style={mapStyles.dataSummarySubtext}>In current radius</Text>
              </View>

              <View style={mapStyles.dataSummaryCard}>
                <Ionicons name="leaf" size={24} color="#96ceb4" style={{ marginBottom: 8 }} />
                <Text style={mapStyles.dataSummaryLabel}>Total Farmers</Text>
                <Text style={mapStyles.dataSummaryValue}>{allFarmerCrops.length}</Text>
                <Text style={mapStyles.dataSummarySubtext}>Selling data points</Text>
              </View>
              <View style={mapStyles.dataSummaryCard}>
                <Ionicons name="trending-up" size={24} color="#ff6b6b" style={{ marginBottom: 8 }} />
                <Text style={mapStyles.dataSummaryLabel}>Price Trend</Text>
                <Text style={mapStyles.dataSummaryValue}>
                  {state.priceData.today.average > state.priceData.yesterday.average ? '↗️' : '↘️'}
                </Text>
                <Text style={mapStyles.dataSummarySubtext}>
                  {state.priceData.today.average > state.priceData.yesterday.average ? 'Rising' : 'Falling'}
                </Text>
              </View>
              <View style={mapStyles.dataSummaryCard}>
                <Ionicons name="stats-chart" size={24} color="#ffa726" style={{ marginBottom: 8 }} />
                <Text style={mapStyles.dataSummaryLabel}>Market Volatility</Text>
                <Text style={mapStyles.dataSummaryValue}>
                  {state.priceData[state.selectedDateRange].count > 0 && state.priceData[state.selectedDateRange].average > 0
                    ? Math.round(((state.priceData[state.selectedDateRange].max - state.priceData[state.selectedDateRange].min) / state.priceData[state.selectedDateRange].average) * 100) + '%'
                    : 'N/A'
                  }
                </Text>
                <Text style={mapStyles.dataSummarySubtext}>Price variation</Text>
              </View>
            </View>
          </View>
          <View style={mapStyles.quickActionsSection}>
            <Text style={mapStyles.quickActionTitle}>Quick Actions</Text>
            <View style={mapStyles.quickActionsGrid}>
              <TouchableOpacity
                style={mapStyles.quickActionButton}
                onPress={() => {
                  Alert.alert(
                    'Export Data',
                    'Export current view data to CSV feature comming soon',
                    [
                      { text: 'OK' }
                      // {
                      //   text: 'Export', onPress: () => {
                      //     Alert.alert('Success', 'Data exported successfully!');
                      //   }
                      // }
                    ]
                  );
                }}
              >
                <Ionicons name="download" size={20} color="#49A760" />
                <Text style={mapStyles.quickActionText}>Export Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={mapStyles.quickActionButton}
                onPress={() => {
                  if (state.markerPosition) {
                    Alert.alert(
                      'Share Location',
                      `Lat: ${state.markerPosition.latitude.toFixed(4)}\nLng: ${state.markerPosition.longitude.toFixed(4)}`,
                      [{ text: 'OK' }]
                    );
                  }
                }}
              >
                <Ionicons name="share" size={20} color="#49A760" />
                <Text style={mapStyles.quickActionText}>Share Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={mapStyles.quickActionButton}
                onPress={() => {
                  if (currentLocation) {
                    updateState({
                      markerPosition: {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude
                      }
                    });
                  }
                }}
              >
                <Ionicons name="locate" size={20} color="#49A760" />
                <Text style={mapStyles.quickActionText}>My Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={mapStyles.quickActionButton}
                onPress={() => {
                  Alert.alert(
                    'Price Alert',
                    'Price alert feature coming soon!',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="notifications" size={20} color="#49A760" />
                <Text style={mapStyles.quickActionText}>Price Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
          {consumerChartData.length > 0 ? (
            <PriceChart
              chartData={consumerChartData}
              selectedCrop={state.selectedCrop}
              priceUnit={state.priceUnit}
              title="Consumer Buying Price Trends"
              isConsumerChart={true}
            />
          ) : (
            <View style={mapStyles.noChartDataContainer}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={mapStyles.noChartDataText}>
                No consumer chart data available for {state.selectedCrop}
              </Text>
            </View>
          )}
          {farmerChartData.length > 0 ? (
            <PriceChart
              chartData={farmerChartData}
              selectedCrop={state.selectedCrop}
              priceUnit={state.priceUnit}
              title="Farmer Selling Price Trends"
              isConsumerChart={false}
            />
          ) : (
            <View style={mapStyles.noChartDataContainer}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={mapStyles.noChartDataText}>
                No farmer chart data available for {state.selectedCrop}
              </Text>
            </View>
          )}
          <View style={mapStyles.marketInsightsSection}>
            <Text style={mapStyles.marketInsightsTitle}>Market Insights</Text>
            <View style={mapStyles.insightsContainer}>
              {state.priceData[state.selectedDateRange].count > 0 ? (
                <>
                  <View style={mapStyles.insightCard}>
                    <Text style={mapStyles.insightTitle}>Best Time to Buy</Text>
                    <Text style={mapStyles.insightText}>
                      Based on current trends, the optimal buying time appears to be when prices are closest to ₹{state.priceData[state.selectedDateRange].min}
                    </Text>
                  </View>

                  <View style={mapStyles.insightCard}>
                    <Text style={mapStyles.insightTitle}>Price Stability</Text>
                    <Text style={mapStyles.insightText}>
                      {state.priceData[state.selectedDateRange].average > 0 && ((state.priceData[state.selectedDateRange].max - state.priceData[state.selectedDateRange].min) / state.priceData[state.selectedDateRange].average) < 0.2
                        ? 'Market shows stable pricing with low volatility'
                        : 'Market shows high volatility - prices vary significantly'
                      }
                    </Text>
                  </View>

                  <View style={mapStyles.insightCard}>
                    <Text style={mapStyles.insightTitle}>Data Quality</Text>
                    <Text style={mapStyles.insightText}>
                      {state.priceData[state.selectedDateRange].count > 10
                        ? `Good data coverage with ${state.priceData[state.selectedDateRange].count} data points`
                        : `Limited data available (${state.priceData[state.selectedDateRange].count} points) - insights may be less reliable`
                      }
                    </Text>
                  </View>
                </>
              ) : (
                <View style={mapStyles.noInsightsContainer}>
                  <Ionicons name="bulb-outline" size={48} color="#ccc" />
                  <Text style={mapStyles.noInsightsText}>
                    No data available for market insights. Try a different date range or crop.
                  </Text>
                </View>
              )}
            </View>
          </View>
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
                <Text style={mapStyles.modalTitle}>Select Date Range</Text>
                <TouchableOpacity onPress={() => updateState({ showCustomDateModal: false })}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={mapStyles.datePickerContainer}>
                <View style={mapStyles.datePickerRow}>
                  <Text style={mapStyles.datePickerLabel}>From Date:</Text>
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
                  <Text style={mapStyles.datePickerLabel}>To Date:</Text>
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
                  <Text style={mapStyles.quickDateRangesTitle}>Quick Select:</Text>
                  <View style={mapStyles.quickDateButtons}>
                    {[
                      { label: 'Last 7 days', days: 7 },
                      { label: 'Last 30 days', days: 30 },
                      { label: 'Last 3 months', days: 90 }
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
                      updateState({
                        selectedDateRange: 'custom',
                        showCustomDateModal: false
                      });
                    } else {
                      Alert.alert('Invalid Date Range', 'End date must be after start date');
                    }
                  }}
                  disabled={state.customEndDate < state.customStartDate}
                >
                  <Text style={[
                    mapStyles.applyDateButtonText,
                    state.customEndDate < state.customStartDate && mapStyles.applyDateButtonTextDisabled
                  ]}>
                    {state.customEndDate < state.customStartDate ? 'Invalid Date Range' : 'Apply Date Range'}
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