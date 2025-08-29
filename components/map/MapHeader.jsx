import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { CROP_OPTIONS, MAP_TYPES } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const MapHeader = ({
  selectedCrop,
  selectedMapType,
  onCropPress,
  onMapTypeChange,
}) => {
  return (
    <View style={mapStyles.header}>
      <View style={mapStyles.headerTop}>
        <Text style={mapStyles.headerTitle}>Crop Map</Text>
        <View style={mapStyles.headerControls}>
          <View style={mapStyles.cropSelectorContainer}>
            <Text style={mapStyles.cropSelectorLabel}>Select Crop:</Text>
            <TouchableOpacity
              style={mapStyles.cropSelectorButton}
              onPress={onCropPress}
            >
              <Text style={mapStyles.cropSelectorButtonText}>
                {CROP_OPTIONS.find((c) => c.value === selectedCrop)?.icon ||
                  "🌾"}{" "}
                {CROP_OPTIONS.find((c) => c.value === selectedCrop)?.label ||
                  selectedCrop}
              </Text>
              <Icon name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={mapStyles.mapTypeSelector}>
        {MAP_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              mapStyles.mapTypeButton,
              selectedMapType === type.value && mapStyles.selectedMapTypeButton,
            ]}
            onPress={() => onMapTypeChange(type.value)}
          >
            <Text
              style={[
                mapStyles.mapTypeText,
                selectedMapType === type.value && mapStyles.selectedMapTypeText,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default MapHeader;
