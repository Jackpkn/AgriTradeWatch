import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const RadiusSlider = ({ radius, onRadiusChange }) => {
  return (
    <View style={mapStyles.sliderSection}>
      <Text style={mapStyles.sliderLabel}>
        Radius: {(radius * 1000).toFixed(0)}m
      </Text>
      <Slider
        style={mapStyles.slider}
        minimumValue={MAP_CONFIG.RADIUS.MIN}
        maximumValue={MAP_CONFIG.RADIUS.MAX}
        value={radius}
        onValueChange={onRadiusChange}
        minimumTrackTintColor={MAP_CONFIG.COLORS.PRIMARY}
        maximumTrackTintColor="#ddd"
        thumbStyle={mapStyles.sliderThumb}
      />

      {/* Range Labels */}
      <View style={mapStyles.sliderRangeLabels}>
        <Text style={mapStyles.sliderRangeLabel}>Nearby</Text>
        <Text
          style={[mapStyles.sliderRangeLabel, mapStyles.sliderRangeLabelCenter]}
        >
          Local
        </Text>
        <Text style={mapStyles.sliderRangeLabel}>Regional</Text>
      </View>

      {/* Slider Markers */}
      <View style={mapStyles.sliderMarkersContainer}>
        {/* Current value indicator */}
        <View
          style={[
            mapStyles.sliderCurrentIndicator,
            { left: `${(radius / MAP_CONFIG.RADIUS.MAX) * 100}%` },
          ]}
        >
          <View style={mapStyles.sliderCurrentIndicatorLine} />
          <View style={mapStyles.sliderCurrentIndicatorDot} />
        </View>

        {/* Major markers (every 100m) */}
        {[100, 200, 300, 400, 500, 600, 700].map((value) => {
          const position = (value / 700) * 100;
          return (
            <View
              key={value}
              style={[mapStyles.sliderMarker, { left: `${position}%` }]}
            >
              <View style={mapStyles.sliderMarkerLine} />
              <Text style={mapStyles.sliderMarkerText}>{value}m</Text>
            </View>
          );
        })}

        {/* Minor markers (every 50m) */}
        {[50, 150, 250, 350, 450, 550, 650].map((value) => {
          const position = (value / 700) * 100;
          return (
            <View
              key={value}
              style={[mapStyles.sliderMinorMarker, { left: `${position}%` }]}
            >
              <View style={mapStyles.sliderMinorMarkerLine} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default RadiusSlider;
