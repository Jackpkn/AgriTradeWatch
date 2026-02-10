import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { CROP_OPTIONS, MAP_CONFIG } from "@/constants/mapConfig";
import { useTranslation } from "@/hooks/useTranslation";

interface PriceChartProps {
  chartData: { value: number; label: string; count: number; allPrices?: number[] }[];
  selectedCrop: string;
  priceUnit: string;
  title: string;
  isConsumerChart?: boolean;
}

const { width } = Dimensions.get("window");

const PriceChart = ({
  chartData,
  selectedCrop,
  priceUnit,
  title,
  isConsumerChart = false,
}: PriceChartProps) => {
  const { t } = useTranslation();

  // Validate and sanitize chart data
  const validChartData = React.useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];

    return chartData
      .filter(
        (item) =>
          item &&
          typeof item.value === "number" &&
          !isNaN(item.value) &&
          item.value > 0 &&
          item.label
      )
      .map((item) => {
        const roundedValue = Math.round(item.value);
        // Ensure allPrices exists and contains valid values
        const allPrices = (item.allPrices || [item.value])
          .map((p: number) => Math.round(p))
          .filter((p: number) => p > 0 && !isNaN(p));
        return {
          ...item,
          value: roundedValue,
          dataPointText: `₹${roundedValue}`,
          count: item.count || 1,
          allPrices: allPrices.length > 0 ? allPrices : [roundedValue],
        };
      });
  }, [chartData, selectedCrop]);

  if (!validChartData.length) return null;

  const selectedCropData = CROP_OPTIONS.find((c) => c.value === selectedCrop);

  // Collect ALL prices across all dates for min/max calculation
  const allPricesFlat = validChartData.flatMap((d) => d.allPrices || [d.value]);
  const maxValue = Math.max(...allPricesFlat);
  const minValue = Math.min(...allPricesFlat.filter((v) => v > 0));

  // Chart dimensions
  const chartHeight = 280;
  const padding = { top: 40, right: 20, bottom: 50, left: 50 };
  const chartWidth = Math.max(width - 40, validChartData.length * 100);
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate Y-axis range with padding
  const yPadding = (maxValue - minValue) * 0.1 || 10;
  const yMin = Math.max(0, minValue - yPadding);
  const yMax = maxValue + yPadding;

  // Scale functions
  const xScale = (index: number) => {
    if (validChartData.length === 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (validChartData.length - 1)) * plotWidth;
  };
  const yScale = (value: number) => {
    return padding.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Y-axis labels
  const numYLabels = 5;
  const yAxisLabels = [];
  for (let i = 0; i <= numYLabels; i++) {
    const value = yMin + (yMax - yMin) * (i / numYLabels);
    yAxisLabels.push({ value: Math.round(value), y: yScale(value) });
  }



  const getGradientColors = () => {
    if (isConsumerChart) {
      return ["#FF6B6B", "#FF8E8E", "#FFB3B3"];
    }
    return ["#4ECDC4", "#45B7B8", "#26D0CE"];
  };

  return (
    <View style={modernStyles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F8FFFE"]}
        style={modernStyles.headerGradient}
      >
        <View style={modernStyles.header}>
          <View style={modernStyles.titleRow}>
            <Text style={modernStyles.cropIcon}>{selectedCropData?.icon}</Text>
            <View style={modernStyles.titleContainer}>
              <Text style={modernStyles.title}>{title}</Text>
              <Text style={modernStyles.cropName}>
                {selectedCropData?.label}
              </Text>
            </View>
            <View
              style={[
                modernStyles.badge,
                isConsumerChart
                  ? modernStyles.consumerBadge
                  : modernStyles.farmerBadge,
              ]}
            >
              <Text style={modernStyles.badgeText}>
                {isConsumerChart ? t.map.consumer : t.map.farmer}
              </Text>
            </View>
          </View>

          <View style={modernStyles.statsRow}>
            <View style={modernStyles.statItem}>
              <Text style={modernStyles.statValue}>₹{Math.round(maxValue)}</Text>
              <Text style={modernStyles.statLabel}>{t.map.peakPrice}</Text>
            </View>
            <View style={modernStyles.statDivider} />
            <View style={modernStyles.statItem}>
              <Text style={modernStyles.statValue}>₹{Math.round(minValue)}</Text>
              <Text style={modernStyles.statLabel}>{t.map.lowPrice}</Text>
            </View>
            <View style={modernStyles.statDivider} />
            <View style={modernStyles.statItem}>
              <Text style={modernStyles.statValue}>
                {validChartData.length}
              </Text>
              <Text style={modernStyles.statLabel}>{t.map.dataPoints}</Text>
            </View>
          </View>

          <Text style={modernStyles.subtitle}>
            {t.map.daily}{" "}
            {priceUnit === MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_KG
              ? t.map.perKg
              : t.map.perUnit}{" "}
            {t.map.prices}
            {validChartData.length > 1 && (
              <Text style={modernStyles.dateRange}>
                {" • "}
                {validChartData[0]?.label} {t.map.to}{" "}
                {validChartData[validChartData.length - 1]?.label}
              </Text>
            )}
          </Text>
        </View>
      </LinearGradient>
      <View style={modernStyles.chartContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={modernStyles.chartScroll}
          contentContainerStyle={modernStyles.chartScrollContent}
        >
          <View style={modernStyles.chartWrapper}>
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

              {/* Vertical grid lines and X-axis labels */}
              {validChartData.map((item, index) => (
                <G key={`x-${index}`}>
                  <Line
                    x1={xScale(index)}
                    y1={padding.top}
                    x2={xScale(index)}
                    y2={padding.top + plotHeight}
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={xScale(index)}
                    y={padding.top + plotHeight + 20}
                    fontSize={9}
                    fill="#666"
                    textAnchor="middle"
                  >
                    {item.label}
                  </SvgText>
                </G>
              ))}

              {/* Data points - ALL prices for each date (scatter plot) */}
              {validChartData.map((item, dateIndex) => {
                const prices = item.allPrices || [item.value];
                const x = xScale(dateIndex);
                const gradientColor = getGradientColors()[0];
                const count = prices.length;

                return (
                  <G key={`date-group-${dateIndex}`}>
                    {/* Count label - shown once per x-axis position */}
                    {count > 0 && (
                      <SvgText
                        x={x}
                        y={padding.top - 10}
                        fontSize={10}
                        fill={gradientColor}
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
                          fill={gradientColor}
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
    </View>
  );
};

const modernStyles = {
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden" as const,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  cropIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2C3E50",
    marginBottom: 2,
  },
  cropName: {
    fontSize: 16,
    color: "#7F8C8D",
    fontWeight: "500" as const,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  consumerBadge: {
    backgroundColor: "#FFE5E5",
  },
  farmerBadge: {
    backgroundColor: "#E5F9F6",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#2C3E50",
  },
  statsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C3E50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "500" as const,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E9ECEF",
    marginHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  dateRange: {
    color: "#95A5A6",
    fontWeight: "500" as const,
  },
  chartContainer: {
    backgroundColor: "#FAFBFC",
    paddingTop: 20,
  },
  chartScroll: {
    paddingHorizontal: 20,
  },
  chartScrollContent: {
    paddingRight: 20,
  },
  chartWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  xAxisLabel: {
    color: "#7F8C8D",
    fontSize: 11,
    fontWeight: "500" as const,
    rotation: 45,
  },
  yAxisLabel: {
    color: "#7F8C8D",
    fontSize: 12,
    fontWeight: "500" as const,
  },
  tooltip: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipGradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    minWidth: 120,
    alignItems: "center" as const,
  },
  tooltipPrice: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2C3E50",
    marginBottom: 4,
  },
  tooltipDate: {
    fontSize: 13,
    color: "#7F8C8D",
    fontWeight: "500" as const,
    marginBottom: 8,
  },
  tooltipReports: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  reportsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  reportsText: {
    fontSize: 11,
    color: "#95A5A6",
    fontWeight: "500" as const,
  },
};

export default PriceChart;
