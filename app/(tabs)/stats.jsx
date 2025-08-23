import { LineChart } from "react-native-gifted-charts";
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
    { label:"Select Crop", value: " " },
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


  const CropGraph = (cropsArray, cropName) => {
    const filteredCrops = cropsArray.filter((crop) => crop.name === cropName);

    if (filteredCrops.length === 0) {
      console.log(`No crops found with the name: ${cropName}`);
      return "No data found";
    }

    filteredCrops.sort(
      (a, b) => new Date(a.location.timestamp) - new Date(b.location.timestamp)
    );

    const data = filteredCrops.map((crop) => {
      const date = new Date(crop.location.timestamp);
      const formattedDate = date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
        .replace(/ /g, " ");
      return {
        value: Number(crop.pricePerUnit),
        label: formattedDate,
      };
    });

    // console.log("Data:", data);

    const averagedData = data
      .reduce((acc, curr) => {
        const existing = acc.find((item) => item.label === curr.label);
        if (existing) {
          existing.value =
            (existing.value * existing.count + curr.value) /
            (existing.count + 1);
          existing.count += 1;
        } else {
          acc.push({ ...curr, count: 1 });
        }
        return acc;
      }, [])
      .map(({ count, ...rest }) => rest);

    const averagedDataWithText = averagedData.map((item) => ({
      ...item,
      value: Math.trunc(item.value),
      dataPointText: Math.trunc(item.value).toString(),
    }));


    return (
      <LineChart
        data={averagedDataWithText}
        width={300}
        height={200}
        yAxisLabel={"Price(in rupee)"}
        xAxisLabelTextStyle={{ color: "black" }}
        yAxisLabelTextStyle={{ color: "black" }}
        rotateLabel
        showVerticalLines
        textColor="green"
        textShiftY={-2}
        textShiftX={-5}
        textFontSize={13}
        startFillColor={"rgb(84,219,234)"}
        endFillColor={"rgb(84,219,234)"}
        startOpacity={0.4}
        endOpacity={0.1}
        areaChart
        color="#07BAD1"
        xAxisThickness={0}
        yAxisThickness={0}
      />
    );
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
  }, []);

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%" }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Statistical Analysis</Text>
          </View>
          <Text style={styles.ContainerHeadingText}>Consumer Crops</Text>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Select Crop:</Text>
            <Picker
              selectedValue={consumerCropName}
              style={{ height: 50, width: 150 }}
              onValueChange={(itemValue) => setConsumerCropName(itemValue)}
            >
              {items.map((item) => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Picker>
          </View>
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              X Axis: Dates
            </Text>
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              Y Axis: Price (in Rupees)
            </Text>
          <View style={styles.profileSection}>
            <Text> {CropGraph(consumerCrops, consumerCropName)}</Text>
          </View>
          <View
            style={{ marginTop: 20, display: "block", width: "100%" }}
          ></View>

          <Text style={styles.ContainerHeadingText}>Farmer Crops</Text>
          <View style={styles.profileSection}>
            <Text style={styles.label}>Select Crop:</Text>
            <Picker
              selectedValue={farmerCropName}
              style={{ height: 50, width: 150 }}
              onValueChange={(itemValue) => setFarmerCropName(itemValue)}
            >
              {items.map((item) => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Picker>
          </View>
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              X Axis: Dates
            </Text>
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              Y Axis: Price (in Rupees)
            </Text>
          <View style={styles.profileSection}>
            <Text> {CropGraph(farmerCrops, farmerCropName)}</Text>
          </View>
          <View
            style={{ marginTop: 70, display: "block", width: "100%" }}
          ></View>
        </View>
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
  ContainerHeadingText: {
    color: "#333",
    fontSize: 30,
    fontFamily: " Arial",
    padding: 10,
    // textDecorationLine: "underline",
  fontWeight: 'bold'
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
