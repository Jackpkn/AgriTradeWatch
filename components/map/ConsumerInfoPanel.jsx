import React from "react";
import { View, Text } from "react-native";
import { CROP_OPTIONS, MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const ConsumerInfoPanel = ({
  selectedCrop,
  radius,
  consumerStats,
  priceUnit,
}) => {
  const selectedCropData = CROP_OPTIONS.find((c) => c.value === selectedCrop);

  return (
    <View style={mapStyles.consumerInfoPanel}>
      {/* Header Section with Crop Info */}
      <View style={mapStyles.consumerInfoHeaderCard}>
        <View style={mapStyles.cropIconContainer}>
          <Text style={mapStyles.cropIcon}>{selectedCropData?.icon}</Text>
        </View>
        <View style={mapStyles.cropInfoContainer}>
          <Text style={mapStyles.consumerInfoTitle}>
            {selectedCropData?.label} Consumer Prices
          </Text>
          <Text style={mapStyles.consumerInfoSubtitle}>
            Within {Math.round(radius * 1000)}m radius
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={mapStyles.consumerStatsGrid}>
        <View style={mapStyles.consumerStatCard}>
          <View style={mapStyles.statIconContainer}>
            <Text style={mapStyles.statIcon}>💰</Text>
          </View>
          <Text style={mapStyles.consumerStatLabel}>Average Price</Text>
          <View style={mapStyles.priceContainer}>
            <Text style={mapStyles.currencySymbol}>₹</Text>
            <Text style={mapStyles.consumerStatValue}>
              {priceUnit === MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_KG
                ? consumerStats.averagePricePerKg
                : consumerStats.averagePrice}
            </Text>
            <Text style={mapStyles.consumerStatUnit}>
              {priceUnit === MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_KG
                ? "/kg"
                : "/unit"}
            </Text>
          </View>
        </View>

        <View style={mapStyles.consumerStatCard}>
          <View style={mapStyles.statIconContainer}>
            <Text style={mapStyles.statIcon}>👥</Text>
          </View>
          <Text style={mapStyles.consumerStatLabel}>Total Consumers</Text>
          <Text style={mapStyles.consumerStatValue}>{consumerStats.count}</Text>
          <Text style={mapStyles.consumerStatSubtext}>
            {consumerStats.count === 1 ? "consumer" : "consumers"} found
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ConsumerInfoPanel;
