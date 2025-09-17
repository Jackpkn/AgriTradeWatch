
import React, { useContext, useState, useEffect, useRef, useMemo } from "react";
import { View, Text, ScrollView, Image, Alert, TouchableOpacity } from "react-native";
import { Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppState } from "react-native";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import img from "@/assets/images/Group 2.png";
import { GlobalContext } from "@/context/GlobalProvider";
import { getMandatoryLocation } from "@/components/getLocation";
import { Picker } from "@react-native-picker/picker";
import { Button } from "react-native-paper";
import { addCrop } from "@/components/cropsController";
import * as ImageManipulator from "expo-image-manipulator";
import { router } from "expo-router";
import { useOrientation } from "@/utils/orientationUtils";
import { createCropsStyles } from "@/utils/responsiveStyles";

const items = [

  { label: "Onion", value: "onion", icon: "🧅" },
  { label: "Tomato", value: "tomato", icon: "🍅" },
  { label: "Potato", value: "potato", icon: "🥔" },
  { label: "Drumstick", value: "drumstick", icon: "🥬" },
  { label: "Carrot", value: "carrot", icon: "🥕" },
  { label: "Ginger", value: "ginger", icon: "🫚" },
  { label: "Garlic", value: "garlic", icon: "🧄" },
  { label: "Green Chilli", value: "green chilli", icon: "🌶️" },
  { label: "Lemon", value: "lemon", icon: "🍋" },
  { label: "Chana Dal", value: "chana dal", icon: "🥜" },
  { label: "Tur Dal", value: "tur dal", icon: "🥜" },
  { label: "Moong Dal", value: "moong dal", icon: "🥜" },
  { label: "Banana", value: "banana", icon: "🍌" },
  { label: "Guava", value: "guava", icon: "🍇" },
  { label: "Pomegrante", value: "pomegrante", icon: "🍎" },
  // Add more crops as needed
];

