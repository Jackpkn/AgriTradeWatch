
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CROP_OPTIONS, MAP_TYPES } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";
import { useTranslation } from "@/hooks/useTranslation";

interface MapHeaderProps {
  selectedCrop: string;
  selectedMapType: string;
  onCropPress: () => void;
  onMapTypeChange: (type: string) => void;
}

const MapHeader = ({
  selectedCrop,
  selectedMapType,
  onCropPress,
  onMapTypeChange,
}: MapHeaderProps) => {
  const { t } = useTranslation();

  const getMapTypeLabel = (value: string) => {
    if (value === "default") return t.map.satelliteMap;
    if (value === "street") return t.map.streetMap;
    return value;
  };

  return (
    <View style={mapStyles.header}>
      <View style={mapStyles.headerTop}>
        <Text style={mapStyles.headerTitle}>{t.map.cropMap}</Text>
        <View style={mapStyles.headerControls}>
          <View style={mapStyles.cropSelectorContainer}>
            <Text style={mapStyles.cropSelectorLabel}>{t.map.selectCrop}:</Text>
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
              <Ionicons name="chevron-down" size={16} color="#fff" />
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
              {getMapTypeLabel(type.value)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default MapHeader;
