import { LineChart } from "react-native-gifted-charts";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "react-native-paper";
import { fetchCrops } from "../../components/crud";
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
    if (
      !cropName ||
      cropName.trim() === "" ||
      cropName === " " ||
      cropName.toLowerCase() === "select crop"
    ) {
      return null;
    }
    console.log("Processing crops:", cropName, cropsArray);
    const filteredCrops = cropsArray.filter((crop) => {
      console.log("Checking crop:", crop.name, cropName);
      return crop.name.toLowerCase() === cropName.toLowerCase();
    });

    if (filteredCrops.length === 0) {
      console.log(`No crops found with the name: ${cropName}`);
      return (
        <Text
          style={{
            color: "red",
            fontSize: 16,
            fontWeight: "bold",
            marginTop: 12,
          }}
        >
          No data found
        </Text>
      );
    }

    console.log("Filtered crops:", filteredCrops);

    filteredCrops.sort((a, b) => {
      const timestampA = a.location?.timestamp || a.createdAt?.seconds * 1000;
      const timestampB = b.location?.timestamp || b.createdAt?.seconds * 1000;
      return timestampA - timestampB;
    });

    // Process each data point individually with time
    const data = filteredCrops
      .map((crop) => {
        const timestamp =
          crop.location?.timestamp || crop.createdAt?.seconds * 1000;
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const formattedDate = `${date
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })
          .replace(/ /g, " ")} ${hours}:${minutes}`;

        const price = Number(crop.pricePerUnit);
        if (!isNaN(price)) {
          return {
            label: formattedDate,
            value: price,
            timestamp: timestamp,
          };
        }
        return null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log("Final processed data:", data);

    const averagedDataWithText = data.map((item) => ({
      ...item,
      dataPointText: item.value.toString(),
    }));

    // Dynamically set chart width based on data length
    const chartWidth = Math.max(400, averagedDataWithText.length * 100);

    return (
      <LineChart
        data={averagedDataWithText}
        width={chartWidth}
        height={250}
        yAxisLabel={"₹"}
        xAxisLabelTextStyle={{ color: "#1F4E3D", fontSize: 12 }}
        yAxisLabelTextStyle={{ color: "#1F4E3D", fontSize: 12 }}
        rotateLabel
        showVerticalLines
        textColor="#49A760"
        textShiftY={-5}
        textShiftX={-8}
        textFontSize={12}
        startFillColor={"#49A760"}
        endFillColor={"#49A760"}
        startOpacity={0.2}
        endOpacity={0.05}
        areaChart
        color="#49A760"
        xAxisThickness={1}
        yAxisThickness={1}
        rulesType="solid"
        rulesColor="#E0E0E0"
        yAxisColor="#1F4E3D"
        xAxisColor="#1F4E3D"
        maxValue={Math.max(...averagedDataWithText.map((d) => d.value)) + 10}
        minValue={Math.max(
          0,
          Math.min(...averagedDataWithText.map((d) => d.value)) - 10
        )}
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

  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCrops = async () => {
    try {
      setIsLoading(true);
      const [consumerData, farmerData] = await Promise.all([
        fetchCrops("consumers"),
        fetchCrops("farmers"),
      ]);

      setConsumerCrops(consumerData);
      setFarmerCrops(farmerData);
    } catch (error) {
      console.error("Error fetching crops:", error);
      Alert.alert("Error", "Failed to fetch crop data. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllCrops();
  }, []);

  useEffect(() => {
    fetchAllCrops();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#49A760"]}
            tintColor="#49A760"
          />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerText}>Crop Price Statistics</Text>
          <Text style={styles.subHeaderText}>
            Visualize and compare crop prices over time for farmers and
            consumers.
          </Text>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.chartScrollContainer}
          >
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.chartScrollContainer}
          >
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
    backgroundColor: "#1F4E3D",
    width: "95%",
    alignSelf: "center",
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    marginBottom: 18,
    alignItems: "center",
    shadowColor: "#49A760",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  subHeaderText: {
    color: "#eafbe7",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 2,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    width: "95%",
    alignSelf: "center",
    shadowColor: "#49A760",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: "#1F4E3D",
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  pickerWrapper: {
    backgroundColor: "#eafbe7",
    borderRadius: 8,
    paddingHorizontal: 8,
    flex: 1,
    marginLeft: 10,
  },
  picker: {
    height: "auto",
    width: "100%",
    color: "#1F4E3D",
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  axisLabel: {
    fontSize: 14,
    color: "#49A760",
    fontWeight: "bold",
  },
  chartScrollContainer: {
    minWidth: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#eafbe7",
    borderRadius: 12,
    padding: 10,
    minHeight: 220,
    minWidth: 400,
  },
});
