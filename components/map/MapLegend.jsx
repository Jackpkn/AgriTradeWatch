import React from "react";
import { View, Text } from "react-native";
import { CROP_OPTIONS, MAP_CONFIG } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";

const MapLegend = ({ selectedCrop, radius }) => {
  const selectedCropData = CROP_OPTIONS.find((c) => c.value === selectedCrop);

  const legendItems = [
    {
      id: "inside",
      color: MAP_CONFIG.COLORS.INSIDE_RADIUS,
      label: `Within ${radius <= 0.5 ? `${Math.round(radius * 1000)}m` : `${radius}km`}`,
      type: "circle",
    },
    {
      id: "outside",
      color: MAP_CONFIG.COLORS.OUTSIDE_RADIUS,
      label: "Beyond radius",
      type: "circle",
    },
    {
      id: "user",
      color: MAP_CONFIG.COLORS.USER_LOCATION,
      label: "Your location",
      type: "center",
    },
  ];

  return (
    <View style={mapStyles.compactMapLegend}>
      <View style={mapStyles.compactLegendHeader}>
        <Text style={mapStyles.compactLegendCropIcon}>{selectedCropData?.icon}</Text>
        <Text style={mapStyles.compactLegendTitle}>
          {selectedCropData?.label} Map Legend
        </Text>
      </View>

      <View style={mapStyles.compactLegendItemsContainer}>
        {legendItems.map((item, index) => (
          <View key={item.id} style={mapStyles.compactLegendItem}>
            <View
              style={[
                item.type === "center"
                  ? mapStyles.compactLegendMarkerCenter
                  : mapStyles.compactLegendMarker,
                { backgroundColor: item.color },
              ]}
            />
            <Text style={mapStyles.compactLegendLabel}>{item.label}</Text>
            {index < legendItems.length - 1 && (
              <View style={mapStyles.compactLegendSeparator} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default MapLegend;
