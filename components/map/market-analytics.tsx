import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import OfflineIndicator from "../OfflineIndicator";
import { useGlobal } from "@/context/global-provider";
import { useMapData } from "@/hooks/useMapData";
import { marketsyles as styles } from "./market-analytics-style";


// Types
type PeriodKey = 'today' | 'yesterday' | 'week';

interface MarketStats {
  min: number;
  max: number;
  median: number;
  highest: number;
  lowest: number;
  totalCrops: number;
}

interface MarketData {
  today: MarketStats;
  yesterday: MarketStats;
  week: MarketStats;
}

interface PeriodButton {
  key: PeriodKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CropData {
  createdAt?: {
    seconds: number;
  };
  pricePerUnit: string | number;
}

const MarketAnalytics: React.FC = () => {
  const { isLogged } = useGlobal();
  const { allCrops, loading: dataLoading, error: dataError } = useMapData();

  // Market analysis state
  const [marketData, setMarketData] = useState<MarketData>({
    today: { min: 0, max: 0, median: 0, highest: 0, lowest: 0, totalCrops: 0 },
    yesterday: { min: 0, max: 0, median: 0, highest: 0, lowest: 0, totalCrops: 0 },
    week: { min: 0, max: 0, median: 0, highest: 0, lowest: 0, totalCrops: 0 }
  });
  const [marketLoading, setMarketLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('today');

  // Calculate market analysis data
  const calculateMarketData = useCallback(() => {
    if (!allCrops || allCrops.length === 0 || dataLoading) return;

    try {
      setMarketLoading(true);

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000);

      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Filter crops by date
      const todayCrops = allCrops.filter((crop: CropData) => {
        if (!crop.createdAt) return false;
        const cropDate = new Date(crop.createdAt.seconds * 1000);
        return cropDate >= startOfToday && cropDate < endOfToday;
      });

      const yesterdayCrops = allCrops.filter((crop: CropData) => {
        if (!crop.createdAt) return false;
        const cropDate = new Date(crop.createdAt.seconds * 1000);
        return cropDate >= startOfYesterday && cropDate < endOfYesterday;
      });

      const weekCrops = allCrops.filter((crop: CropData) => {
        if (!crop.createdAt) return false;
        const cropDate = new Date(crop.createdAt.seconds * 1000);
        return cropDate >= startOfWeek && cropDate < endOfToday;
      });

      // Calculate market data for each period
      const todayData = calculatePriceStats(todayCrops);
      const yesterdayData = calculatePriceStats(yesterdayCrops);
      const weekData = calculatePriceStats(weekCrops);

      setMarketData({
        today: todayData,
        yesterday: yesterdayData,
        week: weekData
      });

    } catch (error) {
      console.error('Error calculating market data:', error);
    } finally {
      setMarketLoading(false);
    }
  }, [allCrops]);

  // Helper function to calculate price statistics
  const calculatePriceStats = (crops: CropData[]): MarketStats => {
    if (!crops || crops.length === 0) {
      return { min: 0, max: 0, median: 0, highest: 0, lowest: 0, totalCrops: 0 };
    }

    const prices = crops
      .map((crop: CropData) => parseFloat(String(crop.pricePerUnit)))
      .filter((price: number) => !isNaN(price) && price > 0)
      .sort((a: number, b: number) => a - b);

    if (prices.length === 0) {
      return { min: 0, max: 0, median: 0, highest: 0, lowest: 0, totalCrops: crops.length };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const highest = max;
    const lowest = min;

    // Calculate median
    let median: number;
    if (prices.length % 2 === 0) {
      const mid1 = prices[Math.floor(prices.length / 2) - 1];
      const mid2 = prices[Math.floor(prices.length / 2)];
      median = (mid1! + mid2!) / 2;
    } else {
      median = prices[Math.floor(prices.length / 2)]!;
    }

    return {
      min,
      max,
      median,
      highest,
      lowest,
      totalCrops: crops.length
    };
  };

  // Effect to calculate market data when allCrops changes
  useEffect(() => {
    if (!dataLoading && allCrops.length > 0) {
      calculateMarketData();
    }
  }, [calculateMarketData, dataLoading, allCrops]);

  // Refresh market data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    calculateMarketData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [calculateMarketData]);

  // Period selection buttons
  const periodButtons: PeriodButton[] = [
    { key: 'today', label: 'Today', icon: 'sunny' },
    { key: 'yesterday', label: 'Yesterday', icon: 'moon' },
    { key: 'week', label: 'This Week', icon: 'calendar' }
  ];

  // Get current period data
  const currentData = marketData[selectedPeriod];

  // Calculate price change indicators
  const getPriceChangeIndicator = (current: number, previous: number): string | null => {
    if (current === 0 || previous === 0) return null;
    return current > previous ? '↗' : current < previous ? '↘' : '→';
  };

  const getPriceChangeColor = (current: number, previous: number): string => {
    if (current === 0 || previous === 0) return '#666';
    return current > previous ? '#49A760' : current < previous ? '#FF6B6B' : '#666';
  };

  if (!isLogged) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Ionicons name="lock-closed" size={64} color="#ccc" />
          <Text style={styles.unauthorizedText}>Please login to view Market Analytics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#f8fffe", "#eafbe7"]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <LinearGradient
              colors={["#49A760", "#3d8b4f"]}
              style={styles.headerGradient}
            >
              <Text style={styles.headerTitle}>Market Analytics</Text>
              <Text style={styles.headerSubtitle}>Real-time market insights and price trends</Text>
            </LinearGradient>
          </View>

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Period Selection */}
          <View style={styles.periodSelectionSection}>
            <Text style={styles.sectionTitle}>Select Time Period</Text>
            <View style={styles.periodButtonsContainer}>
              {periodButtons.map((period: PeriodButton) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Ionicons
                    name={period.icon}
                    size={20}
                    color={selectedPeriod === period.key ? "#fff" : "#49A760"}
                  />
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.periodButtonTextActive
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Market Overview Card */}
          <View style={styles.marketOverviewSection}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <View style={styles.marketOverviewCard}>
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.overviewHeader}
              >
                <Text style={styles.overviewTitle}>
                  {selectedPeriod === 'today' ? "Today's Market" :
                    selectedPeriod === 'yesterday' ? "Yesterday's Market" :
                      "This Week's Market"}
                </Text>
                <Ionicons name="trending-up" size={24} color="white" />
              </LinearGradient>

              <View style={styles.overviewStats}>
                <View style={styles.overviewStatRow}>
                  <View style={styles.overviewStatItem}>
                    <Text style={styles.overviewStatLabel}>Total Crops</Text>
                    <Text style={styles.overviewStatValue}>{currentData.totalCrops}</Text>
                  </View>
                  <View style={styles.overviewStatItem}>
                    <Text style={styles.overviewStatLabel}>Price Range</Text>
                    <Text style={styles.overviewStatValue}>₹{currentData.max - currentData.min}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Price Statistics Grid */}
          <View style={styles.priceStatsSection}>
            <Text style={styles.sectionTitle}>Price Statistics</Text>
            <View style={styles.priceStatsGrid}>
              <View style={styles.priceStatCard}>
                <View style={styles.priceStatHeader}>
                  <Ionicons name="trending-down" size={20} color="#FF6B6B" />
                  <Text style={styles.priceStatLabel}>Lowest Price</Text>
                </View>
                <Text style={styles.priceStatValue}>₹{currentData.lowest}</Text>
                {selectedPeriod !== 'today' && (
                  <Text style={[
                    styles.priceChangeIndicator,
                    { color: getPriceChangeColor(currentData.lowest, marketData.today.lowest) }
                  ]}>
                    {getPriceChangeIndicator(currentData.lowest, marketData.today.lowest)}
                  </Text>
                )}
              </View>

