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

  const items = [
    { label: "Select Crop", value: " " },
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


  const CropGraph = (cropsArray, cropName) => {
    if (!cropName || cropName.trim() === "" || cropName === " " || cropName.toLowerCase() === "select crop") {
      return null;
    }
    const filteredCrops = cropsArray.filter((crop) => crop.name === cropName);

    if (filteredCrops.length === 0) {
      console.log(`No crops found with the name: ${cropName}`);
      return <Text style={{ color: 'red', fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>No data found</Text>;
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

    // Dynamically set chart width based on data length
    const chartWidth = Math.max(300, averagedDataWithText.length * 50);

    return (
      <LineChart
        data={averagedDataWithText}
        width={chartWidth}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eafbe7' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 40 }}>
        <View style={styles.headerCard}>
          <Text style={styles.headerText}>Crop Price Statistics</Text>
          <Text style={styles.subHeaderText}>Visualize and compare crop prices over time for farmers and consumers.</Text>
        </View>

        {/* Consumer Crops Section */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Consumer Crops</Text>
          <View style={styles.pickerRow}>
            <Text style={styles.label}>Select Crop:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={consumerCropName}
                style={styles.picker}
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
          </View>
          <View style={styles.axisRow}>
            <Text style={styles.axisLabel}>X Axis: Dates</Text>
            <Text style={styles.axisLabel}>Y Axis: Price (₹)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.chartScrollContainer}>
            <View style={styles.chartContainer}>
              {CropGraph(consumerCrops, consumerCropName)}
            </View>
          </ScrollView>
        </View>

        {/* Farmer Crops Section */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Farmer Crops</Text>
          <View style={styles.pickerRow}>
            <Text style={styles.label}>Select Crop:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={farmerCropName}
                style={styles.picker}
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
          </View>
          <View style={styles.axisRow}>
            <Text style={styles.axisLabel}>X Axis: Dates</Text>
            <Text style={styles.axisLabel}>Y Axis: Price (₹)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.chartScrollContainer}>
            <View style={styles.chartContainer}>
              {CropGraph(farmerCrops, farmerCropName)}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default stats;

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#1F4E3D',
    width: '95%',
    alignSelf: 'center',
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#49A760',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subHeaderText: {
    color: '#eafbe7',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    width: '95%',
    alignSelf: 'center',
    shadowColor: '#49A760',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#1F4E3D',
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  pickerWrapper: {
    backgroundColor: '#eafbe7',
    borderRadius: 8,
    paddingHorizontal: 8,
    flex: 1,
    marginLeft: 10,
  },
  picker: {
    height: 'auto',
    width: '100%',
    color: '#1F4E3D',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  axisLabel: {
    fontSize: 14,
    color: '#49A760',
    fontWeight: 'bold',
  },
  chartScrollContainer: {
    minWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#eafbe7',
    borderRadius: 12,
    padding: 10,
    minHeight: 220,
    minWidth: 400
  },
});
