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
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useGlobal } from "@/context/global-provider";
import { damageService } from "@/services";
import { useOrientation } from "@/utils/orientationUtils";
import { createCropsStyles } from "@/utils/responsiveStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { COMMODITIES, DAMAGE_UNITS, DAMAGE_PLACE } from "@/constants/appConstants";
import { DamageCropFormData } from "@/types/api";

const DamageCrop: React.FC = () => {
  const navigation = useNavigation();
  const { mainUser, setIsLoading } = useGlobal();
  const { t } = useTranslation();
  const { isLandscape, width } = useOrientation() as any;
  const styles = useMemo(
    () => createCropsStyles(isLandscape, width),
    [isLandscape, width]
  );

  // Form state
  const [formData, setFormData] = useState<DamageCropFormData>({
    commodity: "",
    damage: "",
    unit: "ACRES",
    place_damage: "on_field",
    damage_date: new Date().toISOString().split("T")[0],
    report_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const [photo, setPhoto] = useState<any>(null);
  const [showDamageDatePicker, setShowDamageDatePicker] = useState(false);
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);

  // Memoize commodity list to ensure it's available in production
  const commodityList = useMemo(() => {
    const list = Array.isArray(COMMODITIES) ? [...COMMODITIES] : [];
    if (__DEV__) {
      console.log('Commodities loaded:', list.length, 'items');
    }
    return list;
  }, []);

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

  // Update form field
  const updateField = (field: keyof DamageCropFormData, value: any) => {
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
          name: asset.fileName || `damage_${Date.now()}.jpg`,
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
          name: `damage_${Date.now()}.jpg`,
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
    field: "damage_date" | "report_date"
  ) => {
    if (Platform.OS === "android") {
      setShowDamageDatePicker(false);
      setShowReportDatePicker(false);
    }

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      updateField(field, dateStr);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.commodity) {
      Alert.alert(t.common.error, t.damageCrop.fillAllFields);
      return false;
    }

    const damageAmount = parseFloat(formData.damage);
    if (isNaN(damageAmount) || damageAmount <= 0) {
      Alert.alert(t.common.error, t.damageCrop.validDamageAmount);
      return false;
    }

    return true;
  };

  // Submit damage report
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        commodity: formData.commodity,
        damage: parseFloat(formData.damage),
        unit: formData.unit,
        place_damage: formData.place_damage,
        damage_date: formData.damage_date,
        report_date: formData.report_date,
        remarks: formData.remarks,
        photo: photo
          ? {
            uri: photo.uri,
            name: photo.name,
            type: photo.type,
          }
          : undefined,
      };

      const response = await damageService.submitDamageReport(payload as any);

      if (response.success) {
        Alert.alert(t.common.success, t.damageCrop.submissionSuccess, [
          {
            text: t.common.ok,
            onPress: () => navigation.goBack(),
          },
        ]);

        // Reset form
        setFormData({
          commodity: "",
          damage: "",
          unit: "ACRES",
          place_damage: "on_field",
          damage_date: new Date().toISOString().split("T")[0],
          report_date: new Date().toISOString().split("T")[0],
          remarks: "",
        });
        setPhoto(null);
      } else {
        Alert.alert(t.damageCrop.submissionError, response.error || t.damageCrop.submissionFailed);
      }
    } catch (error: any) {
      console.error("Error submitting damage report:", error);
      Alert.alert(t.damageCrop.submissionError, error.message || t.damageCrop.submissionFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradientBackground}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.welcomeCard}>
              <LinearGradient colors={["#FF6B6B", "#E63946"]} style={styles.headerGradient}>
                <Text style={styles.headerTitle}>{t.damageCrop.header}</Text>
                <Text style={styles.headerSubtitle}>{t.damageCrop.damageInformation}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Commodity Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.selectCommodity}</Text>
              <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                <Picker
                  selectedValue={formData.commodity}
                  onValueChange={(value) => updateField("commodity", value)}
                  style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                  dropdownIconColor="#000"
                  itemStyle={{ fontSize: 16, color: "#000", backgroundColor: "#fff" }}
                  mode="dropdown"
                  dropdownIconRippleColor="#fff"
                >
                  <Picker.Item
                    label={t.damageCrop.chooseCommodity}
                    value=""
                    enabled={false}
                    color="#666"
                    style={{ backgroundColor: "#fff" }}
                  />
                  {commodityList.map((commodity, index) => (
                    <Picker.Item
                      key={`${commodity}-${index}`}
                      label={commodity}
                      value={commodity.toLowerCase()}
                      color="#000"
                      style={{ backgroundColor: "#fff" }}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Damage Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.damageAmount}</Text>
              <TextInput
                mode="outlined"
                value={formData.damage}
                onChangeText={(value) => updateField("damage", value)}
                placeholder={t.damageCrop.enterDamageAmount}
                keyboardType="numeric"
                style={styles.textInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF6B6B"
              />
            </View>

            {/* Unit Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.selectUnit}</Text>
              <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => updateField("unit", value)}
                  style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                  dropdownIconColor="#000"
                  itemStyle={{ fontSize: 16, color: "#000", backgroundColor: "#fff" }}
                  mode="dropdown"
                  dropdownIconRippleColor="#fff"
                >
                  {DAMAGE_UNITS.map((unit) => (
                    <Picker.Item
                      key={unit.id}
                      label={unit.label}
                      value={unit.id}
                      color="#000"
                      style={{ backgroundColor: "#fff" }}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Place Damage Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.placeDamage}</Text>
              <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                <Picker
                  selectedValue={formData.place_damage}
                  onValueChange={(value) => updateField("place_damage", value)}
                  style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                  dropdownIconColor="#000"
                  itemStyle={{ fontSize: 16, color: "#000", backgroundColor: "#fff" }}
                  mode="dropdown"
                  dropdownIconRippleColor="#fff"
                >
                  {DAMAGE_PLACE.map((place) => (
                    <Picker.Item
                      key={place.id}
                      label={place.label}
                      value={place.id}
                      color="#000"
                      style={{ backgroundColor: "#fff" }}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Damage Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.damageDate}</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDamageDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.dateText}>{formData.damage_date}</Text>
              </TouchableOpacity>
              {showDamageDatePicker && (
                <DateTimePicker
                  value={new Date(formData.damage_date)}
                  mode="date"
                  display="default"
                  onChange={(e, date) => handleDateChange(e, date, "damage_date")}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Report Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.reportDate}</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowReportDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.dateText}>{formData.report_date}</Text>
              </TouchableOpacity>
              {showReportDatePicker && (
                <DateTimePicker
                  value={new Date(formData.report_date)}
                  mode="date"
                  display="default"
                  onChange={(e, date) => handleDateChange(e, date, "report_date")}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Remarks */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.remarks}</Text>
              <TextInput
                mode="outlined"
                value={formData.remarks}
                onChangeText={(value) => updateField("remarks", value)}
                placeholder={t.damageCrop.enterRemarks}
                multiline
                numberOfLines={4}
                style={[styles.textInput, { height: 100 }]}
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF6B6B"
              />
            </View>

            {/* Photo Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.damageCrop.addPhoto}</Text>
              <Text style={styles.helperText}>{t.damageCrop.addPhotoMessage}</Text>

              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#FF6B6B" />
                  <Text style={styles.photoButtonText}>{t.damageCrop.takePhoto}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Ionicons name="images" size={24} color="#FF6B6B" />
                  <Text style={styles.photoButtonText}>{t.damageCrop.fromGallery}</Text>
                </TouchableOpacity>
              </View>

              {photo && (
                <View style={styles.photoPreview}>
                  <Text style={styles.photoAttachedText}>
                    {t.damageCrop.photoAttached.replace("{{fileName}}", photo.name)}
                  </Text>
                  <TouchableOpacity onPress={() => setPhoto(null)}>
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <View style={styles.submitButtonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <LinearGradient colors={["#FF6B6B", "#E63946"]} style={styles.submitGradient}>
                  <Text style={styles.submitButtonText}>{t.damageCrop.submitDamageReport}</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.requiredFieldsNote}>{t.damageCrop.requiredFields}</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default DamageCrop;
