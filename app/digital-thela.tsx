import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useGlobal } from "@/context/global-provider";
import { produceService } from "@/services";
import { useOrientation } from "@/utils/orientationUtils";
import { createCropsStyles } from "@/utils/responsiveStyles";
import { useTranslation } from "@/hooks/useTranslation";
import {
  COMMODITIES,
  CROP_UNITS,
  PRODUCTION_METHODS,
  PRODUCTION_LEVELS,
} from "@/constants/appConstants";
import { ProduceFormData } from "@/types/api";

const DigitalThela: React.FC = () => {
  const { mainUser, setIsLoading, currentLocation } = useGlobal();
  const { t } = useTranslation();
  const { isLandscape, width } = useOrientation() as any;
  const styles = useMemo(
    () => createCropsStyles(isLandscape, width),
    [isLandscape, width]
  );

  // Form state
  const [formData, setFormData] = useState<ProduceFormData>({
    sale_commodity: "",
    variety_name: "",
    method: "organic",
    level_of_produce: "selling_surplus",
    sowing_date: new Date().toISOString().split("T")[0],
    harvest_date: new Date().toISOString().split("T")[0],
    quantity_for_sale: "",
    cost: "",
    unit: "",
    produce_expense: "",
    profit_expectation: "",
    latitude: currentLocation?.latitude,
    longitude: currentLocation?.longitude,
  });

  const [photo, setPhoto] = useState<any>(null);
  const [showSowingDatePicker, setShowSowingDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t.common.error,
          "Sorry, we need media library permissions to upload photos."
        );
      }
    })();
  }, []);

  // Update location when available
  useEffect(() => {
    if (currentLocation) {
      setFormData((prev) => ({
        ...prev,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }));
    }
  }, [currentLocation]);

  // Update form field
  const updateField = (field: keyof ProduceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          name: asset.fileName || `produce_${Date.now()}.jpg`,
          type: asset.type || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t.common.error, "Failed to pick image");
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t.common.error,
          "Sorry, we need camera permissions to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          name: `produce_${Date.now()}.jpg`,
          type: "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(t.common.error, "Failed to take photo");
    }
  };

  // Handle date change
  const handleDateChange = (
    event: any,
    selectedDate: Date | undefined,
    field: "sowing_date" | "harvest_date"
  ) => {
    if (Platform.OS === "android") {
      setShowSowingDatePicker(false);
      setShowHarvestDatePicker(false);
    }

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      updateField(field, dateStr);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (
      !formData.sale_commodity ||
      !formData.variety_name ||
      !formData.unit
    ) {
      Alert.alert(t.common.error, t.digitalThela.fillAllFields);
      return false;
    }

    const quantity = parseFloat(formData.quantity_for_sale);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(t.common.error, t.digitalThela.validQuantity);
      return false;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert(t.common.error, t.digitalThela.validCost);
      return false;
    }

    const expense = parseFloat(formData.produce_expense);
    if (formData.produce_expense && (isNaN(expense) || expense < 0)) {
      Alert.alert(t.common.error, t.digitalThela.validExpense);
      return false;
    }

    const profit = parseFloat(formData.profit_expectation);
    if (formData.profit_expectation && (isNaN(profit) || profit < 0)) {
      Alert.alert(t.common.error, t.digitalThela.validProfit);
      return false;
    }

    return true;
  };

  // Submit produce
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        sale_commodity: formData.sale_commodity,
        variety_name: formData.variety_name,
        method: formData.method,
        level_of_produce: formData.level_of_produce,
        sowing_date: formData.sowing_date,
        harvest_date: formData.harvest_date,
        quantity_for_sale: parseFloat(formData.quantity_for_sale),
        cost: parseFloat(formData.cost),
        unit: formData.unit,
        produce_expense: parseFloat(formData.produce_expense) || 0,
        profit_expectation: parseFloat(formData.profit_expectation) || 0,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photo_or_video: photo
          ? {
              uri: photo.uri,
              name: photo.name,
              type: photo.type,
            }
          : undefined,
      };

      const response = await produceService.submitProduce(payload as any);

      if (response.success) {
        Alert.alert(t.common.success, t.digitalThela.submissionSuccess, [
          {
            text: t.common.ok,
            onPress: () => router.back(),
          },
        ]);

        // Reset form
        setFormData({
          sale_commodity: "",
          variety_name: "",
          method: "organic",
          level_of_produce: "selling_surplus",
          sowing_date: new Date().toISOString().split("T")[0],
          harvest_date: new Date().toISOString().split("T")[0],
          quantity_for_sale: "",
          cost: "",
          unit: "",
          produce_expense: "",
          profit_expectation: "",
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        });
        setPhoto(null);
      } else {
        Alert.alert(
          t.digitalThela.submissionError,
          response.error || t.digitalThela.submissionFailed
        );
      }
    } catch (error: any) {
      console.error("Error submitting produce:", error);
      Alert.alert(
        t.digitalThela.submissionError,
        error.message || t.digitalThela.submissionFailed
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#f8fffe", "#eafbe7"]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.welcomeCard}>
              <LinearGradient
                colors={["#9C27B0", "#7B1FA2"]}
                style={styles.headerGradient}
              >
                <Text style={styles.headerTitle}>{t.digitalThela.header}</Text>
                <Text style={styles.headerSubtitle}>
                  {t.digitalThela.welcomeMessage.replace(
                    "{{username}}",
                    (mainUser as any)?.username || "User"
                  )}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Commodity Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.selectCommodity}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.sale_commodity}
                  onValueChange={(value) => updateField("sale_commodity", value)}
                  style={styles.picker}
                >
                  <Picker.Item
                    label={t.digitalThela.chooseCommodity}
                    value=""
                    enabled={false}
                  />
                  {COMMODITIES.map((commodity) => (
                    <Picker.Item
                      key={commodity}
                      label={commodity}
                      value={commodity.toLowerCase()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Variety Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.varietyName}</Text>
              <TextInput
                mode="outlined"
                value={formData.variety_name}
                onChangeText={(value) => updateField("variety_name", value)}
                placeholder={t.digitalThela.enterVarietyName}
                style={styles.textInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#9C27B0"
              />
            </View>

            {/* Method of Production */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t.digitalThela.methodOfProduction}
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.method}
                  onValueChange={(value) => updateField("method", value)}
                  style={styles.picker}
                >
                  {PRODUCTION_METHODS.map((method) => (
                    <Picker.Item
                      key={method.id}
                      label={method.label}
                      value={method.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Production Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.productionLevel}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.level_of_produce}
                  onValueChange={(value) =>
                    updateField("level_of_produce", value)
                  }
                  style={styles.picker}
                >
                  {PRODUCTION_LEVELS.map((level) => (
                    <Picker.Item
                      key={level.id}
                      label={level.label}
                      value={level.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Sowing Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.sowingDate}</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowSowingDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.dateText}>{formData.sowing_date}</Text>
              </TouchableOpacity>
              {showSowingDatePicker && (
                <DateTimePicker
                  value={new Date(formData.sowing_date)}
                  mode="date"
                  display="default"
                  onChange={(e, date) =>
                    handleDateChange(e, date, "sowing_date")
                  }
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Harvest Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.harvestDate}</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowHarvestDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.dateText}>{formData.harvest_date}</Text>
              </TouchableOpacity>
              {showHarvestDatePicker && (
                <DateTimePicker
                  value={new Date(formData.harvest_date)}
                  mode="date"
                  display="default"
                  onChange={(e, date) =>
                    handleDateChange(e, date, "harvest_date")
                  }
                />
              )}
            </View>

            {/* Quantity for Sale */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.quantityForSale}</Text>
              <TextInput
                mode="outlined"
                value={formData.quantity_for_sale}
                onChangeText={(value) =>
                  updateField("quantity_for_sale", value)
                }
                placeholder={t.digitalThela.enterQuantity}
                keyboardType="numeric"
                style={styles.textInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#9C27B0"
              />
            </View>

            {/* Cost per Unit */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.costPerUnit}</Text>
              <TextInput
                mode="outlined"
                value={formData.cost}
                onChangeText={(value) => updateField("cost", value)}
                placeholder={t.digitalThela.enterCostPerUnit}
                keyboardType="numeric"
                style={styles.textInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#9C27B0"
              />
            </View>

            {/* Unit Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.selectUnit}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => updateField("unit", value)}
                  style={styles.picker}
                >
                  <Picker.Item
                    label={t.digitalThela.chooseUnit}
                    value=""
                    enabled={false}
                  />
                  {CROP_UNITS.map((unit) => (
                    <Picker.Item
                      key={unit.id}
                      label={unit.label}
                      value={unit.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Total Expense */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.totalExpense}</Text>
              <TextInput
                mode="outlined"
                value={formData.produce_expense}
                onChangeText={(value) => updateField("produce_expense", value)}
                placeholder={t.digitalThela.enterTotalExpense}
                keyboardType="numeric"
                style={styles.textInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#9C27B0"
              />
            </View>

            {/* Expected Profit */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.expectedProfit}</Text>
              <TextInput
                mode="outlined"
                value={formData.profit_expectation}
                onChangeText={(value) =>
                  updateField("profit_expectation", value)
                }
                placeholder={t.digitalThela.enterExpectedProfit}
                keyboardType="numeric"
                style={styles.textInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#9C27B0"
              />
            </View>

            {/* Photo Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.digitalThela.addPhotoVideo}</Text>
              <Text style={styles.helperText}>
                {t.digitalThela.addPhotoVideoMessage}
              </Text>

              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={24} color="#9C27B0" />
                  <Text style={styles.photoButtonText}>
                    {t.digitalThela.takePhoto}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={24} color="#9C27B0" />
                  <Text style={styles.photoButtonText}>
                    {t.digitalThela.fromGallery}
                  </Text>
                </TouchableOpacity>
              </View>

              {photo && (
                <View style={styles.photoPreview}>
                  <Text style={styles.photoAttachedText}>
                    {t.digitalThela.photoAttached.replace(
                      "{{fileName}}",
                      photo.name
                    )}
                  </Text>
                  <TouchableOpacity onPress={() => setPhoto(null)}>
                    <Ionicons name="close-circle" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButtonContainer}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={["#9C27B0", "#7B1FA2"]}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>
                  {t.digitalThela.submitProduce}
                </Text>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.requiredFieldsNote}>
              {t.digitalThela.requiredFields}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default DigitalThela;
