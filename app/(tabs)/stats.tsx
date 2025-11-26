import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { fetchCrops } from '@/components/crud';
import { useGlobal } from '@/context/global-provider';
import { useOrientation } from '@/utils/orientationUtils';
import { createStatsStyles } from '@/utils/responsiveStyles';
import { useTranslation } from '@/hooks/useTranslation';

// Type definitions
interface CropLocation {
  timestamp?: number;
}

interface CropCreatedAt {
  seconds: number;
}

interface CropData {
  name?: string;
  commodity?: string;
  pricePerUnit?: number;
  buyingPrice?: number;
  location?: CropLocation;
  createdAt?: CropCreatedAt;
}

interface ChartDataPoint {
  label: string;
  value: number;
  timestamp: number;
  dataPointText: string;
}

interface CropOption {
  label: string;
  value: string;
  icon: string;
}

interface CropChartProps {
  cropsArray: CropData[];
  cropName: string;
  type: 'consumer' | 'farmer';
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
  screenData: {
    width: number;
    height: number;
  };
  isLandscape: boolean;
  t: any;
}

interface CropSelectorProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  crops: CropData[];
  type: 'consumer' | 'farmer';
}

interface MarketAnalyticsState {
  consumerCrops: CropData[];
  farmerCrops: CropData[];
  consumerCropName: string;
  farmerCropName: string;
  refreshing: boolean;
  showConsumerAnalytics: boolean;
  showFarmerAnalytics: boolean;
}

// Predefined crop list for stats dropdown
const AVAILABLE_CROPS: CropOption[] = [
  // Vegetables
  { label: 'Ambat Chukka', value: 'ambat chukka', icon: '🥬' },
  { label: 'Ginger', value: 'ginger', icon: '🫚' },
  { label: 'Onion', value: 'onion', icon: '🧅' },
  { label: 'Cucumber', value: 'cucumber', icon: '🥒' },
  { label: 'Bitter Gourd', value: 'bitter gourd', icon: '🥒' },
  { label: 'Coriander Leaves', value: 'coriander leaves', icon: '🌿' },
  { label: 'Cabbage', value: 'cabbage', icon: '🥬' },
  { label: 'Cluster Beans', value: 'cluster beans', icon: '🫘' },
  { label: 'Carrot', value: 'carrot', icon: '🥕' },
  { label: 'Cowpea', value: 'cowpea', icon: '🫘' },
  { label: 'Tomato', value: 'tomato', icon: '🍅' },
  { label: 'Capsicum', value: 'capsicum', icon: '🫑' },
  { label: 'Bottle Gourd', value: 'bottle gourd', icon: '🥒' },
  { label: 'Ridge Gourd', value: 'ridge gourd', icon: '🥒' },
  { label: 'Spinach', value: 'spinach', icon: '🥬' },
  { label: 'Cauliflower', value: 'cauliflower', icon: '🥦' },
  { label: 'Potato', value: 'potato', icon: '🥔' },
  { label: 'Beetroot', value: 'beetroot', icon: '🥕' },
  { label: 'Ladies Finger', value: 'ladies finger', icon: '🌱' },
  { label: 'Pumpkin', value: 'pumpkin', icon: '🎃' },
  { label: 'Radish', value: 'radish', icon: '🥕' },
  { label: 'Fenugreek Leaves', value: 'fenugreek leaves', icon: '🌿' },
  { label: 'Garlic', value: 'garlic', icon: '🧄' },
  { label: 'Lemon', value: 'lemon', icon: '🍋' },
  { label: 'Brinjal', value: 'brinjal', icon: '🍆' },
  { label: 'Drumstick', value: 'drumstick', icon: '🥬' },
  { label: 'Green Chilli', value: 'green chilli', icon: '🌶️' },

  // Fruits
  { label: 'Pomegranate', value: 'pomegranate', icon: '🍎' },
  { label: 'Custard Apple', value: 'custard apple', icon: '🍏' },
  { label: 'Dragon Fruit', value: 'dragon fruit', icon: '🐉' },
  { label: 'Grapes', value: 'grapes', icon: '🍇' },
  { label: 'Guava', value: 'guava', icon: '🍐' },
  { label: 'Orange', value: 'orange', icon: '🍊' },
  { label: 'Papaya', value: 'papaya', icon: '🥭' },
  { label: 'Sapota', value: 'sapota', icon: '🥔' },
  { label: 'Banana', value: 'banana', icon: '🍌' },
];

