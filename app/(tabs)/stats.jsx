import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "react-native-paper";
import { getAllCrops } from "../../components/cropsController";
import { GlobalContext } from "../../context/GlobalProvider";
import { Picker } from "@react-native-picker/picker";
// import api from '../../components/GlobalApi';
// import Boxplot from '../../components/Boxplot';

const stats = () => {
  const { setIsLoading } = useContext(GlobalContext);

  const [consumerCrops, setConsumerCrops] = useState([]);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [consumerCropName, setConsumerCropName] = useState("");
  const [farmerCropName, setFarmerCropName] = useState("");

  
  const [items, setItems] = useState([
    {label:"select Crop", value:""},
    { label: "Wheat", value: "wheat" },
    { label: "Rice", value: "rice" },
    { label: "Corn", value: "corn" },
    { label: "Soybeans", value: "soybeans" },
    // Add more crops as needed
  ]);

  const calculateCropMean = (cropsArray, cropName) => {
    // Filter the array to get only the crops matching the given name
    const filteredCrops = cropsArray.filter((crop) => crop.name === cropName);

    // If no matching crops are found, return 0
    if (filteredCrops.length === 0) {
      console.log(`No crops found with the name: ${cropName}`);
      return 0;
    }

    // Calculate the sum of pricePerUnit
    const totalPrice = filteredCrops.reduce((sum, crop) => {
      return sum + parseFloat(crop.pricePerUnit); // Convert pricePerUnit to a number
    }, 0);

    // Calculate the mean
    const meanPrice = totalPrice / filteredCrops.length;

    console.log(`Mean price for ${cropName}:`, meanPrice);
    return meanPrice;
  };

  // useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const consumerData = await getAllCrops("consumers");
      console.log("consumer Crops:", consumerData);
      setConsumerCrops(consumerData);

      const farmerData = await getAllCrops("farmers");
      console.log("farmer Crops:", farmerData);
      setFarmerCrops(farmerData);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }
  , []);

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%" }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Stats</Text>
          </View>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Total crops added by consumers:</Text>
            <Text style={styles.value}>{consumerCrops.length}</Text>
          </View>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Select Crop:</Text>
            <Picker
              selectedValue={consumerCropName}
              style={{ height: 50, width: 150 }}
              onValueChange={(itemValue) => setConsumerCropName(itemValue)}
            >
              {items.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Average Price for {consumerCropName}:</Text>
            <Text style={styles.value}>
              {consumerCropName ? calculateCropMean(consumerCrops, consumerCropName) : "Select a crop"}
            </Text>
          </View>
          <View style={{marginTop:70, display:"block", width:"100%"}}></View>
          <View style={styles.profileSection} >
            <Text style={styles.label}>Total crops added by Farmers:</Text>
            <Text style={styles.value}> {farmerCrops.length} </Text>
          </View>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Select Crop:</Text>
            <Picker
              selectedValue={farmerCropName}
              style={{ height: 50, width: 150 }}
              onValueChange={(itemValue) => setFarmerCropName(itemValue)}
            >
              {items.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Average Price for {farmerCropName}:</Text>
            <Text style={styles.value}>
              {farmerCropName ? calculateCropMean(farmerCrops, farmerCropName) : "Select a crop"}
            </Text>
          </View>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Total Crops:</Text>
            <Text style={styles.value}>
              {consumerCrops.length + farmerCrops.length}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={{
              position: "absolute",
              bottom: 20,
              alignSelf: "center",
              backgroundColor: "#1F4E3D",
            }}
            textColor="white"
            onPress={fetchData}
          >
            {" "}
            Fetch Data
          </Button>
        </View>

        {/* <Boxplot data={prices} width={300} height={100} margin={10} /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default stats;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  header: {
    backgroundColor: "#1F4E3D",
    width: "100%",
    padding: 10,
    alignItems: "center",
  },
  headerText: {
    color: "white",
    fontSize: 20,
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  label: {
    fontSize: 16,
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    padding: 10,
    width: "100%",
    //   height: '100%',
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    //   position: 'absolute',
    //     top: 200,
    //     right: 10,
  },
});
