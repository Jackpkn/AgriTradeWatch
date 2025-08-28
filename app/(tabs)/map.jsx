import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { GlobalContext } from "../../context/GlobalProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fetchCrops } from "../../components/crud";
import { Picker } from "@react-native-picker/picker";
import { LineChart } from "react-native-gifted-charts";
import Icon from "react-native-vector-icons/Ionicons";
import Slider from "@react-native-community/slider";



const cropOptions = [
  { label: "Onion", value: "onion", icon: "🧅" },
  { label: "Tomato", value: "tomato", icon: "🍅" },
  { label: "Drumstick", value: "drumstick", icon: "🥬" },
  { label: "Lemon", value: "lemon", icon: "🍋" },
];

const mapTypes = [
  { label: "Satellite Map", value: "default" },
  { label: "Street Map", value: "street" },
];

const { width } = Dimensions.get("window");

const Map = () => {
  const { currentLocation } = useContext(GlobalContext);
  const [allCrops, setAllCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("onion"); // Default to onion
  const [selectedMapType, setSelectedMapType] = useState("default");
  const [radius, setRadius] = useState(0.5); // Default to 500m (0.5km)
  const [markerPosition, setMarkerPosition] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const webViewRef = useRef(null);
  const radiusTimeoutRef = useRef(null);

  // Memoize calculateDistance to prevent unnecessary re-renders
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  // Debounced radius setter to prevent infinite loops
  const debouncedSetRadius = useCallback((value) => {
    if (radiusTimeoutRef.current) {
      clearTimeout(radiusTimeoutRef.current);
    }
    radiusTimeoutRef.current = setTimeout(() => {
      setRadius(value);
    }, 150); // 150ms debounce
  }, []);

  // Fetch all crops
  useEffect(() => {
    const fetchAllCrops = async () => {
      try {
        const [consumerCrops, farmerCrops] = await Promise.all([
          fetchCrops("consumers"),
          fetchCrops("farmers"),
        ]);
        setAllCrops([...consumerCrops, ...farmerCrops]);
      } catch (error) {
        console.error("Error fetching crops:", error);
      }
    };
    fetchAllCrops();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (radiusTimeoutRef.current) {
        clearTimeout(radiusTimeoutRef.current);
      }
    };
  }, []);

  // Set initial marker position
  useEffect(() => {
    if (currentLocation?.coords && !markerPosition) {
      setMarkerPosition({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
  }, [currentLocation?.coords?.latitude, currentLocation?.coords?.longitude]);

  // Filter crops based on radius and name
  const filteredCrops = useMemo(() => {
    if (!markerPosition || !allCrops.length) return [];

    const filtered = allCrops.filter((crop) => {
      // Check crop name matching (case insensitive)
      if (selectedCrop && crop.name?.toLowerCase() !== selectedCrop.toLowerCase()) {
        return false;
      }

      const cropLat = crop.location?.coords?.latitude;
      const cropLon = crop.location?.coords?.longitude;
      if (!cropLat || !cropLon) return false;

      const distance = calculateDistance(
        markerPosition.latitude,
        markerPosition.longitude,
        cropLat,
        cropLon
      );

      return distance <= radius; // radius is now in km
    });

    console.log(`Filtered crops for ${selectedCrop}:`, filtered.length, 'out of', allCrops.length);
    return filtered;
  }, [markerPosition, selectedCrop, radius, allCrops, calculateDistance]);

  // Memoize the map HTML to prevent unnecessary re-renders
  const mapHtml = useMemo(() => {
    if (!markerPosition) return "";

    const latitude = markerPosition.latitude;
    const longitude = markerPosition.longitude;

    const markers = filteredCrops
      .map((crop) => {
        const lat = crop.location?.coords?.latitude;
        const lon = crop.location?.coords?.longitude;
        if (!lat || !lon) return "";

        return `
        L.marker([${lat}, ${lon}])
          .addTo(map)
          .bindPopup('${crop.name}<br>Price: ₹${crop.pricePerUnit}<br>Quantity: ${crop.quantity}');
      `;
      })
      .join("");

    // Choose tile layer based on map type
    const tileLayer = selectedMapType === "street"
      ? `L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 20,
          attribution: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team'
        })`
      : `L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: '© Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; }
            #map { height: 100vh; width: 100vw; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${latitude}, ${longitude}], 13);
            ${tileLayer}.addTo(map);

            // Add draggable red marker
            var redMarker = L.marker([${latitude}, ${longitude}], {
              draggable: true,
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            }).addTo(map);

            redMarker.bindPopup('Drag me to select location');

            // Handle marker drag events
            redMarker.on('dragend', function(event) {
              var position = redMarker.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerMoved',
                latitude: position.lat,
                longitude: position.lng
              }));
            });

            // Add circle for radius
            var radiusCircle = L.circle([${latitude}, ${longitude}], {
              color: '#49A760',
              fillColor: '#49A760',
              fillOpacity: 0.1,
              radius: ${radius * 1000}
            }).addTo(map);

            // Add markers for crops
            ${markers}

            // Function to update circle when marker moves
            function updateCircle(lat, lng) {
              map.removeLayer(radiusCircle);
              radiusCircle = L.circle([lat, lng], {
                color: '#49A760',
                fillColor: '#49A760',
                fillOpacity: 0.1,
                radius: ${radius * 1000}
              }).addTo(map);
            }

            // Listen for radius updates
            window.addEventListener('message', function(event) {
              try {
                var data = JSON.parse(event.data);
                if (data.type === 'updateRadius') {
                  map.removeLayer(radiusCircle);
                  radiusCircle = L.circle([${latitude}, ${longitude}], {
                    color: '#49A760',
                    fillColor: '#49A760',
                    fillOpacity: 0.1,
                    radius: data.radius * 1000
                  }).addTo(map);
                }
              } catch (e) {
                console.log('Error parsing message:', e);
              }
            });
          </script>
        </body>
      </html>
    `;
  }, [markerPosition, filteredCrops, radius, selectedMapType]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerMoved') {
        setMarkerPosition({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, []);



  // Process data for chart with daily averages
  const chartData = useMemo(() => {
    if (!filteredCrops.length) {
      console.log("No filtered crops for chart");
      return [];
    }

    console.log("Processing chart data for", filteredCrops.length, "crops");

    // Group crops by date
    const pricesByDate = {};

    filteredCrops.forEach((crop, index) => {
      const timestamp =
        crop.location?.timestamp || crop.createdAt?.seconds * 1000;

      if (!timestamp) {
        console.log(`Crop ${index} missing timestamp:`, crop);
        return;
      }

      const date = new Date(timestamp);
      const dateKey = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });

      if (!pricesByDate[dateKey]) {
        pricesByDate[dateKey] = {
          total: 0,
          count: 0,
          timestamp: timestamp,
          samples: [],
        };
      }

      const price = Number(crop.pricePerUnit);
      if (!isNaN(price) && price > 0) {
        pricesByDate[dateKey].total += price;
        pricesByDate[dateKey].count += 1;
        pricesByDate[dateKey].samples.push(price);
      }
    });

    // Get date range from the data
    const dateEntries = Object.entries(pricesByDate).filter(([_, data]) => data.count > 0);
    if (dateEntries.length === 0) return [];

    // Sort by timestamp to get the range
    const sortedEntries = dateEntries.sort(([_, a], [__, b]) => a.timestamp - b.timestamp);
    const startDate = new Date(sortedEntries[0][1].timestamp);
    const endDate = new Date(sortedEntries[sortedEntries.length - 1][1].timestamp);

    // Create a complete date range (fill in missing days)
    const completeData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });

      if (pricesByDate[dateKey] && pricesByDate[dateKey].count > 0) {
        // We have data for this day
        const { total, count, timestamp, samples } = pricesByDate[dateKey];
        const average = Math.round(total / count);
        const minPrice = Math.min(...samples);
        const maxPrice = Math.max(...samples);

        completeData.push({
          label: dateKey,
          value: average,
          dataPointText: `₹${average}`,
          timestamp: timestamp,
          minPrice,
          maxPrice,
          count,
          hasData: true,
        });
      } else {
        // No data for this day - show as null/empty
        completeData.push({
          label: dateKey,
          value: null, // No data point
          dataPointText: "",
          timestamp: currentDate.getTime(),
          minPrice: null,
          maxPrice: null,
          count: 0,
          hasData: false,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("Complete chart data with daily averages:", completeData);
    return completeData;
  }, [filteredCrops]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header with controls */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Crop Map</Text>
            <View style={styles.headerControls}>
              <View style={styles.cropSelectorContainer}>
                <Text style={styles.cropSelectorLabel}>Select Crop:</Text>
                <TouchableOpacity
                  style={styles.cropSelectorButton}
                  onPress={() => setShowCropModal(true)}
                >
                  <Text style={styles.cropSelectorButtonText}>
                    {cropOptions.find(c => c.value === selectedCrop)?.icon || '🌾'} {cropOptions.find(c => c.value === selectedCrop)?.label || selectedCrop}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.mapTypeSelector}>
            {mapTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.mapTypeButton,
                  selectedMapType === type.value && styles.selectedMapTypeButton,
                ]}
                onPress={() => setSelectedMapType(type.value)}
              >
                <Text
                  style={[
                    styles.mapTypeText,
                    selectedMapType === type.value && styles.selectedMapTypeText,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ScrollView for content below header */}
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Full width map container */}
          <View style={styles.mapContainer}>
                      <WebView
            key={`${markerPosition?.latitude}-${markerPosition?.longitude}-${radius}`}
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.map}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleWebViewMessage}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent.statusCode);
            }}
          />
          </View>

                    {/* Distance slider below map */}
          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>
              Radius: {(radius * 1000).toFixed(0)}m
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.01} // 10m
              maximumValue={0.7} // 700m
              value={radius}
              onValueChange={debouncedSetRadius}
              minimumTrackTintColor="#49A760"
              maximumTrackTintColor="#ddd"
              thumbStyle={styles.sliderThumb}
            />

            {/* Range Labels */}
            <View style={styles.sliderRangeLabels}>
              <Text style={styles.sliderRangeLabel}>Nearby</Text>
              <Text style={[styles.sliderRangeLabel, styles.sliderRangeLabelCenter]}>Local</Text>
              <Text style={styles.sliderRangeLabel}>Regional</Text>
            </View>

            {/* Slider Markers */}
            <View style={styles.sliderMarkersContainer}>
              {/* Current value indicator */}
              <View
                style={[
                  styles.sliderCurrentIndicator,
                  { left: `${(radius / 0.7) * 100}%` }
                ]}
              >
                <View style={styles.sliderCurrentIndicatorLine} />
                <View style={styles.sliderCurrentIndicatorDot} />
              </View>

              {/* Major markers (every 100m) */}
              {[100, 200, 300, 400, 500, 600, 700].map((value) => {
                const position = (value / 700) * 100; // Convert to percentage
                return (
                  <View key={value} style={[styles.sliderMarker, { left: `${position}%` }]}>
                    <View style={styles.sliderMarkerLine} />
                    <Text style={styles.sliderMarkerText}>{value}m</Text>
                  </View>
                );
              })}
              {/* Minor markers (every 50m) */}
              {[50, 150, 250, 350, 450, 550, 650].map((value) => {
                const position = (value / 700) * 100; // Convert to percentage
                return (
                  <View key={value} style={[styles.sliderMinorMarker, { left: `${position}%` }]}>
                    <View style={styles.sliderMinorMarkerLine} />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Debug info */}
          <View style={styles.debugSection}>
            <Text style={styles.debugText}>
              Total crops: {allCrops.length} | Filtered: {filteredCrops.length} | Chart points: {chartData.length}
            </Text>
            <Text style={styles.debugText}>
              Selected: {selectedCrop} | Radius: {Math.round(radius * 1000)}m
            </Text>
          </View>

          {/* Chart section */}
          {chartData.length > 0 ? (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                Price Trends for {cropOptions.find(c => c.value === selectedCrop)?.label || selectedCrop}
              </Text>
              <Text style={styles.chartSubtitle}>
                Daily average prices from {filteredCrops.length} records within {Math.round(radius * 1000)}m radius
                {chartData.filter(d => d.hasData).length > 1 && (
                  <>
                    {' • '}
                    {chartData.filter(d => d.hasData)[0]?.label} to {chartData.filter(d => d.hasData)[chartData.filter(d => d.hasData).length - 1]?.label}
                    {' • '}{chartData.filter(d => d.hasData).length} days with data
                  </>
                )}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.chartScroll}
                contentContainerStyle={styles.chartScrollContent}
              >
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={chartData.filter(d => d.hasData)} // Only show days with data
                    width={Math.max(width - 40, chartData.filter(d => d.hasData).length * 120)}
                    height={280}
                    yAxisLabel={"₹"}
                    xAxisLabelTextStyle={{
                      color: "#1F4E3D",
                      fontSize: 11,
                      rotation: 45,
                    }}
                    yAxisLabelTextStyle={{
                      color: "#1F4E3D",
                      fontSize: 12,
                    }}
                    showVerticalLines
                    verticalLinesColor="rgba(73, 167, 96, 0.1)"
                    textColor="#1F4E3D"
                    color="#49A760"
                    areaChart
                    startFillColor={"#49A760"}
                    endFillColor={"#49A760"}
                    startOpacity={0.2}
                    endOpacity={0.05}
                    maxValue={
                      Math.max(...chartData.filter(d => d.hasData).map((d) => d.value)) + 20
                    }
                    minValue={Math.max(
                      0,
                      Math.min(...chartData.filter(d => d.hasData).map((d) => d.value)) - 20
                    )}
                    textShiftY={-25}
                    textShiftX={0}
                    showDataPoints
                    curved
                    dataPointsColor="#1F4E3D"
                    dataPointsRadius={7}
                    spacing={chartData.filter(d => d.hasData).length > 10 ? 50 : 80}
                    initialSpacing={30}
                    endSpacing={30}
                    rulesColor="rgba(73, 167, 96, 0.2)"
                    rulesType="solid"
                    xAxisColor="#1F4E3D"
                    yAxisColor="#1F4E3D"
                    hideRules={false}
                    hideDataPoints={false}
                    focusEnabled
                    pressEnabled
                    showValuesAsDataPointsText={true}
                                      pointerConfig={{
                    pointerStripHeight: 180,
                    pointerStripColor: "rgba(31, 78, 61, 0.1)",
                    pointerStripWidth: 2,
                    pointerColor: "#1F4E3D",
                    radius: 6,
                    pointerLabelComponent: (item) => {
                      const dataPoint = chartData.find(d => d.label === item.label && d.hasData);
                      return (
                        <View
                          style={{
                            backgroundColor: "#1F4E3D",
                            padding: 10,
                            borderRadius: 10,
                            minWidth: 140,
                          }}
                        >
                          <Text
                            style={{ color: "#fff", fontWeight: "600", fontSize: 12, textAlign: "center", marginBottom: 4 }}
                          >
                            {item.label}
                          </Text>
                          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
                            ₹{item.value} avg
                          </Text>
                          {dataPoint && (
                            <>
                              <Text style={{ color: "#ddd", fontSize: 11, textAlign: "center" }}>
                                {dataPoint.count} samples
                              </Text>
                              <Text style={{ color: "#ddd", fontSize: 10, textAlign: "center", marginTop: 2 }}>
                                ₹{dataPoint.minPrice} - ₹{dataPoint.maxPrice}
                              </Text>
                            </>
                          )}
                        </View>
                      );
                    },
                  }}
                  />
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.noDataSection}>
              <Text style={styles.noDataTitle}>No Data Available</Text>
              <Text style={styles.noDataText}>
                No {cropOptions.find(c => c.value === selectedCrop)?.label || selectedCrop} records found within {Math.round(radius * 1000)}m radius.
              </Text>
              <Text style={styles.noDataHint}>
                Try adjusting the radius or selecting a different crop.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Crop Selection Modal */}
        <Modal
          visible={showCropModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCropModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Crop</Text>
                <TouchableOpacity
                  onPress={() => setShowCropModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color="#1F4E3D" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.cropList}>
                {cropOptions.map((crop) => (
                  <TouchableOpacity
                    key={crop.value}
                    style={[
                      styles.cropOption,
                      selectedCrop === crop.value && styles.selectedCropOption
                    ]}
                    onPress={() => {
                      setSelectedCrop(crop.value);
                      setShowCropModal(false);
                    }}
                  >
                    <Text style={styles.cropOptionIcon}>{crop.icon}</Text>
                    <Text style={[
                      styles.cropOptionText,
                      selectedCrop === crop.value && styles.selectedCropOptionText
                    ]}>
                      {crop.label}
                    </Text>
                    {selectedCrop === crop.value && (
                      <Icon name="checkmark" size={20} color="#49A760" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eafbe7",
  },
  contentScroll: {
    flex: 1,
  },
  header: {
    backgroundColor: "#1F4E3D",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  headerControls: {
    flex: 1,
    marginLeft: 20,
  },
  cropSelectorContainer: {
    alignItems: "flex-end",
  },
  cropSelectorLabel: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  cropSelectorButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    minWidth: 140,
  },
  cropSelectorButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  mapTypeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  mapTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  selectedMapTypeButton: {
    backgroundColor: "#49A760",
    borderColor: "#49A760",
  },
  mapTypeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedMapTypeText: {
    color: "#fff",
    fontWeight: "600",
  },
  mapContainer: {
    height: 350, // Fixed height to prevent expansion
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#49A760",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  sliderSection: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F4E3D",
    marginBottom: 12,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#49A760",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderMarkersContainer: {
    position: "relative",
    marginTop: 10,
    height: 30,
    alignItems: "center",
  },
  sliderMarker: {
    position: "absolute",
    alignItems: "center",
    top: 0,
  },
  sliderMarkerLine: {
    width: 2,
    height: 12,
    backgroundColor: "#49A760",
    borderRadius: 1,
    opacity: 0.7,
  },
  sliderMarkerText: {
    position: "absolute",
    top: 16,
    fontSize: 10,
    color: "#1F4E3D",
    fontWeight: "600",
    textAlign: "center",
    minWidth: 30,
  },
  sliderMinorMarker: {
    position: "absolute",
    alignItems: "center",
    top: 0,
  },
  sliderMinorMarkerLine: {
    width: 1,
    height: 8,
    backgroundColor: "#49A760",
    borderRadius: 0.5,
    opacity: 0.4,
  },
  sliderRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 10,
  },
  sliderRangeLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    opacity: 0.8,
  },
  sliderRangeLabelCenter: {
    textAlign: "center",
    flex: 1,
  },
  sliderCurrentIndicator: {
    position: "absolute",
    alignItems: "center",
    top: 0,
    zIndex: 10,
  },
  sliderCurrentIndicatorLine: {
    width: 3,
    height: 16,
    backgroundColor: "#1F4E3D",
    borderRadius: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  sliderCurrentIndicatorDot: {
    position: "absolute",
    top: -4,
    width: 8,
    height: 8,
    backgroundColor: "#1F4E3D",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  chartSection: {
    backgroundColor: "#fff",
    margin: 10,
    marginTop: 0,
    marginBottom: 20, // Add bottom margin for scroll
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 320, // Fixed minimum height for chart
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F4E3D",
    marginBottom: 8,
    textAlign: "center",
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  noDataSection: {
    backgroundColor: "#fff",
    margin: 10,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F4E3D",
    marginBottom: 8,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  noDataHint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
  },
  chartScroll: {
    marginTop: 10,
  },
  chartScrollContent: {
    paddingRight: 20,
    alignItems: "center",
  },
  chartWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  debugSection: {
    backgroundColor: "#f0f9f0",
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#49A760",
  },
  debugText: {
    fontSize: 12,
    color: "#1F4E3D",
    textAlign: "center",
    fontFamily: "monospace",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 20,
    maxHeight: "70%",
    width: "80%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F4E3D",
  },
  modalCloseButton: {
    padding: 5,
  },
  cropList: {
    padding: 10,
  },
  cropOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedCropOption: {
    backgroundColor: "#eafbe7",
    borderColor: "#49A760",
  },
  cropOptionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 30,
    textAlign: "center",
  },
  cropOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  selectedCropOptionText: {
    color: "#1F4E3D",
    fontWeight: "600",
  },
});

export default Map;
