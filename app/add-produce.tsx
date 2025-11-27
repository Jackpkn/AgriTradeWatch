import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

import { useGlobal } from "@/context/global-provider";
import { produceService } from "@/services";
import { useOrientation } from "@/utils/orientationUtils";
import { useTranslation } from "@/hooks/useTranslation";
import {
  COMMODITIES,
  CROP_UNITS,
  PRODUCTION_LEVELS,
} from "@/constants/appConstants";

// Types
interface ProduceFormState {
  sale_commodity: string;
  variety_name: string;
  level_of_produce: string;
  quantity_for_sale: string;
  cost: string;
  unit: string;
}

interface PhotoState {
  uri: string;
  base64?: string;
  fileName?: string;
  type?: string;
}

// Styles - created once for better performance
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fffe" },
    gradient: { flex: 1 },
    scrollContent: { paddingBottom: 24 },
    headerSection: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
    },
    headerGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 20,
      borderRadius: 12,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#fff",
      marginLeft: 12,
    },
    formContainer: {
      paddingHorizontal: 16,
    },
    formCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
      color: "#333",
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#333",
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: "#fff",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      borderRadius: 4,
      backgroundColor: "#fff",
      overflow: "hidden",
    },
    picker: {
      height: 50,
    },
    imageSection: {
      marginTop: 8,
    },
    imageHelpText: {
      fontSize: 12,
      color: "#888",
      marginBottom: 12,
    },
    imageButtons: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    imageButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderWidth: 1,
      borderColor: "#9C27B0",
      borderRadius: 8,
      gap: 8,
    },
    imageButtonText: {
      color: "#9C27B0",
      fontWeight: "600",
      fontSize: 14,
    },
    imagePreview: {
      position: "relative",
      marginTop: 12,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    previewImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
    },
    removeImageButton: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 4,
    },
    imageInfo: {
      padding: 8,
      backgroundColor: "#f8f9fa",
    },
    imageInfoText: {
      fontSize: 12,
      color: "#666",
    },
    submitButton: {
      marginTop: 24,
      borderRadius: 8,
      overflow: "hidden",
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#fff",
    },
    footerInfo: {
      marginTop: 16,
      gap: 4,
    },
    footerText: {
      fontSize: 12,
      color: "#888",
      textAlign: "center",
    },
    cameraContainer: {
      flex: 1,
      backgroundColor: "#000",
    },
    camera: {
      flex: 1,
    },
    cameraControls: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    captureButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#fff",
      borderWidth: 5,
      borderColor: "#9C27B0",
    },
    cameraCloseButton: {
      position: "absolute",
      top: 40,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      padding: 8,
    },
  });

