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

const ADD_CROP_ENABLED = true;
// Set to `true` to show the camera/gallery UI.
const ADD_IMAGE_ENABLED = true;

const CROP_ITEMS = [
  { label: "Onion", value: "onion", icon: "🧅" },
  { label: "Tomato", value: "tomato", icon: "🍅" },
  { label: "Potato", value: "potato", icon: "🥔" },
  { label: "Drumstick", value: "drumstick", icon: "🥬" },
  { label: "Carrot", value: "carrot", icon: "🥕" },
  { label: "Ginger", value: "ginger", icon: "🫚" },
  { label: "Garlic", value: "garlic", icon: "🧄" },
  { label: "Green Chilli", value: "green chilli", icon: "🌶️" },
  { label: "Lemon", value: "lemon", icon: "🍋" },
  { label: "Banana", value: "banana", icon: "🍌" },
  // Add more crops as needed
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
        "Permission Required",
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
  }, [hasPermission, form.name]);

  const handleCropSubmit = useCallback(async () => {
    if (!isLogged) {
      Alert.alert("Authentication Required", "Please login to add crop data.", [
        { text: "Login", onPress: () => navigation.navigate("Login" as never) },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    if (!form.name || !form.pricePerUnit || !form.quantity) {
      Alert.alert("Validation Error", "Please fill in all crop fields.");
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        "Location Required",
        "Please enable location services to submit data.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    // Validate numeric inputs
    const price = parseFloat(form.pricePerUnit);
    const quantity = parseFloat(form.quantity);

    if (isNaN(price) || price <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price per unit.");
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Validation Error", "Please enter a valid quantity.");
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
        "Success",
        `Crop data submitted successfully!\n\nID: ${response.id}\nCommodity: ${response.commodity}\nPrice: ₹${response.buyingprice}/kg\nQuantity: ${response.quantitybought}kg`,
        [
          {
            text: "OK",
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
        "Submission Error",
        error.message ||
          "Failed to submit crop data. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [form, currentLocation, isLogged, setIsLoading, photo]);

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
              <Text style={styles.headerTitle}>Add Crop Data</Text>
            </LinearGradient>
          </View>

          {ADD_CROP_ENABLED ? (
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Crop Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Crop Commodity *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={form.name}
                      onValueChange={(itemValue) =>
                        setForm((f) => ({ ...f, name: itemValue }))
                      }
                      accessible={true}
                      accessibilityLabel="Select crop commodity"
                    >
                      <Picker.Item
                        label="Choose a crop..."
                        value=""
                        color="#888"
                      />
                      {CROP_ITEMS.map((item) => (
                        <Picker.Item
                          key={item.value}
                          label={`${item.icon} ${item.label}`}
                          value={item.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price Per Kg (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={form.pricePerUnit}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, pricePerUnit: text }))
                    }
                    keyboardType="numeric"
                    placeholder="Enter price per kg"
                    accessible={true}
                    accessibilityLabel="Price per kilogram"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity Bought (kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={form.quantity}
                    onChangeText={(text) =>
                      setForm((f) => ({ ...f, quantity: text }))
                    }
                    keyboardType="numeric"
                    placeholder="Enter quantity in kg"
                    accessible={true}
                    accessibilityLabel="Quantity bought in kilograms"
                  />
                </View>

                {ADD_IMAGE_ENABLED && (
                  <View style={styles.imageSection}>
                    <Text style={styles.inputLabel}>Add Photo (Optional)</Text>
                    <Text style={styles.imageHelpText}>
                      Adding a photo helps verify your crop data and improves
                      market transparency.
                    </Text>
                    <View style={styles.imageButtons}>
                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={() => setIsCameraOpen(true)}
                        accessible={true}
                        accessibilityLabel="Take photo with camera"
                      >
                        <Ionicons name="camera" size={24} color="#49A760" />
                        <Text style={styles.imageButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={handlePickImage}
                        accessible={true}
                        accessibilityLabel="Select photo from gallery"
                      >
                        <Ionicons name="images" size={24} color="#49A760" />
                        <Text style={styles.imageButtonText}>From Gallery</Text>
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
                            📎 {photo.fileName || "Image selected"}
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
                      Submit Crop Data
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>* Required fields</Text>
                  <Text style={styles.footerText}>
                    📍 Location:{" "}
                    {currentLocation ? "Detected" : "Required for submission"}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct-outline" size={64} color="#49A760" />
              <Text style={styles.comingSoonTitle}>Feature Coming Soon!</Text>
              <Text style={styles.comingSoonText}>
                We're working hard to bring you the ability to add and track
                your crop data.
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default CropsScreen;
