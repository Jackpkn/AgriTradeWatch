import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const PriceUnitToggle = ({ priceUnit, onPriceUnitChange }) => {
  const { PER_UNIT, PER_KG } = MAP_CONFIG.PRICE_CONVERSION.UNITS;

  return (
    <View style={mapStyles.priceUnitContainer}>
      <TouchableOpacity
        style={[
          mapStyles.priceUnitButton,
          priceUnit === PER_UNIT && mapStyles.priceUnitButtonActive,
        ]}
        onPress={() => onPriceUnitChange(PER_UNIT)}
      >
        <Text
          style={[
            mapStyles.priceUnitText,
            priceUnit === PER_UNIT && mapStyles.priceUnitTextActive,
          ]}
        >
          Price per Unit
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          mapStyles.priceUnitButton,
          priceUnit === PER_KG && mapStyles.priceUnitButtonActive,
        ]}
        onPress={() => onPriceUnitChange(PER_KG)}
      >
        <Text
          style={[
            mapStyles.priceUnitText,
            priceUnit === PER_KG && mapStyles.priceUnitTextActive,
          ]}
        >
          Price per Kg
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PriceUnitToggle;
