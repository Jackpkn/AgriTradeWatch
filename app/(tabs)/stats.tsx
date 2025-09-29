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

// Crop icons mapping
const CROP_ICONS: Record<string, string> = {
  onion: '🧅',
  tomato: '🍅',
  wheat: '🌾',
  lemon: '🍋',
  grape: '🍇',
  grapes: '🍇',
  coriander: '🌿',
  drumstick: '🥬',
  garlic: '🧄',
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

  // State management
  const [state, setState] = useState<MarketAnalyticsState>({
    consumerCrops: [],
    farmerCrops: [],
    consumerCropName: '',
    farmerCropName: '',
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

  // FIXED: Create separate crop options for consumer and farmer (no duplicates)
  const consumerCropOptions = useMemo((): CropOption[] => {
    // Extract crop names with better handling
    const cropNames = state.consumerCrops
      .map(crop => {
        const name = crop?.name || crop?.commodity;
        return name ? name.trim().toLowerCase() : null;
      })
      .filter((name): name is string => Boolean(name) && name !== '');

    // Remove duplicates using Set
    const uniqueCrops = [...new Set(cropNames)];

    console.log('Consumer crops data:', {
      totalCrops: state.consumerCrops.length,
      extractedNames: cropNames,
      uniqueNames: uniqueCrops
    });

    return uniqueCrops.map(crop => ({
      label: crop.charAt(0).toUpperCase() + crop.slice(1),
      value: crop.toLowerCase(),
      icon: CROP_ICONS[crop.toLowerCase()] || CROP_ICONS['default'] || '🌾',
    }));
  }, [state.consumerCrops]);

  const farmerCropOptions = useMemo((): CropOption[] => {
    // Extract crop names with better handling
    const cropNames = state.farmerCrops
      .map(crop => {
        const name = crop?.name || crop?.commodity;
        return name ? name.trim().toLowerCase() : null;
      })
      .filter((name): name is string => Boolean(name) && name !== '');

    // Remove duplicates using Set
    const uniqueCrops = [...new Set(cropNames)];

    console.log('Farmer crops data:', {
      totalCrops: state.farmerCrops.length,
      extractedNames: cropNames,
      uniqueNames: uniqueCrops
    });

    return uniqueCrops.map(crop => ({
      label: crop.charAt(0).toUpperCase() + crop.slice(1),
      value: crop.toLowerCase(),
      icon: CROP_ICONS[crop.toLowerCase()] || CROP_ICONS['default'] || '🌾',
    }));
  }, [state.farmerCrops]);

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
  }) => {
    try {
      // Validation checks
      if (!cropsArray || !Array.isArray(cropsArray)) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="refresh-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>Loading crop data...</Text>
          </View>
        );
      }

      if (!cropName || cropName.trim() === '') {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>Select a crop to view statistics</Text>
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
            <Text style={styles.noDataText}>No data available for {cropName}</Text>
            <Text style={styles.noDataSubtext}>Try selecting a different crop</Text>
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
            <Text style={styles.noDataText}>No valid price data for {cropName}</Text>
            <Text style={styles.noDataSubtext}>Check if price information is available</Text>
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
          {/* Toggle Button for Market Analytics */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={onToggleAnalytics}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showAnalytics ? 'eye-off' : 'eye'}
              size={20}
              color="#49A760"
            />
            <Text style={styles.toggleButtonText}>
              {showAnalytics ? 'Hide' : 'Show'} Market Analytics
            </Text>
            <Ionicons
              name={showAnalytics ? 'chevron-up' : 'chevron-down'}
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
                    <Text style={styles.todayPriceValue}>₹{todaysPrices.highest}</Text>
                    <Text style={styles.todayPriceLabel}>Highest Today</Text>
                    <Text style={styles.todayPriceCount}>
                      {todaysPrices.count} entries
                    </Text>
                  </View>
                  <View style={styles.todayPriceItem}>
                    <Ionicons name="trending-down" size={24} color="#FF6B6B" />
                    <Text style={styles.todayPriceValue}>₹{todaysPrices.lowest}</Text>
                    <Text style={styles.todayPriceLabel}>Lowest Today</Text>
                    <Text style={styles.todayPriceCount}>
                      {todaysPrices.count} entries
                    </Text>
                  </View>
                </View>
                {todaysPrices.values.length > 0 && (
                  <View style={styles.todayAverageRow}>
                    <Ionicons name="analytics" size={20} color="#FF9800" />
                    <Text style={styles.todayAverageText}>
                      Today's Average: ₹{todaysPrices.average.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>

              {/* OVERALL MARKET STATS */}
              <Text style={styles.overallStatsTitle}>📊 Overall Market Stats</Text>

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
                  <Text style={styles.primaryStatValue}>₹{medianValue.toFixed(1)}</Text>
                  <Text style={styles.primaryStatLabel}>Overall Median</Text>
                </View>
              </View>

              {/* Secondary Stats Row */}
              <View style={styles.secondaryStatsRow}>
                <View style={styles.secondaryStatItem}>
                  <Ionicons name="pulse" size={16} color="#9C27B0" />
                  <Text style={styles.secondaryStatValue}>₹{averageValue.toFixed(1)}</Text>
                  <Text style={styles.secondaryStatLabel}>Overall Avg</Text>
                </View>
                <View style={styles.secondaryStatItem}>
                  <Ionicons name="resize" size={16} color="#607D8B" />
                  <Text style={styles.secondaryStatValue}>₹{priceRange}</Text>
                  <Text style={styles.secondaryStatLabel}>Price Range</Text>
                </View>
                <View style={styles.secondaryStatItem}>
                  <Ionicons name="trending-up" size={16} color="#E91E63" />
                  <Text style={styles.secondaryStatValue}>{priceVolatility}%</Text>
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

          {/* Original Chart Stats */}
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
          <Text style={styles.noDataText}>Error loading chart</Text>
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
            <Text style={styles.noDataText}>Loading crop options...</Text>
          </View>
        );
      }

      // Use the correct crop options based on type
      const cropOptions = type === 'consumer' ? consumerCropOptions : farmerCropOptions;
      const selectedCrop = cropOptions.find(crop => crop.value === selectedValue);

      return (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>
            {type === 'consumer' ? 'Consumer' : 'Farmer'} Crop Analysis
          </Text>
          <View style={styles.pickerContainer}>
            <View style={styles.selectedCropDisplay}>
              <Text style={styles.cropIcon}>{selectedCrop?.icon || '🌾'}</Text>
              <Text style={styles.selectedCropText}>
                {selectedCrop?.label || 'Select Crop'}
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
              dropdownIconColor="#49A760"
            >
              {cropOptions.length > 0 ? (
                cropOptions.map((item, index) => (
                  <Picker.Item
                    key={item.value || `item-${index}`}
                    label={`${item.icon} ${item.label}`}
                    value={item.value}
                    style={styles.pickerItem}
                  />
                ))
              ) : (
                <Picker.Item
                  key="default"
                  label="🌾 Loading..."
                  value="loading"
                  style={styles.pickerItem}
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
          <Text style={styles.noDataText}>Error loading selector</Text>
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
      Alert.alert('Error', 'Failed to fetch crop data. Please try again.');

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
              <Text style={styles.headerTitle}>Market Analytics</Text>
              <Text style={styles.headerSubtitle}>
                Track and analyze crop price trends over time
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
                <Text style={styles.sectionTitle}>Consumer Market</Text>
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
                <Text style={styles.sectionTitle}>Farmer Market</Text>
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
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Stats;