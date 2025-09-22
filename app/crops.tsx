/**
 * Crops Screen (TypeScript)
 * Allows authenticated users to add new crop data. The image upload feature
 * is feature-flagged and currently hidden from the UI.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, ScrollView, Image, Alert, TouchableOpacity,
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

// ========================================================================
// Constants & Type Definitions
// ========================================================================

// --- FEATURE FLAGS ---
// Set to `true` to enable the crop submission form.
const ADD_CROP_ENABLED = true;
// Set to `true` to show the camera/gallery UI.
const ADD_IMAGE_ENABLED = false;

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
  base64?: string;
}

// Represents the exact data structure sent to the API
interface AddCropPayload {
  commodity: string;
  buyingprice: number;
  quantitybought: number;
  unit: string;
  latitude: number;
  longitude: number;
}

// ========================================================================
// Main Component
// ========================================================================

const CropsScreen = () => {
  const navigation = useNavigation();
  const { isLandscape, width } = useOrientation() as {
    isLandscape: boolean;
    width: number;
    height: number;
    screenData: { width: number; height: number };
    breakpoints: Record<string, boolean>;
  };
  const styles = useMemo(() => createCropsStyles(isLandscape, width), [isLandscape, width]);

  const { currentLocation, setIsLoading, isLogged } = useGlobal();

  const [form, setForm] = useState<CropFormState>({ name: "", pricePerUnit: "", quantity: "" });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraRef = React.useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && mediaStatus.status === 'granted');
    })();
  }, []);

  const handleTakePicture = useCallback(async () => {
    if (cameraRef.current) {
      const takenPhoto = await cameraRef.current.takePictureAsync({ quality: 1, base64: true });
      if (takenPhoto) {
        setPhoto(takenPhoto);
        setIsCameraOpen(false);
        await MediaLibrary.saveToLibraryAsync(takenPhoto.uri);
      }
    }
  }, []);

  const handlePickImage = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Please grant camera and media library access in your device settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto({ uri: result.assets[0].uri });
    }
  }, [hasPermission]);

  const handleCropSubmit = useCallback(async () => {
    if (!isLogged) {
      Alert.alert("Authentication Required", "Please login to add crop data.", [
        { text: "Login", onPress: () => navigation.navigate('Login' as never) },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    if (!form.name || !form.pricePerUnit || !form.quantity) {
      Alert.alert("Validation Error", "Please fill in all crop fields.");
      return;
    }
    if (!currentLocation) {
      Alert.alert("Location Required", "Please enable location services to submit data.", [
        { text: "Open Settings", onPress: () => Linking.openSettings() },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      // Create the payload with the exact structure required by the API
      const payload: AddCropPayload = {
        commodity: form.name,
        buyingprice: parseFloat(form.pricePerUnit),
        quantitybought: parseFloat(form.quantity),
        unit: "Kg", // As specified in the API documentation
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      await addCrop(payload);

      Alert.alert("Success", "Crop data submitted successfully!");
      setForm({ name: "", pricePerUnit: "", quantity: "" });
      setPhoto(null);
    } catch (error: any) {
      Alert.alert("Submission Error", error.message || "Failed to submit crop data.");
    } finally {
      setIsLoading(false);
    }
  }, [form, currentLocation, isLogged, setIsLoading]);

  // --- Render Logic ---

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture} />
          <TouchableOpacity style={styles.cameraCloseButton} onPress={() => setIsCameraOpen(false)} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <LinearGradient colors={["#49A760", "#3d8b4f"]} style={styles.headerGradient}>
              <Ionicons name="leaf" size={32} color="#fff" />
              <Text style={styles.headerTitle}>Add Crop Data</Text>
            </LinearGradient>
          </View>

          {ADD_CROP_ENABLED ? (
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Crop Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Crop Commodity</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={form.name} onValueChange={(itemValue) => setForm(f => ({ ...f, name: itemValue }))}>
                      <Picker.Item label="Choose a crop..." value="" color="#888" />
                      {CROP_ITEMS.map(item => <Picker.Item key={item.value} label={`${item.icon} ${item.label}`} value={item.value} />)}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price Per Kg (₹)</Text>
                  <TextInput style={styles.textInput} mode="outlined" value={form.pricePerUnit} onChangeText={text => setForm(f => ({ ...f, pricePerUnit: text }))} keyboardType="numeric" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity Bought (kg)</Text>
                  <TextInput style={styles.textInput} mode="outlined" value={form.quantity} onChangeText={text => setForm(f => ({ ...f, quantity: text }))} keyboardType="numeric" />
                </View>

                {ADD_IMAGE_ENABLED && (
                  <View style={styles.imageSection}>
                    <Text style={styles.inputLabel}>Add Photo (Optional)</Text>
                    <View style={styles.imageButtons}>
                      <TouchableOpacity style={styles.imageButton} onPress={() => setIsCameraOpen(true)}>
                        <Ionicons name="camera" size={24} color="#49A760" /><Text style={styles.imageButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                        <Ionicons name="images" size={24} color="#49A760" /><Text style={styles.imageButtonText}>From Gallery</Text>
                      </TouchableOpacity>
                    </View>
                    {photo && (
                      <View style={styles.imagePreview}>
                        <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={() => setPhoto(null)}>
                          <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={handleCropSubmit}>
                  <LinearGradient colors={["#49A760", "#3d8b4f"]} style={styles.submitGradient}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Crop Data</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct-outline" size={64} color="#49A760" />
              <Text style={styles.comingSoonTitle}>Feature Coming Soon!</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default CropsScreen;