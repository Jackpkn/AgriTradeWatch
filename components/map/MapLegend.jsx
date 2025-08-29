import React from "react";
import { View, Text } from "react-native";
import { CROP_OPTIONS, MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const MapLegend = ({ selectedCrop, radius }) => {
  const selectedCropData = CROP_OPTIONS.find((c) => c.value === selectedCrop);

  return (
    <View style={mapStyles.mapLegend}>
      <Text style={mapStyles.legendTitle}>
        {selectedCropData?.icon} {selectedCropData?.label} Locations
      </Text>
      <View style={mapStyles.legendItems}>
        <View style={mapStyles.legendItem}>
          <View
            style={[
              mapStyles.legendMarker,
              { backgroundColor: MAP_CONFIG.COLORS.INSIDE_RADIUS },
            ]}
          />
          <Text style={mapStyles.legendText}>
            In {Math.round(radius * 1000)}m Radius
          </Text>
        </View>
        <View style={mapStyles.legendItem}>
          <View
            style={[
              mapStyles.legendMarker,
              { backgroundColor: MAP_CONFIG.COLORS.OUTSIDE_RADIUS },
            ]}
          />
          <Text style={mapStyles.legendText}>Outside Radius</Text>
        </View>
        <View style={mapStyles.legendItem}>
          <View style={mapStyles.legendMarkerCenter} />
          <Text style={mapStyles.legendText}>Your Location</Text>
        </View>
      </View>
    </View>
  );
};

export default MapLegend;
