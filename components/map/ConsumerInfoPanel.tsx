
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { CROP_OPTIONS, MAP_CONFIG } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";
interface ConsumerInfoPanelProps {
  selectedCrop: string;
  radius: number;
  consumerStats: {
    count: number;
    averagePrice: number;
    averagePricePerKg: number;
  };
  priceUnit: string;
  onRadiusIncrease: () => void;
}

const ConsumerInfoPanel = ({
  selectedCrop,
  radius,
  consumerStats,
  priceUnit,
  onRadiusIncrease,
}: ConsumerInfoPanelProps) => {
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
            {/* Note: Both show same price due to 1:1 conversion */}
          </View>
        </View>

        <View style={mapStyles.consumerStatCard}>
          <View style={mapStyles.statIconContainer}>
            <Text style={mapStyles.statIcon}>👥</Text>
          </View>
          <Text style={mapStyles.consumerStatLabel}>Total Retailer</Text>
          <Text style={mapStyles.consumerStatValue}>{consumerStats.count}</Text>
          <Text style={mapStyles.consumerStatSubtext}>
            {consumerStats.count === 1 ? "consumer" : "consumers"} found
          </Text>
        </View>
      </View>

      {/* No Data Message */}
      {consumerStats.averagePrice === 0 && consumerStats.count === 0 && (
        <View style={mapStyles.noDataCard}>
          <View style={mapStyles.noDataIconContainer}>
            <Text style={mapStyles.noDataIcon}>📍</Text>
          </View>
          <View style={mapStyles.noDataContent}>
            <Text style={mapStyles.noDataTitle}>No {selectedCropData?.label} retailers found</Text>
            <Text style={mapStyles.noDataSubtitle}>
              Try increasing the search radius to find more retailers in your area
            </Text>
            <TouchableOpacity
              style={mapStyles.increaseRadiusButton}
              onPress={() => {
                if (onRadiusIncrease) {
                  onRadiusIncrease();
                } else {
                  Alert.alert(
                    "Increase Search Radius",
                    `Current radius: ${Math.round(radius * 1000)}m\n\nWould you like to increase it to ${Math.round(radius * 1000) + 200}m?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Increase",
                        onPress: () => {
                          // This would need to be handled by parent component
                          console.log("Radius increase requested");
                        }
                      }
                    ]
                  );
                }
              }}
            >
              <Text style={mapStyles.increaseRadiusButtonText}>
                Increase Radius (+200m)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ConsumerInfoPanel;
