import { View, Text, ScrollView, Image, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, TextInput } from "react-native-paper";
import img from "../assets/images/Group 2.png";
import { router } from "expo-router";
// import Toast from "react-native-toast-message";

const crops = () => {
  const [crop, setCrop] = useState({
    name: "",
    location: {},
    pricePerUnit: 0,
    quantity: 0,
  });

  const handleCropSubmit = () => {
    
    if (!crop.name || !crop.pricePerUnit || !crop.quantity) {
      // Toast.show({
      //   type: "error",
      //   text1: "Please fill in all the fields",
      // });
      Alert.alert("Fill all the fields")
      return;
    }

    if(crop.pricePerUnit === NaN){
      Alert.alert("Enter correct price")
    }
    if(crop.quantity === NaN){
      Alert.alert("Enter correct quantity")
    }

    // set it to global varaible
    
    router.replace("/home");
    Alert.alert("Crop added successfully")
    // Toast.show({
    //   type: "success",
    //   text1: "Crop added successfully",
    // });
  }

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ height: "100%", width:"100%", display:"flex", justifyContent:"flex-end", backgroundColor:"#aaf0c9" }}>
        <View style={{
          width: "70%",
          margin: "auto",
          display: "flex",
          height: "45%",
        }}>
          <Image source={img} style={{
            width: "50px",
            // height: "80px",
            resizeMode: "contain",
          }} />
        </View>
        <View style={{
          display: "flex",
          justifyContent: "flex-start",
          height: "70%",
          backgroundColor: "white",
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          border: "1px solid black",
        }} >
          <Text style={{
            textAlign: "center",
            fontSize: 30,
            marginTop: "10%",
            fontWeight: "bold",
            color: "black",
          }} >Enter details for crops</Text>
          <TextInput
          style={{margin: 10, backgroundColor: "white"}}
            mode="flat"
            label="Crop Name"
            value={crop.name}
            onChangeText={(text) => {setCrop({ ...crop, name:text })}}
            underlineColor="green"
            activeUnderlineColor="green"
            textColor="black"
          />
          <TextInput
          style={{margin: 10, backgroundColor: "white"}}
            mode="flat"
            label="Price Per Kg"
            value={crop.pricePerUnit}
            onChangeText={(text) => {setCrop({ ...crop, pricePerUnit:Number(text) })}}
            underlineColor="green"
            activeUnderlineColor="green"
            textColor="black"
          />
          <TextInput
          style={{margin: 10, backgroundColor: "white"}}
            mode="flat"
            label="Quantity (in kg) "
            value={crop.quantity}
            onChangeText={(text) => {setCrop({ ...crop, quantity:Number(text) })}}
            underlineColor="green"
            activeUnderlineColor="green"
            textColor="black"
          />
          <Button mode="contained" style={{
            margin: "auto",
            marginTop: 20,
            marginBottom: 10,
            backgroundColor: "#1F4E3D",
            width: "50%",
            border: "none",
            outline: "none",
          }} textColor="white"  onPress={handleCropSubmit}>
    Submit
  </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default crops;