// Crop icons mapping
const CROP_ICONS: Record<string, string> = {
  // Vegetables
  'ambat chukka': '🥬',
  ginger: '🫚',
  onion: '🧅',
  cucumber: '🥒',
  'bitter gourd': '🥒',
  'coriander leaves': '🌿',
  coriander: '🌿',
  cabbage: '🥬',
  'cluster beans': '🫘',
  carrot: '🥕',
  cowpea: '🫘',
  tomato: '🍅',
  capsicum: '🫑',
  'bottle gourd': '🥒',
  'ridge gourd': '🥒',
  spinach: '🥬',
  cauliflower: '🥦',
  potato: '🥔',
  beetroot: '🥕',
  'ladies finger': '🌱',
  pumpkin: '🎃',
  radish: '🥕',
  'fenugreek leaves': '🌿',
  garlic: '🧄',
  lemon: '🍋',
  brinjal: '🍆',
  drumstick: '🥬',
  'green chilli': '🌶️',

  // Fruits
  pomegranate: '🍎',
  'custard apple': '🍏',
  'dragon fruit': '🐉',
  grapes: '🍇',
  grape: '🍇',
  guava: '🍐',
  orange: '🍊',
  papaya: '🥭',
  sapota: '🥔',
  banana: '🍌',

  // Other
  wheat: '🌾',
  default: '🌾',
} as const;

// Gradient colors
const GRADIENT_COLORS = {
  consumer: ['#49A760', '#3d8b4f'] as const,
  farmer: ['#2196F3', '#1976D2'] as const,
} as const;