const AddProduce: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { currentLocation, setIsLoading, isLogged } = useGlobal();

  const [formData, setFormData] = useState<ProduceFormState>({
    sale_commodity: "",
    variety_name: "",
    level_of_produce: "selling_surplus",
    quantity_for_sale: "",
    cost: "",
    unit: "",
  });

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Lazy load permissions only when needed
  const requestPermissions = useCallback(async () => {
    if (hasPermission !== null) return hasPermission;

    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    const mediaStatus = await MediaLibrary.requestPermissionsAsync();
    const granted = cameraStatus.status === "granted" && mediaStatus.status === "granted";
    setHasPermission(granted);
    return granted;
  }, [hasPermission]);

  const handleTakePicture = useCallback(async () => {
    if (cameraRef.current) {
      const takenPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        exif: false,
      });

      if (takenPhoto) {
        const fileName = `produce_${formData.sale_commodity || "unknown"}_${Date.now()}.jpg`;
        const mimeType = "image/jpeg";

        setPhoto({
          uri: takenPhoto.uri,
          base64: takenPhoto.base64 ?? "",
          fileName,
          type: mimeType,
        });
        setIsCameraOpen(false);

        try {
          await MediaLibrary.saveToLibraryAsync(takenPhoto.uri);
        } catch (error) {
          console.warn("Failed to save image to library:", error);
        }
      }
    }
  }, [formData.sale_commodity]);

  const handlePickImage = useCallback(async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        t.common.required,
        "Please grant camera and media library access in your device settings."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName =
        asset.fileName || `produce_${formData.sale_commodity || "unknown"}_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || "image/jpeg";

      setPhoto({
        uri: asset.uri,
        base64: "",
        fileName,
        type: mimeType,
      });
    }
  }, [requestPermissions, formData.sale_commodity, t]);

  const updateField = useCallback((field: keyof ProduceFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (
      !formData.sale_commodity ||
      !formData.variety_name ||
      !formData.unit
    ) {
      Alert.alert(t.common.error, t.digitalThela.fillAllFields || "Please fill all required fields");
      return false;
    }

    const quantity = parseFloat(formData.quantity_for_sale);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(t.common.error, t.digitalThela.validQuantity || "Please enter a valid quantity");
      return false;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert(t.common.error, t.digitalThela.validCost || "Please enter a valid cost");
      return false;
    }

    return true;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    if (!isLogged) {
      Alert.alert(
        t.auth.authRequired,
        t.auth.authRequiredMessage,
        [
          { text: t.auth.login, onPress: () => navigation.navigate("Login" as never) },
          { text: t.common.cancel, style: "cancel" },
        ]
      );
      return;
    }

    if (!validateForm()) return;

    if (!currentLocation) {
      Alert.alert(
        t.auth.locationRequired,
        t.crops.locationRequiredMessage || "Location is required to add produce",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: t.common.cancel, style: "cancel" },
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        sale_commodity: formData.sale_commodity,
        variety_name: formData.variety_name,
        method: "organic", // Default
        level_of_produce: formData.level_of_produce,
        sowing_date: new Date().toISOString().split("T")[0],
        harvest_date: new Date().toISOString().split("T")[0],
        quantity_for_sale: parseFloat(formData.quantity_for_sale),
        cost: parseFloat(formData.cost),
        unit: formData.unit,
        produce_expense: 0,
        profit_expectation: 0,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      if (photo) {
        console.log("📸 Photo available, adding to payload:", {
          uri: photo.uri,
          name: photo.fileName,
          type: photo.type,
        });

        payload.photo_or_video = {
          uri: photo.uri,
          name: photo.fileName || `produce_${Date.now()}.jpg`,
          type: photo.type || "image/jpeg",
        };
      } else {
        console.log("📸 No photo selected, submitting without image");
      }

      const response = await produceService.submitProduce(payload);

      if (response.success) {
        Alert.alert(
          t.common.success,
          t.digitalThela.submissionSuccess || "Your produce has been added successfully!",
          [
            {
              text: t.common.ok,
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t.digitalThela.submissionError || "Submission Error",
          response.error || t.digitalThela.submissionFailed || "Failed to submit produce"
        );
      }
    } catch (error: any) {
      console.error("Produce submission error:", error);
      Alert.alert(
        t.digitalThela.submissionError || "Submission Error",
        error.message || "Failed to submit produce. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, currentLocation, isLogged, setIsLoading, photo, t, navigation]);

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePicture}
            accessible={true}
            accessibilityLabel="Take picture"
          />
          <TouchableOpacity
            style={styles.cameraCloseButton}
            onPress={() => setIsCameraOpen(false)}
            accessible={true}
            accessibilityLabel="Close camera"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <LinearGradient
              colors={["#9C27B0", "#7B1FA2"]}
              style={styles.headerGradient}
            >
              <Ionicons name="add-circle" size={32} color="#fff" />
              <Text style={styles.headerTitle}>
                {t.digitalThela.addProduce || "Add Produce Details"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {t.digitalThela.produceInformation || "Produce Information"}
              </Text>

              {/* Commodity Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.selectCommodity || "Commodity"} *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.sale_commodity}
                    onValueChange={(value) => updateField("sale_commodity", value)}
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    <Picker.Item
                      label={t.digitalThela.chooseCommodity || "Select a commodity"}
                      value=""
                      color="#888"
                      enabled={false}
                    />
                    {COMMODITIES.map((commodity) => (
                      <Picker.Item
                        key={commodity}
                        label={commodity}
                        value={commodity.toLowerCase()}
                        color="#333"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Variety Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.varietyName || "Variety Name"} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  value={formData.variety_name}
                  onChangeText={(value) => updateField("variety_name", value)}
                  placeholder={t.digitalThela.enterVarietyName || "Enter variety name"}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#9C27B0"
                />
              </View>

              {/* Production Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.productionLevel || "Production Level"} *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.level_of_produce}
                    onValueChange={(value) =>
                      updateField("level_of_produce", value)
                    }
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    {PRODUCTION_LEVELS.map((level) => (
                      <Picker.Item
                        key={level.id}
                        label={level.label}
                        value={level.id}
                        color="#333"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Quantity for Sale */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.quantityForSale || "Quantity for Sale"} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  value={formData.quantity_for_sale}
                  onChangeText={(value) =>
                    updateField("quantity_for_sale", value)
                  }
                  placeholder={t.digitalThela.enterQuantity || "Enter quantity"}
                  keyboardType="numeric"
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#9C27B0"
                />
              </View>

              {/* Cost per Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.costPerUnit || "Cost per Unit"} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  value={formData.cost}
                  onChangeText={(value) => updateField("cost", value)}
                  placeholder={t.digitalThela.enterCostPerUnit || "Enter cost per unit"}
                  keyboardType="numeric"
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#9C27B0"
                />
              </View>

              {/* Unit Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.selectUnit || "Unit"} *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.unit}
                    onValueChange={(value) => updateField("unit", value)}
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    <Picker.Item
                      label={t.digitalThela.chooseUnit || "Select a unit"}
                      value=""
                      enabled={false}
                      color="#888"
                    />
                    {CROP_UNITS.map((unit) => (
                      <Picker.Item
                        key={unit.id}
                        label={unit.label}
                        value={unit.id}
                        color="#333"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Photo Section */}
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.addPhotoVideo || "Photo / Video (optional)"}
                </Text>
                <Text style={styles.imageHelpText}>
                  {t.digitalThela.addPhotoVideoMessage ||
                    "Add a photo to help buyers see your produce"}
                </Text>

                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={async () => {
                      const granted = await requestPermissions();
                      if (granted) {
                        setIsCameraOpen(true);
                      } else {
                        Alert.alert(
                          t.common.required,
                          "Please grant camera access in your device settings."
                        );
                      }
                    }}
                  >
                    <Ionicons name="camera" size={24} color="#9C27B0" />
                    <Text style={styles.imageButtonText}>
                      {t.digitalThela.takePhoto || "Take Photo"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="images" size={24} color="#9C27B0" />
                    <Text style={styles.imageButtonText}>
                      {t.digitalThela.fromGallery || "From Gallery"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {photo && (
                  <View style={styles.imagePreview}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setPhoto(null)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color="#ff6b6b"
                      />
                    </TouchableOpacity>
                    <View style={styles.imageInfo}>
                      <Text style={styles.imageInfoText}>
                        {t.digitalThela.photoAttached?.replace(
                          "{{fileName}}",
                          photo.fileName || "Image selected"
                        ) || `Photo: ${photo.fileName || "selected"}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <LinearGradient
                  colors={["#9C27B0", "#7B1FA2"]}
                  style={styles.submitGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {t.digitalThela.submitProduce || "Submit Produce"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerInfo}>
                <Text style={styles.footerText}>
                  {t.digitalThela.requiredFields || "* Required fields"}
                </Text>
                <Text style={styles.footerText}>
                  {currentLocation
                    ? t.crops.locationDetected || "✓ Location detected"
                    : t.crops.locationRequired || "Location is required"}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AddProduce;
