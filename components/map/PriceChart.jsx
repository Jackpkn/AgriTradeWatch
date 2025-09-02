import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { LinearGradient } from "expo-linear-gradient";
import { CROP_OPTIONS, MAP_CONFIG } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";

const { width } = Dimensions.get("window");

const PriceChart = ({
  chartData,
  selectedCrop,
  priceUnit,
  title,
  isConsumerChart = false,
}) => {
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
        console.log(`PriceChart: Processing ${selectedCrop} - Original: ${item.value}, Rounded: ${roundedValue}`);
        return {
          ...item,
          value: roundedValue,
          dataPointText: `₹${roundedValue}`,
          count: item.count || 1,
        };
      });
  }, [chartData, selectedCrop]);

  if (!validChartData.length) return null;

  const selectedCropData = CROP_OPTIONS.find((c) => c.value === selectedCrop);
  const chartWidth = Math.max(width - 40, validChartData.length * 120);

  const maxValue = Math.max(...validChartData.map((d) => Math.round(d.value)));
  const minValue = Math.min(...validChartData.map((d) => Math.round(d.value)));
  const priceRange = maxValue - minValue || 1;

  // Create consistent linear Y-axis intervals
  const getLinearYAxisConfig = () => {
    // Always start from 0 for consistency
    const yMin = 0;

    // Calculate a nice round interval (5, 10, 20, 25, 50, 100, etc.)
    let interval = 5;
    if (maxValue > 100) interval = 25;
    else if (maxValue > 50) interval = 10;
    else if (maxValue > 25) interval = 5;
    else interval = 2; // For very small values

    // Round max up to next interval
    const yMax = Math.ceil(maxValue / interval) * interval;

    // Generate Y-axis labels
    const yAxisLabels = [];
    for (let i = yMin; i <= yMax; i += interval) {
      yAxisLabels.push(i.toString());
    }

    return {
      min: yMin,
      max: yMax,
      interval: interval,
      labels: yAxisLabels,
      stepValue: interval,
      stepHeight: 320 / ((yMax - yMin) / interval)
    };
  };

  const yAxisConfig = getLinearYAxisConfig();

  // console.log(`Y-Axis Config for ${selectedCrop}:`, {
  //   dataMin: minValue,
  //   dataMax: maxValue,
  //   yAxisMin: yAxisConfig.min,
  //   yAxisMax: yAxisConfig.max,
  //   interval: yAxisConfig.interval,
  //   labels: yAxisConfig.labels
  // });

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
                {isConsumerChart ? "Consumer" : "Farmer"}
              </Text>
            </View>
          </View>

          <View style={modernStyles.statsRow}>
            <View style={modernStyles.statItem}>
              <Text style={modernStyles.statValue}>₹{Math.round(maxValue)}</Text>
              <Text style={modernStyles.statLabel}>Peak Price</Text>
            </View>
            <View style={modernStyles.statDivider} />
            <View style={modernStyles.statItem}>
              <Text style={modernStyles.statValue}>₹{Math.round(minValue)}</Text>
              <Text style={modernStyles.statLabel}>Low Price</Text>
            </View>
            <View style={modernStyles.statDivider} />
            <View style={modernStyles.statItem}>
              <Text style={modernStyles.statValue}>
                {validChartData.length}
              </Text>
              <Text style={modernStyles.statLabel}>Data Points</Text>
            </View>
          </View>

          <Text style={modernStyles.subtitle}>
            Daily{" "}
            {priceUnit === MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_KG
              ? "per kg"
              : "per unit"}{" "}
            prices
            {validChartData.length > 1 && (
              <Text style={modernStyles.dateRange}>
                {" • "}
                {validChartData[0]?.label} to{" "}
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
            <LineChart
              key={`${selectedCrop}-${priceUnit}-${validChartData.length}`}
              data={validChartData}
              width={chartWidth}
              height={320}
              yAxisLabel={"₹"}
              xAxisLabelTextStyle={modernStyles.xAxisLabel}
              yAxisLabelTextStyle={modernStyles.yAxisLabel}
              showVerticalLines
              verticalLinesColor={"rgba(79, 205, 196, 0.1)"}
              textColor={"#2C3E50"}
              color={getGradientColors()[0]}
              thickness={3}
              areaChart
              startFillColor={getGradientColors()[0]}
              endFillColor={getGradientColors()[2]}
              startOpacity={0.3}
              endOpacity={0.05}
              maxValue={yAxisConfig.max}
              minValue={yAxisConfig.min}
              stepValue={yAxisConfig.stepValue}
              stepHeight={yAxisConfig.stepHeight}
              yAxisLabelTexts={yAxisConfig.labels}
              textShiftY={-30}
              textShiftX={0}
              showDataPoints
              curved
              dataPointsColor={getGradientColors()[0]}
              dataPointsRadius={6}
              spacing={validChartData.length > 10 ? 60 : 90}
              initialSpacing={40}
              endSpacing={40}
              rulesColor={"rgba(44, 62, 80, 0.1)"}
              rulesType="solid"
              xAxisColor={"#BDC3C7"}
              yAxisColor={"#BDC3C7"}
              hideRules={false}
              hideDataPoints={false}
              focusEnabled
              pressEnabled
              showValuesAsDataPointsText={false}
              animateOnDataChange
              animationDuration={1200}
              pointerConfig={{
                pointerStripHeight: 250,
                pointerStripColor: "rgba(44, 62, 80, 0.15)",
                pointerStripWidth: 2,
                pointerColor: getGradientColors()[0],
                radius: 8,
                activatePointersOnLongPress: true,
                pointerLabelComponent: (item) => {
                  return (
                    <View style={modernStyles.tooltip}>
                      <LinearGradient
                        colors={["#FFFFFF", "#F8F9FA"]}
                        style={modernStyles.tooltipGradient}
                      >
                        <Text style={modernStyles.tooltipPrice}>
                          ₹{Math.round(item[0]?.value)}
                        </Text>
                        <Text style={modernStyles.tooltipDate}>
                          {item[0]?.label}
                        </Text>
                        <View style={modernStyles.tooltipReports}>
                          <View
                            style={[
                              modernStyles.reportsDot,
                              { backgroundColor: getGradientColors()[0] },
                            ]}
                          />
                          <Text style={modernStyles.reportsText}>
                            {item[0]?.count} reports
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  );
                },
              }}
            />
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
    overflow: "hidden",
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 2,
  },
  cropName: {
    fontSize: 16,
    color: "#7F8C8D",
    fontWeight: "500",
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
    fontWeight: "600",
    color: "#2C3E50",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "500",
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
    fontWeight: "500",
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
    fontWeight: "500",
    rotation: 45,
  },
  yAxisLabel: {
    color: "#7F8C8D",
    fontSize: 12,
    fontWeight: "500",
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
    alignItems: "center",
  },
  tooltipPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  tooltipDate: {
    fontSize: 13,
    color: "#7F8C8D",
    fontWeight: "500",
    marginBottom: 8,
  },
  tooltipReports: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
  },
};

export default PriceChart;