const Stats: React.FC = () => {
  // Global context
  const { setIsLoading } = useGlobal();
  const { t } = useTranslation();

  // State management
  const [state, setState] = useState<MarketAnalyticsState>({
    consumerCrops: [],
    farmerCrops: [],
    consumerCropName: 'onion',
    farmerCropName: 'onion',
    refreshing: false,
    showConsumerAnalytics: true,
    showFarmerAnalytics: true,
  });

  // Orientation and styling
  const { screenData, isLandscape, width } = useOrientation() as unknown as {
    screenData: { width: number; height: number };
    isLandscape: boolean;
    width: number;
    height: number;
    breakpoints: Record<string, boolean>;
  };
  const styles = useMemo(() => createStatsStyles(isLandscape, width), [isLandscape, width]);

  // Use predefined crop list for both consumer and farmer (shows all crops)
  const consumerCropOptions = useMemo((): CropOption[] => {
    return AVAILABLE_CROPS;
  }, []);

  const farmerCropOptions = useMemo((): CropOption[] => {
    return AVAILABLE_CROPS;
  }, []);

  // Utility functions
  const isValidCrop = (crop: any): crop is CropData => {
    return crop && typeof crop === 'object';
  };

  const getCropPrice = (crop: CropData): number => {
    return Number(crop.pricePerUnit || crop.buyingPrice) || 0;
  };

  const getCropTimestamp = (crop: CropData): number => {
    return crop.location?.timestamp ||
      (crop.createdAt?.seconds ? crop.createdAt.seconds * 1000 : Date.now());
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);
  };

  const getTodaysPrices = (data: ChartDataPoint[]) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const todayData = data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= startOfToday && itemDate < endOfToday;
    });

    const todayValues = todayData
      .map(d => d.value)
      .filter(val => !isNaN(val) && val > 0);

    return {
      values: todayValues,
      highest: todayValues.length > 0 ? Math.max(...todayValues) : 0,
      lowest: todayValues.length > 0 ? Math.min(...todayValues) : 0,
      average: todayValues.length > 0 ?
        todayValues.reduce((sum, val) => sum + val, 0) / todayValues.length : 0,
      count: todayValues.length,
    };
  };

  // Chart component
  const CropChart: React.FC<CropChartProps> = ({
    cropsArray,
    cropName,
    type,
    showAnalytics,
    onToggleAnalytics,
    screenData,
    isLandscape,
    t,
  }) => {
    try {
      // Validation checks
      if (!cropsArray || !Array.isArray(cropsArray)) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="refresh-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>{t.stats.loadingCropData}</Text>
          </View>
        );
      }

      if (!cropName || cropName.trim() === '') {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>{t.stats.selectCropToView}</Text>
          </View>
        );
      }

      // Filter crops by name with more flexible matching
      const filteredCrops = cropsArray.filter(crop => {
        if (!isValidCrop(crop)) return false;

        const cropNameToCheck = crop.name || crop.commodity;
        if (!cropNameToCheck) return false;

        const normalizedCropName = cropNameToCheck.trim().toLowerCase();
        const normalizedSearchName = cropName.trim().toLowerCase();

        // Exact match or contains match
        return normalizedCropName === normalizedSearchName ||
          normalizedCropName.includes(normalizedSearchName) ||
          normalizedSearchName.includes(normalizedCropName);
      });

      console.log(`${type} filtering:`, {
        searchCrop: cropName,
        totalCrops: cropsArray.length,
        filteredCount: filteredCrops.length,
        sampleFiltered: filteredCrops.slice(0, 2).map(c => c.name || c.commodity)
      });

      if (filteredCrops.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.noDataText}>{t.stats.noDataAvailableFor} {cropName}</Text>
            <Text style={styles.noDataSubtext}>{t.stats.trySelectingDifferentCrop}</Text>
          </View>
        );
      }

      // Sort by timestamp
      filteredCrops.sort((a, b) => getCropTimestamp(a) - getCropTimestamp(b));

      // Process data points
      const data: ChartDataPoint[] = filteredCrops
        .map(crop => {
          const timestamp = getCropTimestamp(crop);
          const price = getCropPrice(crop);

          if (price > 0) {
            return {
              label: formatDate(timestamp),
              value: price,
              timestamp,
              dataPointText: `₹${price}`,
            };
          }
          return null;
        })
        .filter((item): item is ChartDataPoint => item !== null)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (data.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.noDataText}>{t.stats.noValidPriceDataFor} {cropName}</Text>
            <Text style={styles.noDataSubtext}>{t.stats.checkIfPriceInfoAvailable}</Text>
          </View>
        );
      }

      // Calculate statistics
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const medianValue = calculateMedian(values);
      const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const priceRange = maxValue - minValue;
      const priceVolatility = minValue > 0 ? ((priceRange / minValue) * 100).toFixed(1) : '0';

      // Today's prices
      const todaysPrices = getTodaysPrices(data);

      // Chart configuration
      const chartWidth = Math.max(
        screenData.width - 40,
        data.length * (isLandscape ? 100 : 80)
      );

      const gradientColors = GRADIENT_COLORS[type];

      return (
        <View style={styles.chartWrapper}>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContainer}
          >
            <View style={styles.chartContainer}>
              <LineChart
                data={data}
                width={chartWidth}
                height={280}
                yAxisTextStyle={styles.yAxisLabel}
                xAxisLabelTextStyle={styles.xAxisLabel}
                showVerticalLines
                verticalLinesColor="rgba(0,0,0,0.1)"
                textColor1={gradientColors[0]}
                color={gradientColors[0]}
                thickness={3}
                areaChart
                startFillColor={gradientColors[0]}
                endFillColor={gradientColors[1]}
                startOpacity={0.3}
                endOpacity={0.05}
                maxValue={maxValue + (maxValue - minValue) * 0.1}
                noOfSections={5}
                spacing={data.length > 10 ? 60 : 80}
                initialSpacing={20}
                endSpacing={20}
                rulesColor="rgba(0,0,0,0.1)"
                rulesType="solid"
                xAxisColor="#ddd"
                yAxisColor="#ddd"
                dataPointsColor={gradientColors[0]}
                dataPointsRadius={5}
                curved
                isAnimated
                animationDuration={1000}
              />
            </View>
          </ScrollView>
        </View>
      );
    } catch (error) {
      console.error(`CropChart ${type} error:`, error);
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.noDataText}>{t.stats.errorLoadingChart}</Text>
        </View>
      );
    }
  };

  // FIXED: Crop selector component now uses the correct crop options based on type
  const CropSelector: React.FC<CropSelectorProps> = ({
    selectedValue,
    onValueChange,
    type
  }) => {
    try {
      if (!selectedValue || !onValueChange || !type) {
        return (
          <View style={styles.selectorContainer}>
            <Text style={styles.noDataText}>{t.stats.loadingCropOptions}</Text>
          </View>
        );
      }

      // Use the correct crop options based on type
      const cropOptions = type === 'consumer' ? consumerCropOptions : farmerCropOptions;
      const selectedCrop = cropOptions.find(crop => crop.value === selectedValue);

      return (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>
            {type === 'consumer' ? t.stats.consumerCropAnalysis : t.stats.farmerCropAnalysis}
          </Text>
          <View style={styles.pickerContainer}>
            <View style={styles.selectedCropDisplay}>
              <Text style={styles.cropIcon}>{selectedCrop?.icon || '🌾'}</Text>
              <Text style={styles.selectedCropText}>
                {selectedCrop?.label || t.stats.selectCrop}
              </Text>
            </View>
            <Picker
              selectedValue={selectedValue || (cropOptions.length > 0 ? cropOptions[0]!.value : '')}
              style={styles.picker}
              onValueChange={(value: string) => {
                try {
                  if (onValueChange && typeof onValueChange === 'function') {
                    onValueChange(value);
                  }
                } catch (error) {
                  console.error('Picker onValueChange error:', error);
                }
              }}
              dropdownIconColor="#333"
              itemStyle={{ fontSize: 16, color: "#000" }}
              mode="dropdown"
            >
              {cropOptions.length > 0 ? (
                cropOptions.map((item, index) => (
                  <Picker.Item
                    key={item.value || `item-${index}`}
                    label={`${item.icon} ${item.label}`}
                    value={item.value}
                    color="#000"
                  />
                ))
              ) : (
                <Picker.Item
                  key="default"
                  label={`🌾 ${t.common.loading}`}
                  value="loading"
                  color="#666"
                />
              )}
            </Picker>
          </View>
        </View>
      );
    } catch (error) {
      console.error(`CropSelector ${type} error:`, error);
      return (
        <View style={styles.selectorContainer}>
          <Text style={styles.noDataText}>{t.stats.errorLoadingSelector}</Text>
        </View>
      );
    }
  };

  // Data fetching function
  const fetchAllCrops = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [consumerData, farmerData] = await Promise.all([
        fetchCrops('consumers'),
        fetchCrops('farmers'),
      ]);

      const consumerCrops = Array.isArray(consumerData) ? consumerData : [];
      const farmerCrops = Array.isArray(farmerData) ? farmerData : [];

      // Debug logging
      console.log('📊 Data fetching results:', {
        consumerCount: consumerCrops.length,
        farmerCount: farmerCrops.length,
        consumerSample: consumerCrops.slice(0, 3).map(c => ({
          name: c?.name,
          commodity: c?.commodity,
          price: c?.pricePerUnit || c?.buyingPrice
        })),
        farmerSample: farmerCrops.slice(0, 3).map(c => ({
          name: c?.name,
          commodity: c?.commodity,
          price: c?.pricePerUnit || c?.buyingPrice
        }))
      });

      setState(prev => ({
        ...prev,
        consumerCrops,
        farmerCrops,
        refreshing: false,
      }));

      const totalData = consumerCrops.length + farmerCrops.length;
      if (totalData > 0) {
        console.log(`✅ Successfully loaded ${totalData} market data points`);
      } else {
        console.log('ℹ️ No market data available yet');
      }

    } catch (error) {
      console.error('Error fetching crops:', error);
      Alert.alert(t.common.error, t.stats.failedToFetchCropData);

      setState(prev => ({
        ...prev,
        consumerCrops: [],
        farmerCrops: [],
        refreshing: false,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    fetchAllCrops();
  }, [fetchAllCrops]);

  // Effect hooks
  useEffect(() => {
    fetchAllCrops();
  }, [fetchAllCrops]);

  // FIXED: Set default crop names separately for consumer and farmer
  useEffect(() => {
    if (consumerCropOptions.length > 0 && !state.consumerCropName) {
      const firstConsumerCrop = consumerCropOptions[0]?.value;
      if (firstConsumerCrop) {
        setState(prev => ({
          ...prev,
          consumerCropName: firstConsumerCrop,
        }));
      }
    }
  }, [consumerCropOptions, state.consumerCropName]);

  useEffect(() => {
    if (farmerCropOptions.length > 0 && !state.farmerCropName) {
      const firstFarmerCrop = farmerCropOptions[0]?.value;
      if (firstFarmerCrop) {
        setState(prev => ({
          ...prev,
          farmerCropName: firstFarmerCrop,
        }));
      }
    }
  }, [farmerCropOptions, state.farmerCropName]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f8fffe', '#eafbe7']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={onRefresh}
              colors={['#49A760']}
              tintColor="#49A760"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#49A760', '#3d8b4f']}
              style={styles.headerGradient}
            >
              <Ionicons name="analytics" size={32} color="#fff" />
              <Text style={styles.headerTitle}>{t.stats.marketAnalytics}</Text>
              <Text style={styles.headerSubtitle}>
                {t.stats.trackAndAnalyzeCropPrices}
              </Text>
            </LinearGradient>
          </View>

          {/* DEBUG INFO - Remove this in production */}
          {/* {__DEV__ && (
            <View style={{ backgroundColor: '#f0f0f0', padding: 10, margin: 10, borderRadius: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Debug Info:</Text>
              <Text style={{ fontSize: 10 }}>Consumer crops: {state.consumerCrops.length}</Text>
              <Text style={{ fontSize: 10 }}>Farmer crops: {state.farmerCrops.length}</Text>
              <Text style={{ fontSize: 10 }}>Consumer options: {consumerCropOptions.length}</Text>
              <Text style={{ fontSize: 10 }}>Farmer options: {farmerCropOptions.length}</Text>
              <Text style={{ fontSize: 10 }}>
                Consumer options: {consumerCropOptions.map(o => o.label).join(', ')}
              </Text>
              <Text style={{ fontSize: 10 }}>
                Farmer options: {farmerCropOptions.map(o => o.label).join(', ')}
              </Text>
            </View>
          )} */}

          {/* Consumer Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#49A760', '#3d8b4f']}
                style={styles.sectionHeaderGradient}
              >
                <Ionicons name="person" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>{t.stats.consumerMarket}</Text>
              </LinearGradient>
            </View>

            <CropSelector
              selectedValue={state.consumerCropName}
              onValueChange={(value: string) =>
                setState(prev => ({ ...prev, consumerCropName: value }))
              }
              crops={state.consumerCrops}
              type="consumer"
            />

            <CropChart
              cropsArray={state.consumerCrops}
              cropName={state.consumerCropName}
              type="consumer"
              showAnalytics={state.showConsumerAnalytics}
              onToggleAnalytics={() =>
                setState(prev => ({ ...prev, showConsumerAnalytics: !prev.showConsumerAnalytics }))
              }
              screenData={screenData}
              isLandscape={isLandscape}
              t={t}
            />
          </View>

          {/* Farmer Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.sectionHeaderGradient}
              >
                <Ionicons name="leaf" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>{t.stats.farmerMarket}</Text>
              </LinearGradient>
            </View>

            <CropSelector
              selectedValue={state.farmerCropName}
              onValueChange={(value: string) =>
                setState(prev => ({ ...prev, farmerCropName: value }))
              }
              crops={state.farmerCrops}
              type="farmer"
            />

            <CropChart
              cropsArray={state.farmerCrops}
              cropName={state.farmerCropName}
              type="farmer"
              showAnalytics={state.showFarmerAnalytics}
              onToggleAnalytics={() =>
                setState(prev => ({ ...prev, showFarmerAnalytics: !prev.showFarmerAnalytics }))
              }
              screenData={screenData}
              isLandscape={isLandscape}
              t={t}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Stats;