const crops = () => {
  // Use orientation hook
  const { screenData, isLandscape, width, breakpoints } = useOrientation();

  // Create responsive styles
  const styles = useMemo(() => createCropsStyles(isLandscape, width), [isLandscape, width]);

  // Fetch location on mount and on app focus if needed
  useEffect(() => {
    const fetchAndSetLocation = async () => {
      try {
        const loc = await getMandatoryLocation(
          (location) => {
            setCurrentLocation(location);
          },
          (error) => {
            // The mandatory location function will handle alerts and app exit
          },
          setCurrentLocation
        );
        // loc is returned, but context is updated in callback
      } catch (e) {
        // Alert.alert('Location Error', 'Could not fetch location.');
      }
    };
    fetchAndSetLocation();
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "active" && locationRequestedRef.current) {
        await fetchAndSetLocation();
        locationRequestedRef.current = false;
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [setCurrentLocation]);
  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useContext(GlobalContext);
  } catch (error) {
    console.error("Error accessing GlobalContext in crops:", error);
    contextValue = {};
  }

  const {
    jwt = "",
    mainUser = {},
    currentLocation = null,
    setIsLoading = () => { },
    setCurrentLocation = () => { },
    canAddData = false,
    requireAuthentication = () => { },
    isAuthenticated = false,
    isLogged = false
  } = contextValue || {};
  const locationRequestedRef = useRef(false);

  const [crop, setCrop] = useState({
    name: "",
    location: {},
    pricePerUnit: "",
    quantity: "",
  });

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] =
    useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  //grant persmission
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");

      const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(mediaLibraryStatus.status === "granted");
    })();
  }, []);

  const handleTakePicture = React.useCallback(async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync({
        quality: 1,
        base64: true,
      });
      setPhoto(photo);
      setIsCameraOpen(false);
      if (hasMediaLibraryPermission) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
    }
  }, [cameraRef, hasMediaLibraryPermission]);

  const handlePickImageFromGallery = React.useCallback(async () => {
    try {
      if (!hasMediaLibraryPermission) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your media library to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });
      // Image picker result received
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto({ uri: result.assets[0].uri });
      } else if (result.canceled) {
        // Image selection was canceled
      } else {
        Alert.alert(
          "No images found",
          "No images available in your media library."
        );
      }
    } catch (error) {
      // Image picker error occurred
      // Alert.alert("Error", "Could not pick image from gallery.");
    }
  }, [hasMediaLibraryPermission]);

  const handleCropSubmit = React.useCallback(async () => {
    // Check authentication first - Login is now mandatory (guest features disabled)
    if (!canAddData) {
      Alert.alert(
        "Authentication Required",
        "You must be logged in to add crops. Please login to continue.",
        [
          {
            text: "Login",
            onPress: () => {
              // Navigate to login screen
              router.push("/(auth)/login");
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
      return;
    }

    if (!crop.name || !crop.pricePerUnit || !crop.quantity) {
      Alert.alert("Please fill in all the fields");
      return;
    }

    if (!currentLocation || Object.keys(currentLocation).length === 0) {
      Alert.alert(
        "Location Required",
        "Please enable location services to submit crop data.",
        [
          {
            text: "Enable Location",
            onPress: () => {
              if (Platform.OS === "android") {
                try {
                  Linking.openSettings();
                  locationRequestedRef.current = true;
                } catch (e) {
                  Alert.alert("Error", "Unable to open location settings.");
                }
              } else if (Platform.OS === "ios") {
                try {
                  Linking.openURL("App-Prefs:root=Privacy&path=LOCATION");
                  locationRequestedRef.current = true;
                } catch (e) {
                  Alert.alert("Error", "Unable to open location settings.");
                }
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    // Listen for app focus to re-fetch location if user returned from settings
    // (No need for duplicate AppState handler here, handled in top-level effect)

    if (isNaN(Number(crop.pricePerUnit))) {
      t;
      Alert.alert("Enter correct price");
      return;
    }
    if (isNaN(Number(crop.quantity))) {
      Alert.alert("Enter correct quantity");
      return;
    }

    const path =
      mainUser.job.toLowerCase() === "farmer" ? "/farmers" : "/consumers";

    const handleImageUpload = async (uri) => {
      try {
        // For now, return the local URI
        // In production, this would upload to your API server
        return uri;
      } catch (error) {
        console.error("Error while handling image: ", error);
        return "";
      }
    };

    const compressImage = async (uri) => {
      if (!uri) return "";
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return await handleImageUpload(manipulatedImage.uri);
      } catch (error) {
        console.error("Error while compressing image: ", error);
        return "";
      }
    };

    try {
      setIsLoading(true);
      let imageUrl = "";
      if (photo) {
        imageUrl = await compressImage(photo.uri);
      }
      const cropData = {
        ...crop,
        location: currentLocation,
        imageUrl,
      };

      try {
        await addCrop(cropData, mainUser.job, mainUser.id, imageUrl);
        setIsLoading(false);
        Alert.alert("Success", "Crop submitted successfully!");

        // Reset form after successful submission
        setCrop({
          name: "",
          location: {},
          pricePerUnit: "",
          quantity: "",
        });
        setPhoto(null);
      } catch (error) {
        console.error("Error submitting crop:", error);
        setIsLoading(false);

        let errorMessage = "Failed to submit crop. Please try again.";
        if (error.code === 'permission-denied') {
          errorMessage = "You don't have permission to add crops. Please login again.";
        } else if (error.code === 'unavailable') {
          errorMessage = "Service temporarily unavailable. Please try again later.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert("Error", errorMessage);
      }
      setCrop((prev) => {
        if (
          prev.name === "" &&
          prev.pricePerUnit === "" &&
          prev.quantity === ""
        )
          return prev;
        return {
          name: "",
          location: {},
          pricePerUnit: "",
          quantity: "",
        };
      });
      setPhoto(null);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error uploading image", error?.message || "Unknown error");
    }
  }, [crop, currentLocation, mainUser, photo, setIsLoading]);
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
        {isCameraOpen ? (
          <View style={styles.cameraContainer}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setIsCameraOpen(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Capture Crop Photo</Text>
            </View>
            <CameraView
              style={styles.camera}
              ref={(ref) => setCameraRef(ref)}
              useSystemSound={true}
            />
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePicture}
              >
                <Ionicons name="camera" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <Ionicons name="leaf" size={32} color="#fff" />
                  <Text style={styles.headerTitle}>Add Crop Data</Text>
                  <Text style={styles.headerSubtitle}>
                    Share your crop prices to help the farming community
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Crop Information</Text>

                {/* Crop Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Crop Commodity</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={crop.name}
                      style={styles.picker}
                      dropdownIconColor="#49A760"
                      mode="dropdown"
                      onValueChange={(itemValue) =>
                        setCrop({ ...crop, name: itemValue })
                      }
                    >
                      <Picker.Item label="Choose a crop..." value="" color="#888" />
                      {items.map((item) => (
                        <Picker.Item
                          key={item.value}
                          label={`${item.icon} ${item.label}`}
                          value={item.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Price Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price Per Kg (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    placeholder="Enter price per kg"
                    value={crop.pricePerUnit.toString()}
                    onChangeText={(text) => setCrop({ ...crop, pricePerUnit: text })}
                    keyboardType="numeric"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#49A760"
                    textColor="#1F4E3D"
                  />
                </View>

                {/* Quantity Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity Sold (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    placeholder="Enter quantity sold"
                    value={crop.quantity.toString()}
                    onChangeText={(text) => setCrop({ ...crop, quantity: text })}
                    keyboardType="numeric"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#49A760"
                    textColor="#1F4E3D"
                  />
                </View>

                {/* Image Upload Section */}
                <View style={styles.imageSection}>
                  <Text style={styles.inputLabel}>Add Crop Photo (Optional)</Text>
                  <Text style={styles.imageSubtext}>
                    Help others identify the quality of your crop
                  </Text>

                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => setIsCameraOpen(true)}
                    >
                      <Ionicons name="camera" size={24} color="#49A760" />
                      <Text style={styles.imageButtonText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handlePickImageFromGallery}
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
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setPhoto(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCropSubmit}
                >
                  <LinearGradient
                    colors={["#49A760", "#3d8b4f"]}
                    style={styles.submitGradient}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Crop Data</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default crops;