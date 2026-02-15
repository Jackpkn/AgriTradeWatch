import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';
import { fetchCropPrices } from '@/components/crud';
import { useGlobal } from '@/context/global-provider';
import { useOrientation } from '@/utils/orientationUtils';
import { createStatsStyles } from '@/utils/responsiveStyles';
import { useTranslation } from '@/hooks/useTranslation';
import { useCommodities } from '@/hooks/useCommodities';

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
  allPrices?: number[]; // All prices for this date (for vertical stacking)
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
  loading?: boolean;
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
  consumerLoading: boolean;
  farmerLoading: boolean;
}

// Gradient colors
const GRADIENT_COLORS = {
  consumer: ['#49A760', '#3d8b4f'] as const,
  farmer: ['#2196F3', '#1976D2'] as const,
} as const;

const Stats: React.FC = () => {
  // Global context
  const { setIsLoading } = useGlobal();
  const { t } = useTranslation();
  const { commodities: cropOptions, loading: commoditiesLoading } = useCommodities();

  // State management
  const [state, setState] = useState<MarketAnalyticsState>({
    consumerCrops: [],
    farmerCrops: [],
    consumerCropName: 'onion',
    farmerCropName: 'onion',
    refreshing: false,
    showConsumerAnalytics: true,
    showFarmerAnalytics: true,
    consumerLoading: false,
    farmerLoading: false,
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

  // Use API-fetched crop list for both consumer and farmer (shows all crops)
  const consumerCropOptions = useMemo((): CropOption[] => {
    return cropOptions;
  }, [cropOptions]);

  const farmerCropOptions = useMemo((): CropOption[] => {
    return cropOptions;
  }, [cropOptions]);

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
    loading = false,
  }) => {
    try {
      // Show loading state
      if (loading) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="refresh-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>{t.stats.loadingCropData}</Text>
          </View>
        );
      }

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

      // Group prices by date - to show multiple prices at same x-position
      const dateGroups: { [key: string]: { prices: number[], timestamp: number } } = {};

      filteredCrops.forEach(crop => {
        const timestamp = getCropTimestamp(crop);
        const price = getCropPrice(crop);
        const dateLabel = formatDate(timestamp);

        if (price > 0) {
          if (!dateGroups[dateLabel]) {
            dateGroups[dateLabel] = { prices: [], timestamp };
          }
          dateGroups[dateLabel].prices.push(price);
        }
      });

      // Sort dates chronologically
      const sortedDates = Object.keys(dateGroups).sort((a, b) => {
        return dateGroups[a]!.timestamp - dateGroups[b]!.timestamp;
      });

      // Create primary data series (first price of each date)
      const data: ChartDataPoint[] = sortedDates.map(dateLabel => ({
        label: dateLabel,
        value: dateGroups[dateLabel]!.prices[0] || 0,
        timestamp: dateGroups[dateLabel]!.timestamp,
        dataPointText: `₹${dateGroups[dateLabel]!.prices[0]}`,
      }));

      // Create secondary data series (second price of each date, if exists)
      const data2: ChartDataPoint[] = sortedDates.map(dateLabel => ({
        label: dateLabel,
        value: dateGroups[dateLabel]!.prices[1] || 0, // 0 if no second price
        timestamp: dateGroups[dateLabel]!.timestamp,
        dataPointText: dateGroups[dateLabel]!.prices[1] ? `₹${dateGroups[dateLabel]!.prices[1]}` : '',
      }));

      // Create third data series (third price of each date, if exists)
      const data3: ChartDataPoint[] = sortedDates.map(dateLabel => ({
        label: dateLabel,
        value: dateGroups[dateLabel]!.prices[2] || 0,
        timestamp: dateGroups[dateLabel]!.timestamp,
        dataPointText: dateGroups[dateLabel]!.prices[2] ? `₹${dateGroups[dateLabel]!.prices[2]}` : '',
      }));

      // Check if we have secondary/tertiary prices
      const hasSecondPrices = data2.some(d => d.value > 0);
      const hasThirdPrices = data3.some(d => d.value > 0);

      console.log(`📊 [${type}] Data series:`, {
        primary: data.map(d => ({ label: d.label, value: d.value })),
        secondary: hasSecondPrices ? data2.filter(d => d.value > 0).map(d => ({ label: d.label, value: d.value })) : 'none',
        tertiary: hasThirdPrices ? data3.filter(d => d.value > 0).map(d => ({ label: d.label, value: d.value })) : 'none',
      });

      if (data.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.noDataText}>{t.stats.noValidPriceDataFor} {cropName}</Text>
            <Text style={styles.noDataSubtext}>{t.stats.checkIfPriceInfoAvailable}</Text>
          </View>
        );
      }

      // Calculate statistics from all prices (all series)
      const allValues = [
        ...data.map(d => d.value),
        ...data2.filter(d => d.value > 0).map(d => d.value),
        ...data3.filter(d => d.value > 0).map(d => d.value),
      ];
      const values = data.map(d => d.value); // For compatibility
      const maxValue = Math.max(...allValues);
      const minValue = Math.min(...allValues.filter(v => v > 0));
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
      const chartHeight = 280;

      // Handle single data point: add padding around the value for Y-axis range
      const adjustedMinValue = priceRange === 0 ? Math.max(0, minValue - minValue * 0.2) : minValue;
      const chartMaxValue = priceRange === 0
        ? maxValue + maxValue * 0.2  // Add 20% padding when single point
        : maxValue + priceRange * 0.1;

      // SVG Scatter Chart dimensions
      const padding = { top: 40, right: 20, bottom: 50, left: 50 };
      const plotWidth = chartWidth - padding.left - padding.right;
      const plotHeight = chartHeight - padding.top - padding.bottom;

      // Scale functions
      // Handle single data point: center it horizontally
      const xScale = (index: number) => {
        if (sortedDates.length === 1) {
          return padding.left + plotWidth / 2; // Center single point
        }
        return padding.left + (index / (sortedDates.length - 1)) * plotWidth;
      };
      // Use adjusted min for proper Y-axis scaling (handles single data point)
      const yScale = (value: number) => {
        const range = chartMaxValue - adjustedMinValue;
        if (range === 0) {
          return padding.top + plotHeight / 2; // Fallback: center vertically
        }
        return padding.top + plotHeight - ((value - adjustedMinValue) / range) * plotHeight;
      };

      // Y-axis labels - filter out duplicates caused by rounding
      const yAxisLabelsRaw = [];
      const numYLabels = 5;
      for (let i = 0; i <= numYLabels; i++) {
        const value = adjustedMinValue + (chartMaxValue - adjustedMinValue) * (i / numYLabels);
        yAxisLabelsRaw.push({ value: Math.round(value), y: yScale(value) });
      }
      // Remove duplicate values while keeping proper spacing
      const seenValues = new Set<number>();
      const yAxisLabels = yAxisLabelsRaw.filter(label => {
        if (seenValues.has(label.value)) return false;
        seenValues.add(label.value);
        return true;
      });

      return (
        <View style={[styles.chartWrapper, { overflow: 'visible' }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chartScrollContainer, { overflow: 'visible' }]}
            style={{ overflow: 'visible' }}
          >
            <View style={[styles.chartContainer, { overflow: 'visible' }]}>
              <Svg width={chartWidth} height={chartHeight}>
                {/* Y-axis */}
                <Line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={padding.top + plotHeight}
                  stroke="#ddd"
                  strokeWidth={1}
                />

                {/* X-axis */}
                <Line
                  x1={padding.left}
                  y1={padding.top + plotHeight}
                  x2={padding.left + plotWidth}
                  y2={padding.top + plotHeight}
                  stroke="#ddd"
                  strokeWidth={1}
                />

                {/* Horizontal grid lines and Y-axis labels */}
                {yAxisLabels.map((label, i) => (
                  <G key={`y-${i}`}>
                    <Line
                      x1={padding.left}
                      y1={label.y}
                      x2={padding.left + plotWidth}
                      y2={label.y}
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={padding.left - 8}
                      y={label.y + 4}
                      fontSize={10}
                      fill="#666"
                      textAnchor="end"
                    >
                      {label.value}
                    </SvgText>
                  </G>
                ))}

                {/* X-axis labels */}
                {sortedDates.map((dateLabel, index) => (
                  <SvgText
                    key={`x-${index}`}
                    x={xScale(index)}
                    y={padding.top + plotHeight + 20}
                    fontSize={9}
                    fill="#666"
                    textAnchor="middle"
                  >
                    {dateLabel}
                  </SvgText>
                ))}

                {/* Vertical grid lines */}
                {sortedDates.map((_, index) => (
                  <Line
                    key={`vline-${index}`}
                    x1={xScale(index)}
                    y1={padding.top}
                    x2={xScale(index)}
                    y2={padding.top + plotHeight}
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth={1}
                  />
                ))}

                {/* Data points - all prices for each date */}
                {sortedDates.flatMap((dateLabel, dateIndex) => {
                  const prices = dateGroups[dateLabel]?.prices || [];
                  const x = xScale(dateIndex);
                  const count = prices.length;

                  return (
                    <G key={`date-group-${dateIndex}`}>
                      {/* Count label - shown once per x-axis position */}
                      {count > 0 && (
                        <SvgText
                          x={x}
                          y={padding.top - 10}
                          fontSize={10}
                          fill={gradientColors[0]}
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          n={count}
                        </SvgText>
                      )}
                      {/* Dots for each price */}
                      {prices.map((price, priceIndex) => {
                        const y = yScale(price);
                        return (
                          <Circle
                            key={`point-${dateIndex}-${priceIndex}`}
                            cx={x}
                            cy={y}
                            r={6}
                            fill={gradientColors[0]}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      })}
                    </G>
                  );
                })}
              </Svg>
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
              dropdownIconColor="#000"
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
                    style={{ backgroundColor: "#fff" }}
                  />
                ))
              ) : (
                <Picker.Item
                  key="default"
                  label={`🌾 ${t.common.loading}`}
                  value="loading"
                  color="#666"
                  style={{ backgroundColor: "#fff" }}
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

  // Fetch consumer prices for selected commodity
  const fetchConsumerPrices = useCallback(async (commodity: string): Promise<void> => {
    if (!commodity) return;

    try {
      setState(prev => ({ ...prev, consumerLoading: true }));

      console.log('📊 Fetching consumer prices for:', commodity);
      const consumerData = await fetchCropPrices('consumers', commodity);
      const consumerCrops = Array.isArray(consumerData) ? consumerData : [];

      console.log('📊 Consumer prices received:', consumerCrops.length, 'entries');

      setState(prev => ({
        ...prev,
        consumerCrops,
        consumerLoading: false,
      }));

    } catch (error) {
      console.error('Error fetching consumer prices:', error);
      setState(prev => ({
        ...prev,
        consumerCrops: [],
        consumerLoading: false,
      }));
    }
  }, []);

  // Fetch farmer prices for selected commodity
  const fetchFarmerPrices = useCallback(async (commodity: string): Promise<void> => {
    if (!commodity) return;

    try {
      setState(prev => ({ ...prev, farmerLoading: true }));

      console.log('📊 Fetching farmer prices for:', commodity);
      const farmerData = await fetchCropPrices('farmers', commodity);
      const farmerCrops = Array.isArray(farmerData) ? farmerData : [];

      console.log('📊 Farmer prices received:', farmerCrops.length, 'entries');

      setState(prev => ({
        ...prev,
        farmerCrops,
        farmerLoading: false,
      }));

    } catch (error) {
      console.error('Error fetching farmer prices:', error);
      setState(prev => ({
        ...prev,
        farmerCrops: [],
        farmerLoading: false,
      }));
    }
  }, []);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    Promise.all([
      fetchConsumerPrices(state.consumerCropName),
      fetchFarmerPrices(state.farmerCropName),
    ]).finally(() => {
      setState(prev => ({ ...prev, refreshing: false }));
    });
  }, [fetchConsumerPrices, fetchFarmerPrices, state.consumerCropName, state.farmerCropName]);

  // Fetch consumer prices when consumer crop name changes
  useEffect(() => {
    if (state.consumerCropName) {
      fetchConsumerPrices(state.consumerCropName);
    }
  }, [state.consumerCropName, fetchConsumerPrices]);

  // Fetch farmer prices when farmer crop name changes
  useEffect(() => {
    if (state.farmerCropName) {
      fetchFarmerPrices(state.farmerCropName);
    }
  }, [state.farmerCropName, fetchFarmerPrices]);

  // Auto-reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Stats screen focused - refreshing data");
      if (state.consumerCropName) {
        fetchConsumerPrices(state.consumerCropName);
      }
      if (state.farmerCropName) {
        fetchFarmerPrices(state.farmerCropName);
      }
    }, [fetchConsumerPrices, fetchFarmerPrices, state.consumerCropName, state.farmerCropName])
  );

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
              loading={state.consumerLoading}
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
              loading={state.farmerLoading}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Stats;