              <View style={styles.priceStatCard}>
                <View style={styles.priceStatHeader}>
                  <Ionicons name="trending-up" size={20} color="#49A760" />
                  <Text style={styles.priceStatLabel}>Highest Price</Text>
                </View>
                <Text style={styles.priceStatValue}>₹{currentData.highest}</Text>
                {selectedPeriod !== 'today' && (
                  <Text style={[
                    styles.priceChangeIndicator,
                    { color: getPriceChangeColor(currentData.highest, marketData.today.highest) }
                  ]}>
                    {getPriceChangeIndicator(currentData.highest, marketData.today.highest)}
                  </Text>
                )}
              </View>

              <View style={styles.priceStatCard}>
                <View style={styles.priceStatHeader}>
                  <Ionicons name="analytics" size={20} color="#FF9800" />
                  <Text style={styles.priceStatLabel}>Median Price</Text>
                </View>
                <Text style={styles.priceStatValue}>₹{currentData.median}</Text>
                {selectedPeriod !== 'today' && (
                  <Text style={[
                    styles.priceChangeIndicator,
                    { color: getPriceChangeColor(currentData.median, marketData.today.median) }
                  ]}>
                    {getPriceChangeIndicator(currentData.median, marketData.today.median)}
                  </Text>
                )}
              </View>

              <View style={styles.priceStatCard}>
                <View style={styles.priceStatHeader}>
                  <Ionicons name="pulse" size={20} color="#9C27B0" />
                  <Text style={styles.priceStatLabel}>Price Volatility</Text>
                </View>
                <Text style={styles.priceStatValue}>
                  {currentData.max > 0 && currentData.min > 0 ?
                    `${(((currentData.max - currentData.min) / currentData.min) * 100).toFixed(1)}%` :
                    '0%'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Price Breakdown */}
          <View style={styles.detailedBreakdownSection}>
            <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Minimum Price:</Text>
                <Text style={styles.breakdownValue}>₹{currentData.min}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Maximum Price:</Text>
                <Text style={styles.breakdownValue}>₹{currentData.max}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Median Price:</Text>
                <Text style={styles.breakdownValue}>₹{Math.round(currentData.median)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Price Range:</Text>
                <Text style={styles.breakdownValue}>₹{currentData.max - currentData.min}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total Entries:</Text>
                <Text style={styles.breakdownValue}>{currentData.totalCrops}</Text>
              </View>
            </View>
          </View>

          {/* Loading State */}
          {(marketLoading || dataLoading) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#49A760" />
              <Text style={styles.loadingText}>
                {dataLoading ? "Loading crop data..." : "Analyzing market data..."}
              </Text>
            </View>
          )}

          {/* Error State */}
          {dataError && !dataLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Error loading data: {dataError as any}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};


export default MarketAnalytics;
