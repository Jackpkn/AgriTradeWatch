import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Linking,
  BackHandler,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useGlobal } from "@/context/global-provider";
import { addCrop } from "@/components/cropsController";
import { useOrientation } from "@/utils/orientationUtils";
import { createCropsStyles } from "@/utils/responsiveStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useCommodities } from "@/hooks/useCommodities";

const ADD_CROP_ENABLED = true;
// Set to `true` to show the camera/gallery UI.
const ADD_IMAGE_ENABLED = true;

// Represents the state of the form in the UI
interface CropFormState {
  name: string;
  pricePerUnit: string;
  quantity: string;
  unit: string;
  reportingAs: "buyer" | "seller";
}

// Reporting role options for the dropdown
const REPORTING_OPTIONS = [
  { value: "seller", labelKey: "reportingAsSeller", label: "Seller" },
  { value: "buyer", labelKey: "reportingAsBuyer", label: "Buyer" },
];

// Unit options for the dropdown
const UNIT_OPTIONS = [
  { value: "Kg", label: "Kg", labelKey: "unitKg" },
  { value: "Quintal", label: "Quintal", labelKey: "unitQuintal" },
  { value: "Ton", label: "Ton", labelKey: "unitTon" },
  { value: "piece", label: "Piece", labelKey: "unitPiece" },
  { value: "dozen", label: "Dozen", labelKey: "unitDozen" },
  { value: "bundle", label: "Bundle", labelKey: "unitBundle" },
];

// Represents the shape of a selected photo
interface PhotoState {
  uri: string;
  base64: string;
  fileName?: string;
  type?: string;
}

// Represents the exact data structure sent to the API
interface AddCropPayload {
  commodity: string;
  quantity: number;
  price: number;
  latitude: number;
  longitude: number;
  date?: string;
  variety?: string;
  unit?: string;
  reportingAs: "buyer" | "seller";
}

// Helper function to generate filename for images
// In your component
const generateImageFileName = (commodity: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `crop_${commodity}_${timestamp}.jpg`;
};

// Helper function to get MIME type from file extension
const getMimeType = (uri: string): string => {
  const extension = uri.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg"; // Default to JPEG
  }
};

// ========================================================================
// Main Component
// ========================================================================

const CropsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isLandscape, width } = useOrientation() as unknown as {
    isLandscape: boolean;
    width: number;
    height: number;
    screenData: { width: number; height: number };
    breakpoints: Record<string, boolean>;
  };
  const styles = useMemo(
    () => createCropsStyles(isLandscape, width),
    [isLandscape, width]
  );

  const { currentLocation, setIsLoading, isLogged, userRole } = useGlobal();
  const { commodities: cropItems, loading: commoditiesLoading } = useCommodities();

  // Debug: Log the userRole to check its value
  useEffect(() => {
    console.log("Current userRole:", userRole, "Type:", typeof userRole);
  }, [userRole]);

  // Determine default reporting role based on user's job
  const defaultReportingAs = String(userRole).toLowerCase() === 'farmer' ? 'seller' : 'buyer';

  const [form, setForm] = useState<CropFormState>({
    name: "",
    pricePerUnit: "",
    quantity: "",
    unit: "Kg",
    reportingAs: defaultReportingAs as "buyer" | "seller",
  });

  // Update reportingAs when userRole changes (e.g., on login)
  useEffect(() => {
    const newDefault = String(userRole).toLowerCase() === 'farmer' ? 'seller' : 'buyer';
    setForm(f => ({ ...f, reportingAs: newDefault as "buyer" | "seller" }));
  }, [userRole]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    commodity: string;
    price: string;
    quantity: string;
    unit: string;
    reportingAs: "buyer" | "seller";
  } | null>(null);
  const cameraRef = React.useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(
        cameraStatus.status === "granted" && mediaStatus.status === "granted"
      );
    })();
  }, []);

  // Refresh screen state when coming into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Crops screen focused - ready for submission");
      // Screen is now in focus and ready for input
    }, [])
  );

  const handleTakePicture = useCallback(async () => {
    if (cameraRef.current) {
      const takenPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.7, // Slightly lower quality for smaller base64
        base64: true, // IMPORTANT: Enable base64 capture
        exif: false, // Disable EXIF to reduce size
      });

      if (takenPhoto) {
        const fileName = generateImageFileName(form.name || "unknown");
        const mimeType = getMimeType(takenPhoto.uri);

        setPhoto({
          uri: takenPhoto.uri,
          base64: takenPhoto.base64 ?? "", // Store base64 data, fallback to empty string
          fileName,
          type: mimeType,
        });
        setIsCameraOpen(false);

        // Save to media library
        try {
          await MediaLibrary.saveToLibraryAsync(takenPhoto.uri);
        } catch (error) {
          console.warn("Failed to save image to library:", error);
        }
      }
    }
  }, [form.name]);

  const handlePickImage = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(
        t.common.required,
        "Please grant camera and media library access in your device settings."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Reduce quality for better performance
      aspect: [1, 1], // Square aspect ratio
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName =
        asset.fileName || generateImageFileName(form.name || "unknown");
      const mimeType = asset.mimeType || getMimeType(asset.uri);

      setPhoto({
        uri: asset.uri,
        base64: "", // No base64 from gallery picker
        fileName,
        type: mimeType,
      });
    }
  }, [hasPermission, form.name, t]);

  const handleCropSubmit = useCallback(async () => {
    if (!isLogged) {
      Alert.alert(t.auth.authRequired, t.auth.authRequiredMessage, [
        { text: t.auth.login, onPress: () => navigation.navigate("Login" as never) },
        { text: t.common.cancel, style: "cancel" },
      ]);
      return;
    }

    // Only allow farmer and consumer user types to add crops
    if (userRole !== 'farmer' && userRole !== 'consumer') {
      Alert.alert(
        t.common.error || "Error",
        t.crops.onlyFarmerConsumerCanAdd || "Only farmers and consumers can add crop data.",
        [{ text: t.common.ok || "OK" }]
      );
      return;
    }

    if (!form.name || !form.pricePerUnit || !form.quantity) {
      Alert.alert(t.auth.validationError, t.crops.fillAllFields);
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        t.auth.locationRequired,
        t.crops.locationRequiredMessage,
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: t.common.cancel, style: "cancel" },
        ]
      );
      return;
    }

    // Validate numeric inputs
    const price = parseFloat(form.pricePerUnit);
    const quantity = parseFloat(form.quantity);

    if (isNaN(price) || price <= 0) {
      Alert.alert(t.auth.validationError, t.crops.validPrice);
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(t.auth.validationError, t.crops.validQuantity);
      return;
    }

    setIsLoading(true);
    try {
      // Create the payload with the exact structure required by the API
      // reportingAs determines which fields to send:
      // - "seller" -> sellingprice, quantitysold (saves to farmers table)
      // - "buyer" -> buyingprice, quantitybought (saves to consumers table)
      const payload: AddCropPayload = {
        commodity: form.name,
        quantity: quantity,
        price: price,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
        unit: form.unit,
        reportingAs: form.reportingAs,
      };

      const response = await addCrop(payload);

      console.log("DEBUG FORM STATE:", form);

      // Get the crop icon for the selected commodity
      const selectedCrop = cropItems.find(item => item.value === form.name);

      // Show beautified success modal
      setSuccessData({
        commodity: selectedCrop
          ? `${selectedCrop.icon} ${selectedCrop.labelKey && t.crops[selectedCrop.labelKey as keyof typeof t.crops] ? t.crops[selectedCrop.labelKey as keyof typeof t.crops] : selectedCrop.label}`
          : response.commodity,
        price: form.pricePerUnit,
        quantity: form.quantity,
        unit: form.unit,
        reportingAs: form.reportingAs,
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Crop submission error:", error);
      Alert.alert(
        t.crops.submissionError,
        error.message ||
        "Failed to submit crop data. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [form, currentLocation, isLogged, userRole, setIsLoading, photo, t, navigation, cropItems]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessData(null);
    // Reset form but keep the default reportingAs based on user's job
    const newDefault = String(userRole).toLowerCase() === 'farmer' ? 'seller' : 'buyer';
    setForm({ name: "", pricePerUnit: "", quantity: "", unit: "Kg", reportingAs: newDefault as "buyer" | "seller" });
    setPhoto(null);
  }, [userRole]);

  // --- Render Logic ---

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
          ratio="16:9"
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
              colors={["#49A760", "#3d8b4f"]}
              style={styles.headerGradient}
            >
              <Ionicons name="leaf" size={32} color="#fff" />
              <Text style={styles.headerTitle}>{t.crops.header}</Text>
            </LinearGradient>
          </View>

          {ADD_CROP_ENABLED ? (
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{t.crops.cropInformation}</Text>

                {/* Reporting As Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.crops.reportingAs || 'Reporting as *'}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={form.reportingAs}
                      onValueChange={(itemValue) =>
                        setForm((f) => ({ ...f, reportingAs: itemValue as "buyer" | "seller" }))
                      }
                      style={styles.picker}
                      dropdownIconColor="#000000"
                      mode="dropdown"
                      accessible={true}
                      accessibilityLabel="Select reporting role"
                    >
                      {REPORTING_OPTIONS.map((item) => (
                        <Picker.Item
                          key={item.value}
                          label={t.crops[item.labelKey as keyof typeof t.crops] || item.label}
                          value={item.value}
                          color="#000"
                          style={{ backgroundColor: "#fff" }}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.crops.selectCropCommodity}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={form.name}
                      onValueChange={(itemValue) =>
                        setForm((f) => ({ ...f, name: itemValue }))
                      }
                      style={styles.picker}
                      dropdownIconColor="#000000"
                      mode="dropdown"
                      accessible={true}
                      accessibilityLabel="Select crop commodity"
                    >
                      <Picker.Item
                        label={t.crops.chooseCrop}
                        value=""
                        enabled={false}
                        color="#666"
                        style={{ backgroundColor: "#fff" }}
                      />
                      {cropItems.map((item) => (
                        <Picker.Item
                          key={item.value}
                          label={`${item.icon} ${item.labelKey && t.crops[item.labelKey as keyof typeof t.crops] ? t.crops[item.labelKey as keyof typeof t.crops] : item.label}`}
                          value={item.value}
                          color="#000"
                          style={{ backgroundColor: "#fff" }}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {form.reportingAs === 'seller'
                      ? (t.crops.sellingPricePerKg || 'Selling Price Per Kg *')
                      : (t.crops.buyingPricePerKg || 'Buying Price Per Kg *')}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={form.pricePerUnit}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, pricePerUnit: text }))
                    }
                    keyboardType="numeric"
                    placeholder={
                      form.reportingAs === 'seller'
                        ? (t.crops.enterSellingPrice || 'Enter selling price')
                        : (t.crops.enterBuyingPrice || 'Enter buying price')
                    }
                    accessible={true}
                    accessibilityLabel={
                      form.reportingAs === 'seller'
                        ? 'Selling price per kilogram'
                        : 'Buying price per kilogram'
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {form.reportingAs === 'seller'
                      ? (t.crops.quantitySold || 'Quantity Sold *')
                      : (t.crops.quantityBought || 'Quantity Bought *')}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={form.quantity}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, quantity: text }))
                    }
                    keyboardType="numeric"
                    placeholder={
                      form.reportingAs === 'seller'
                        ? (t.crops.enterQuantitySold || 'Enter quantity sold')
                        : (t.crops.enterQuantityBought || 'Enter quantity bought')
                    }
                    accessible={true}
                    accessibilityLabel={
                      form.reportingAs === 'seller'
                        ? 'Quantity sold'
                        : 'Quantity bought'
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.crops.selectUnit || 'Select Unit *'}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={form.unit}
                      onValueChange={(itemValue) =>
                        setForm((f) => ({ ...f, unit: itemValue }))
                      }
                      style={styles.picker}
                      dropdownIconColor="#000000"
                      mode="dropdown"
                      accessible={true}
                      accessibilityLabel="Select unit"
                    >
                      {UNIT_OPTIONS.map((item) => (
                        <Picker.Item
                          key={item.value}
                          label={t.crops[item.labelKey as keyof typeof t.crops] || item.label}
                          value={item.value}
                          color="#000"
                          style={{ backgroundColor: "#fff" }}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {ADD_IMAGE_ENABLED && (
                  <View style={styles.imageSection}>
                    <Text style={styles.inputLabel}>{t.crops.addPhoto}</Text>
                    <Text style={styles.imageHelpText}>
                      {t.crops.addPhotoMessage}
                    </Text>
                    <View style={styles.imageButtons}>
                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={() => setIsCameraOpen(true)}
                        accessible={true}
                        accessibilityLabel="Take photo with camera"
                      >
                        <Ionicons name="camera" size={24} color="#49A760" />
                        <Text style={styles.imageButtonText}>{t.crops.takePhoto}</Text>
                      </TouchableOpacity>
                    </View>
                    {photo && (
                      <View style={styles.imagePreview}>
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.previewImage}
                          accessible={true}
                          accessibilityLabel="Selected crop image preview"
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => setPhoto(null)}
                          accessible={true}
                          accessibilityLabel="Remove selected image"
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#ff6b6b"
                          />
                        </TouchableOpacity>
                        <View style={styles.imageInfo}>
                          <Text style={styles.imageInfoText}>
                            {t.crops.photoAttached.replace('{{fileName}}', photo.fileName || "Image selected")}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCropSubmit}
                  accessible={true}
                  accessibilityLabel="Submit crop data"
                >
                  <LinearGradient
                    colors={["#49A760", "#3d8b4f"]}
                    style={styles.submitGradient}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      {t.crops.submitCropData}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>{t.crops.requiredFields}</Text>
                  <Text style={styles.footerText}>
                    {currentLocation ? t.crops.locationDetected : t.crops.locationRequired}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct-outline" size={64} color="#49A760" />
              <Text style={styles.comingSoonTitle}>{t.crops.featureComingSoon}</Text>
              <Text style={styles.comingSoonText}>
                {t.crops.workingHardMessage}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={successModalStyles.overlay}>
          <View style={successModalStyles.modalContainer}>
            <LinearGradient
              colors={["#49A760", "#3d8b4f"]}
              style={successModalStyles.header}
            >
              <View style={successModalStyles.iconCircle}>
                <Ionicons name="checkmark" size={40} color="#49A760" />
              </View>
            </LinearGradient>

            <View style={successModalStyles.content}>
              <Text style={successModalStyles.title}>{t.common.success}!</Text>
              <Text style={successModalStyles.subtitle}>
                {t.crops.cropDataSubmitted || "Your crop data has been submitted successfully"}
              </Text>

              {successData && (
                <View style={successModalStyles.detailsCard}>
                  <View style={successModalStyles.detailRow}>
                    <View style={successModalStyles.detailIcon}>
                      <Ionicons name="leaf" size={20} color="#49A760" />
                    </View>
                    <View style={successModalStyles.detailContent}>
                      <Text style={successModalStyles.detailLabel}>{t.crops.selectCropCommodity?.replace("*", "") || "Commodity"}</Text>
                      <Text style={successModalStyles.detailValue}>{successData.commodity}</Text>
                    </View>
                  </View>

                  <View style={successModalStyles.divider} />

                  <View style={successModalStyles.detailRow}>
                    <View style={successModalStyles.detailIcon}>
                      <Ionicons name="pricetag" size={20} color="#49A760" />
                    </View>
                    <View style={successModalStyles.detailContent}>
                      <Text style={successModalStyles.detailLabel}>
                        {successData.reportingAs === 'seller'
                          ? (t.crops.sellingPricePerKg?.replace("*", "") || "Selling Price")
                          : (t.crops.buyingPricePerKg?.replace("*", "") || "Buying Price")}
                      </Text>
                      <Text style={successModalStyles.detailValue}>₹{successData.price}/{successData.unit}</Text>
                    </View>
                  </View>

                  <View style={successModalStyles.divider} />

                  <View style={successModalStyles.detailRow}>
                    <View style={successModalStyles.detailIcon}>
                      <Ionicons name="cube" size={20} color="#49A760" />
                    </View>
                    <View style={successModalStyles.detailContent}>
                      <Text style={successModalStyles.detailLabel}>
                        {successData.reportingAs === 'seller'
                          ? (t.crops.quantitySold?.replace("*", "") || "Quantity Sold")
                          : (t.crops.quantityBought?.replace("*", "") || "Quantity Bought")}
                      </Text>
                      <Text style={successModalStyles.detailValue}>{successData.quantity} {successData.unit}</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={successModalStyles.button}
                onPress={handleSuccessModalClose}
              >
                <LinearGradient
                  colors={["#49A760", "#3d8b4f"]}
                  style={successModalStyles.buttonGradient}
                >
                  <Text style={successModalStyles.buttonText}>{t.common.ok}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Success Modal Styles
const successModalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%" as const,
    maxWidth: 340,
    overflow: "hidden" as const,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    paddingVertical: 30,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  content: {
    padding: 24,
    alignItems: "center" as const,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center" as const,
    marginBottom: 20,
  },
  detailsCard: {
    width: "100%" as const,
    backgroundColor: "#f8fffe",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0f2e9",
  },
  detailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0f2e9",
    marginVertical: 4,
  },
  button: {
    width: "100%" as const,
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold" as const,
  },
};

export default CropsScreen;
