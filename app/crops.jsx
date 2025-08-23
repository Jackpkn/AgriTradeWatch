import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import React, { useContext, useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { TextInput } from "react-native-paper";
import img from "../assets/images/Group 2.png";
import { GlobalContext } from "../context/GlobalProvider";
// import api from "../components/GlobalApi";
import { Picker } from "@react-native-picker/picker";
// import { TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { addCrop } from "../components/cropsController";
import { auth } from "../firebase";
import * as ImageManipulator from "expo-image-manipulator";

const crops = () => {
  const { jwt, mainUser, currentLocation, setIsLoading } =
    useContext(GlobalContext);

  const [crop, setCrop] = useState({
    name: "",
    location: {},
    pricePerUnit: "",
    quantity: "",
  });

  const [items, setItems] = useState([
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
  ]);

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

  const handleTakePicture = async () => {
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
  };

  const handleCropSubmit = async () => {
    if (!crop.name || !crop.pricePerUnit || !crop.quantity) {
      Alert.alert("Please fill in all the fields");
      return;
    }

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
      }
    };

    const compressImage = async (uri) => {

      if (!uri) {
        return " ";
      }

      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }], // Resize the image to a width of 800 pixels
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compress and save as JPEG
        );


        const imageUrl =  await uploadImageToFirebase(manipulatedImage.uri) 

        return imageUrl;
      } catch (error) {
        console.error("Error while compressing image: ", error);
      }
    };

    try {
      setIsLoading(true);      
      let imageUrl = "";
      if (photo) {
        // console.log("photo", photo);
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
      setCrop({
        name: "",
        location: {},
        pricePerUnit: "",
        quantity: "",
      });
      setPhoto(null);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error uploading image", error.message);
    }
  };

  if (hasCameraPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={{ backgroundColor: "white", height: "100%" }}>
      {isCameraOpen ? (
        // Camera preview view
        <View style={{ flex: 1 }}>
          <CameraView style={{ flex: 1 }} ref={(ref) => setCameraRef(ref)} />
          <Button
            mode="contained"
            style={{
              position: "absolute",
              bottom: 20,
              alignSelf: "center",
              backgroundColor: "#1F4E3D",
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
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "#aaf0c9",
          }}
        >
          <View
            style={{
              width: "70%",
              margin: "auto",
              display: "flex",
              height: "35%",
            }}
          >
            <Image
              source={img}
              style={{
                width: "50px",
                resizeMode: "contain",
              }}
            />
          </View>
          <View
            style={{
              display: "flex",
              justifyContent: "flex-start",
              height: "70%",
              backgroundColor: "white",
              borderTopLeftRadius: 50,
              borderTopRightRadius: 50,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 30,
                marginTop: "10%",
                fontWeight: "bold",
                color: "black",
              }}
            >
              Enter details for crops
            </Text>

            <View
              style={{
                backgroundColor: "white",
                borderBottomColor: "green",
                borderBottomWidth: 0.8,
                padding: 10,
                height: 60,
                width: "93%",
                // display: "flex",
                // alignItems: "center",
                // justifyContent: "center",
                margin: "auto",
                marginBottom: 0,
                marginTop: 10,
              }}
            >
              <Picker
                selectedValue={crop.name}
                style={{
                  height: 60,
                  width: "100%",
                  border: "1cm solid black",
                }}
                itemStyle={{ color: "black", fontSize: 16 }}
                mode="dropdown"
                onValueChange={(itemValue) =>
                  setCrop({ ...crop, name: itemValue })
                }
              >
                <Picker.Item label="Select Crop" value="" />
                {items.map((item) => (
                  <Picker.Item
                    key={item.value}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </Picker>
            </View>

            {/* Price and Quantity Inputs */}
            <TextInput
              style={{ margin: 10, backgroundColor: "white" }}
              mode="flat"
              label="Price Per Kg"
              value={crop.pricePerUnit.toString()}
              onChangeText={(text) => setCrop({ ...crop, pricePerUnit: text })}
              underlineColor="green"
              activeUnderlineColor="green"
              textColor="black"
            />
            <TextInput
              style={{ margin: 10, backgroundColor: "white" }}
              mode="flat"
              label="Quantity sold (in kg)"
              value={crop.quantity.toString()}
              onChangeText={(text) => setCrop({ ...crop, quantity: text })}
              underlineColor="green"
              activeUnderlineColor="green"
              textColor="black"
            />

            {/* Open Camera Button */}
            <Button
              mode="contained"
              style={{
                marginTop: 20,
                marginBottom: 10,
                backgroundColor: "#1F4E3D",
                width: "50%",
                alignSelf: "center",
              }}
              textColor="white"
              onPress={() => setIsCameraOpen(true)}
            >
              Open Camera
            </Button>

            {/* Display Captured Photo */}
            {photo && (
              <View style={{ alignItems: "center", marginTop: 20 }}>
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: 200, height: 200 }}
                />
              </View>
            )}

            <Button
              mode="contained"
              style={{
                margin: "auto",
                marginTop: 20,
                marginBottom: 10,
                backgroundColor: "#1F4E3D",
                width: "50%",
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
