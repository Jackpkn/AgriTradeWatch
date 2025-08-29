import React from "react";
import { View, Text } from "react-native";
import { CROP_OPTIONS, MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const MapLegend = ({ selectedCrop, radius }) => {
  const selectedCropData = CROP_OPTIONS.find((c) => c.value === selectedCrop);

  const legendItems = [
    {
      id: "inside",
      color: MAP_CONFIG.COLORS.INSIDE_RADIUS,
      label: `Within ${Math.round(radius * 1000)}m`,
      description: "Available nearby",
      type: "circle",
    },
    {
      id: "outside",
      color: MAP_CONFIG.COLORS.OUTSIDE_RADIUS,
      label: "Beyond radius",
      description: "Further away",
      type: "circle",
    },
    {
      id: "user",
      color: MAP_CONFIG.COLORS.USER_LOCATION,
      label: "Your location",
      description: "Current position",
      type: "center",
    },
  ];

  return (
    <View style={mapStyles.modernMapLegend}>
      <View style={mapStyles.legendHeader}>
        <View style={mapStyles.legendTitleContainer}>
          <Text style={mapStyles.legendCropIcon}>{selectedCropData?.icon}</Text>
          <View style={mapStyles.legendTitleTextContainer}>
            <Text style={mapStyles.legendTitle}>
              {selectedCropData?.label} Locations
            </Text>
            <Text style={mapStyles.legendSubtitle}>Map indicators</Text>
          </View>
        </View>
      </View>

      <View style={mapStyles.legendItemsContainer}>
        {legendItems.map((item) => (
          <View key={item.id} style={mapStyles.modernLegendItem}>
            <View style={mapStyles.legendMarkerContainer}>
              <View
                style={[
                  item.type === "center"
                    ? mapStyles.modernLegendMarkerCenter
                    : mapStyles.modernLegendMarker,
                  { backgroundColor: item.color },
                ]}
              />
            </View>
            <View style={mapStyles.legendTextContainer}>
              <Text style={mapStyles.modernLegendLabel}>{item.label}</Text>
              <Text style={mapStyles.modernLegendDescription}>
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default MapLegend;
