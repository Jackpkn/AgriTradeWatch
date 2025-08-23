import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Image, Alert } from "react-native";
import { Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppState } from "react-native";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { TextInput } from "react-native-paper";
import img from "../assets/images/Group 2.png";
import { GlobalContext } from "../context/GlobalProvider";
import { getLocation } from "../components/getLocation";
// import api from "../components/GlobalApi";
import { Picker } from "@react-native-picker/picker";
// import { TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { addCrop } from "../components/cropsController";
import { auth } from "../firebase";
import * as ImageManipulator from "expo-image-manipulator";

const items = [
  { label: "Wheat", value: "wheat" },
  { label: "Onion", value: "onion" },
  { label: "Coriander", value: "coriander" },
  { label: "Lemon", value: "lemon" },
  { label: "Grapes", value: "grape" },
  { label: "Coriander", value: "coriander" },
  { label: "Tomato", value: "tomato" },
  { label: "Drumstick", value: "drumstick" },
  { label: "Garlic", value: "garlic" },
  // Add more crops as needed
];

const crops = () => {
  // Fetch location on mount and on app focus if needed
  useEffect(() => {
    const fetchAndSetLocation = async () => {
      try {
        const loc = await getLocation(
          (location) => {
            setCurrentLocation(location);
            console.log('Location updated:', location);
          },
          (error) => {
            console.error('Error fetching location:', error);
            // Alert.alert('Location Error', 'Could not fetch location.');
          },
          setCurrentLocation
        );
        // loc is returned, but context is updated in callback
      } catch (e) {
        console.error('Error fetching location:', e);
        // Alert.alert('Location Error', 'Could not fetch location.');
      }
    };
    fetchAndSetLocation();
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active' && locationRequestedRef.current) {
  await fetchAndSetLocation();
        locationRequestedRef.current = false;
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [setCurrentLocation]);
  const { jwt, mainUser, currentLocation, setIsLoading, setCurrentLocation } =
    useContext(GlobalContext);
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
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      console.log("ImagePicker result:", result); // Debug log
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto({ uri: result.assets[0].uri });
      } else if (result.canceled) {
        console.log("Image selection was canceled"); // Debug log
      } else {
        Alert.alert(
          "No images found",
          "No images available in your media library."
        );
      }
    } catch (error) {
      console.log("ImagePicker error:", error); // Debug log
      // Alert.alert("Error", "Could not pick image from gallery.");
    }
  }, [hasMediaLibraryPermission]);

  const handleCropSubmit = React.useCallback(async () => {
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
      Alert.alert("Enter correct price");
      return;
    }
    if (isNaN(Number(crop.quantity))) {
      Alert.alert("Enter correct quantity");
      return;
    }

    const path =
      mainUser.job.toLowerCase() === "farmer" ? "/farmers" : "/consumers";

    const uploadImageToFirebase = async (uri) => {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storage = getStorage();
        const storageRef = ref(storage, `images/${Date.now()}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      } catch (error) {
        console.error("Error while uploading image: ", error);
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
        return await uploadImageToFirebase(manipulatedImage.uri);
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

      await addCrop(cropData, mainUser.job, auth.currentUser.uid, imageUrl);

      setIsLoading(false);
      Alert.alert("Crop submitted successfully");
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
    <SafeAreaView style={{ backgroundColor: "#eafbe7", flex: 1 }}>
      {isCameraOpen ? (
        <View style={{ flex: 1, backgroundColor: "#eafbe7" }}>
          <CameraView
            style={{ flex: 1, borderRadius: 18, margin: 12 }}
            ref={(ref) => setCameraRef(ref)}
            useSystemSound={true}
          />
          <Button
            mode="contained"
            style={{
              position: "absolute",
              bottom: 32,
              alignSelf: "center",
              backgroundColor: "#1F4E3D",
              borderRadius: 12,
              paddingHorizontal: 32,
              elevation: 4,
            }}
            textColor="white"
            onPress={handleTakePicture}
          >
            Capture Photo
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 32,
          }}
        >
          <View style={{ width: "100%", alignItems: "center", marginTop: 24 }}>
            <Image
              source={img}
              style={{
                width: 190,
                height: 190,
                resizeMode: "contain",
                marginBottom: 8,
              }}
            />
          </View>
          <View
            style={{
              width: "97%",
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 18,
              shadowColor: "#49A760",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 26,
                marginTop: 8,
                fontWeight: "bold",
                color: "#1F4E3D",
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              Enter Crop Details
            </Text>
            <View
              style={{
                backgroundColor: "#eafbe7",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#49A760",
                paddingHorizontal: 8,
                marginBottom: 16,
                marginTop: 4,
                shadowColor: "#49A760",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Picker
                selectedValue={crop.name}
                style={{
                  height: "auto",
                  width: "100%",
                  color: "#1F4E3D",
                  fontSize: 16,
                  fontWeight: "bold",
                  backgroundColor: "#eafbe7",
                  borderRadius: 8,
                  paddingLeft: 8,
                }}
                dropdownIconColor="#1F4E3D"
                mode="dropdown"
                onValueChange={(itemValue) =>
                  setCrop({ ...crop, name: itemValue })
                }
              >
                <Picker.Item label="Select Crop" value="" color="#888" />
                {items.map((item, idx) => (
                  <Picker.Item
                    key={item.value}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </Picker>
            </View>
            <TextInput
              style={{
                marginBottom: 12,
                backgroundColor: "#eafbe7",
                borderRadius: 8,
                fontSize: 16,
                color: "#1F4E3D",
              }}
              mode="flat"
              label="Price Per Kg"
              value={crop.pricePerUnit.toString()}
              onChangeText={(text) => setCrop({ ...crop, pricePerUnit: text })}
              underlineColor="#49A760"
              activeUnderlineColor="#49A760"
              textColor="#1F4E3D"
            />
            <TextInput
              style={{
                marginBottom: 12,
                backgroundColor: "#eafbe7",
                borderRadius: 8,
                fontSize: 16,
                color: "#1F4E3D",
              }}
              mode="flat"
              label="Quantity sold (in kg)"
              value={crop.quantity.toString()}
              onChangeText={(text) => setCrop({ ...crop, quantity: text })}
              underlineColor="#49A760"
              activeUnderlineColor="#49A760"
              textColor="#1F4E3D"
            />
            <Button
              mode="contained"
              style={{
                marginTop: 12,
                marginBottom: 8,
                backgroundColor: "#49A760",
                width: "60%",
                alignSelf: "center",
                borderRadius: 12,
                elevation: 2,
              }}
              textColor="white"
              onPress={() => setIsCameraOpen(true)}
            >
              Open Camera
            </Button>
            <Button
              mode="contained"
              style={{
                marginBottom: 8,
                backgroundColor: "#49A760",
                width: "60%",
                alignSelf: "center",
                borderRadius: 12,
                elevation: 2,
              }}
              textColor="white"
              onPress={handlePickImageFromGallery}
            >
              Add from Gallery
            </Button>
            {photo && (
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Image
                  source={{ uri: photo.uri }}
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#49A760",
                  }}
                />
              </View>
            )}
            <Button
              mode="contained"
              style={{
                marginTop: 18,
                marginBottom: 4,
                backgroundColor: "#1F4E3D",
                width: "60%",
                alignSelf: "center",
                borderRadius: 12,
                elevation: 2,
              }}
              textColor="white"
              onPress={handleCropSubmit}
            >
              Submit
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default crops;
