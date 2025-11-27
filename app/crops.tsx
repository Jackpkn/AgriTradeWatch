import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Linking,
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
import { addCrop } from "@/components/cropsController";
import { useOrientation } from "@/utils/orientationUtils";
import { createCropsStyles } from "@/utils/responsiveStyles";
import { useTranslation } from "@/hooks/useTranslation";

const ADD_CROP_ENABLED = true;
// Set to `true` to show the camera/gallery UI.
const ADD_IMAGE_ENABLED = true;

// Crop items will be generated dynamically using translations
const getCropItems = (t: any) => [
  // Vegetables
  { labelKey: "cropAmbatChukka", value: "ambat chukka", icon: "🥬" },
  { labelKey: "cropGinger", value: "ginger", icon: "🫚" },
  { labelKey: "cropOnion", value: "onion", icon: "🧅" },
  { labelKey: "cropCucumber", value: "cucumber", icon: "🥒" },
  { labelKey: "cropBitterGourd", value: "bitter gourd", icon: "🥒" },
  { labelKey: "cropCorianderLeaves", value: "coriander leaves", icon: "🌿" },
  { labelKey: "cropCabbage", value: "cabbage", icon: "🥬" },
  { labelKey: "cropClusterBeans", value: "cluster beans", icon: "🫘" },
  { labelKey: "cropCarrot", value: "carrot", icon: "🥕" },
  { labelKey: "cropCowpea", value: "cowpea", icon: "🫘" },
  { labelKey: "cropTomato", value: "tomato", icon: "🍅" },
  { labelKey: "cropCapsicum", value: "capsicum", icon: "🫑" },
  { labelKey: "cropBottleGourd", value: "bottle gourd", icon: "🥒" },
  { labelKey: "cropRidgeGourd", value: "ridge gourd", icon: "🥒" },
  { labelKey: "cropSpinach", value: "spinach", icon: "🥬" },
  { labelKey: "cropCauliflower", value: "cauliflower", icon: "🥦" },
  { labelKey: "cropPotato", value: "potato", icon: "🥔" },
  { labelKey: "cropBeetroot", value: "beetroot", icon: "🥕" },
  { labelKey: "cropLadiesFinger", value: "ladies finger", icon: "🌱" },
  { labelKey: "cropPumpkin", value: "pumpkin", icon: "🎃" },
  { labelKey: "cropRadish", value: "radish", icon: "🥕" },
  { labelKey: "cropFenugreekLeaves", value: "fenugreek leaves", icon: "🌿" },
  { labelKey: "cropGarlic", value: "garlic", icon: "🧄" },
  { labelKey: "cropLemon", value: "lemon", icon: "🍋" },
  { labelKey: "cropBrinjal", value: "brinjal", icon: "🍆" },
  { labelKey: "cropDrumstick", value: "drumstick", icon: "🥬" },
  { labelKey: "cropGreenChilli", value: "green chilli", icon: "🌶️" },

  // Fruits
  { labelKey: "cropPomegranate", value: "pomegranate", icon: "🍎" },
  { labelKey: "cropCustardApple", value: "custard apple", icon: "🍏" },
  { labelKey: "cropDragonFruit", value: "dragon fruit", icon: "🐉" },
  { labelKey: "cropGrapes", value: "grapes", icon: "🍇" },
  { labelKey: "cropGuava", value: "guava", icon: "🍐" },
  { labelKey: "cropOrange", value: "orange", icon: "🍊" },
  { labelKey: "cropPapaya", value: "papaya", icon: "🥭" },
  { labelKey: "cropSapota", value: "sapota", icon: "🥔" },
  { labelKey: "cropBanana", value: "banana", icon: "🍌" },
];

// Represents the state of the form in the UI
interface CropFormState {
  name: string;
  pricePerUnit: string;
  quantity: string;
}

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
  buyingprice: number;
  quantitybought: number;
  unit: string;
  latitude: number;
  longitude: number;
  date?: string;
  image?: {
    uri: string;
    name: string;
    type: string;
  };
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

  const { currentLocation, setIsLoading, isLogged } = useGlobal();
  const cropItems = useMemo(() => getCropItems(t), [t]);

  const [form, setForm] = useState<CropFormState>({
    name: "",
    pricePerUnit: "",
    quantity: "",
  });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
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
      const payload: AddCropPayload = {
        commodity: form.name,
        buyingprice: price,
        quantitybought: quantity,
        unit: "Kg", // As specified in the API documentation
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        // Add current date in the format expected by the API
        date: new Date().toISOString(),
      };

      // Add image if available
      if (photo) {
        console.log("📸 Photo available, adding to payload:", {
          uri: photo.uri,
          name: photo.fileName,
          type: photo.type,
        });

        payload.image = {
          uri: photo.uri,
          name: photo.fileName || generateImageFileName(form.name),
          type: photo.type || "image/jpeg",
        };
      } else {
        console.log("📸 No photo selected, submitting without image");
      }

      const response = await addCrop(payload);

      Alert.alert(
        t.common.success,
        `${t.crops.submissionSuccess.replace('{{id}}', response.id)}\n\nID: ${response.id}\nCommodity: ${response.commodity}\nPrice: ₹${response.buyingprice}/kg\nQuantity: ${response.quantitybought}kg`,
        [
          {
            text: t.common.ok,
            onPress: () => {
              // Reset form after successful submission
              setForm({ name: "", pricePerUnit: "", quantity: "" });
              setPhoto(null);
            },
          },
        ]
      );
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
  }, [form, currentLocation, isLogged, setIsLoading, photo, t, navigation]);

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

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.crops.selectCropCommodity}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={form.name}
                      onValueChange={(itemValue) =>
                        setForm((f) => ({ ...f, name: itemValue }))
                      }
                      style={styles.picker}
                      dropdownIconColor="#49A760"
                      mode="dropdown"
                      accessible={true}
                      accessibilityLabel="Select crop commodity"
                    >
                      <Picker.Item
                        label={t.crops.chooseCrop}
                        value=""
                        color="#888"
                        enabled={false}
                      />
                      {cropItems.map((item) => (
                        <Picker.Item
                          key={item.value}
                          label={`${item.icon} ${t.crops[item.labelKey as keyof typeof t.crops]}`}
                          value={item.value}
                          color="#1a1a1a"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.crops.pricePerKg}</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={form.pricePerUnit}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, pricePerUnit: text }))
                    }
                    keyboardType="numeric"
                    placeholder={t.crops.enterPricePerKg}
                    accessible={true}
                    accessibilityLabel="Price per kilogram"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.crops.quantityBought}</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={form.quantity}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, quantity: text }))
                    }
                    keyboardType="numeric"
                    placeholder={t.crops.enterQuantity}
                    accessible={true}
                    accessibilityLabel="Quantity bought in kilograms"
                  />
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
    </SafeAreaView>
  );
};

export default CropsScreen;
