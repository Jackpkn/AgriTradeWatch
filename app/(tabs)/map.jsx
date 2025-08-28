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
  const [allConsumerCrops, setAllConsumerCrops] = useState([]);
  const [allFarmerCrops, setAllFarmerCrops] = useState([]);
  const [priceUnit, setPriceUnit] = useState('perUnit'); // 'perUnit' or 'perKg'
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

  // Fetch all crops - separate consumer and farmer data
  useEffect(() => {
    const fetchAllCrops = async () => {
      try {
        const [consumerCrops, farmerCrops] = await Promise.all([
          fetchCrops("consumers"),
          fetchCrops("farmers"),
        ]);
        setAllConsumerCrops(consumerCrops);
        setAllFarmerCrops(farmerCrops);
        // Combine for backward compatibility with map markers
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
      console.log('Setting initial marker position:', currentLocation.coords);
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

  // Filter consumers within radius
  const consumersInRadius = useMemo(() => {
    if (!markerPosition || !allConsumerCrops.length) return [];

    return allConsumerCrops.filter((crop) => {
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

      return distance <= radius;
    });
  }, [markerPosition, selectedCrop, radius, allConsumerCrops, calculateDistance]);

  // Consumer statistics
  const consumerStats = useMemo(() => {
    if (!consumersInRadius.length) {
      return { count: 0, averagePrice: 0, averagePricePerKg: 0 };
    }

    const prices = consumersInRadius.map(crop => Number(crop.pricePerUnit) || 0).filter(price => price > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

    // Estimate price per kg (rough conversion - this would need real data)
    const averagePricePerKg = averagePrice * 2; // Placeholder conversion

    return {
      count: consumersInRadius.length,
      averagePrice: Math.round(averagePrice),
      averagePricePerKg: Math.round(averagePricePerKg)
    };
  }, [consumersInRadius]);

  // Memoize the map HTML to prevent unnecessary re-renders
  const mapHtml = useMemo(() => {
    if (!markerPosition) {
      console.log('No markerPosition, returning empty mapHtml');
      return "";
    }

    console.log('Generating map HTML for position:', markerPosition);
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

  // Debug logging for map visibility
  useEffect(() => {
    console.log('Map visibility check:', {
      hasCurrentLocation: !!currentLocation,
      hasMarkerPosition: !!markerPosition,
      hasMapHtml: !!mapHtml,
      mapHtmlLength: mapHtml.length,
      allCropsCount: allCrops.length
    });
  }, [currentLocation, markerPosition, mapHtml, allCrops]);



  // Process consumer chart data (independent of radius)
  const consumerChartData = useMemo(() => {
    if (!allConsumerCrops.length) return [];

    const cropData = allConsumerCrops.filter(crop =>
      selectedCrop && crop.name?.toLowerCase() === selectedCrop.toLowerCase()
    );

    if (!cropData.length) return [];

    // Group by date
    const pricesByDate = {};

    cropData.forEach((crop) => {
      const timestamp = crop.location?.timestamp || crop.createdAt?.seconds * 1000;
      if (!timestamp) return;

      const date = new Date(timestamp);
      const dateKey = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });

      if (!pricesByDate[dateKey]) {
        pricesByDate[dateKey] = {
          prices: [],
          timestamp: timestamp,
        };
      }

      const price = priceUnit === 'perKg'
        ? (Number(crop.pricePerUnit) || 0) * 2 // Rough conversion
        : Number(crop.pricePerUnit) || 0;

      if (price > 0) {
        pricesByDate[dateKey].prices.push(price);
      }
    });

    // Convert to chart format
    return Object.entries(pricesByDate)
      .filter(([_, data]) => data.prices.length > 0)
      .map(([date, data]) => {
        const avgPrice = data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length;
        return {
          label: date,
          value: Math.round(avgPrice),
          dataPointText: `₹${Math.round(avgPrice)}`,
          timestamp: data.timestamp,
          count: data.prices.length,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allConsumerCrops, selectedCrop, priceUnit]);

  // Process farmer chart data (independent of radius)
  const farmerChartData = useMemo(() => {
    if (!allFarmerCrops.length) return [];

    const cropData = allFarmerCrops.filter(crop =>
      selectedCrop && crop.name?.toLowerCase() === selectedCrop.toLowerCase()
    );

    if (!cropData.length) return [];

    // Group by date
    const pricesByDate = {};

    cropData.forEach((crop) => {
      const timestamp = crop.location?.timestamp || crop.createdAt?.seconds * 1000;
      if (!timestamp) return;

      const date = new Date(timestamp);
      const dateKey = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });

      if (!pricesByDate[dateKey]) {
        pricesByDate[dateKey] = {
          prices: [],
          timestamp: timestamp,
        };
      }

      const price = priceUnit === 'perKg'
        ? (Number(crop.pricePerUnit) || 0) * 2 // Rough conversion
        : Number(crop.pricePerUnit) || 0;

      if (price > 0) {
        pricesByDate[dateKey].prices.push(price);
      }
    });

    // Convert to chart format
    return Object.entries(pricesByDate)
      .filter(([_, data]) => data.prices.length > 0)
      .map(([date, data]) => {
        const avgPrice = data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length;
        return {
          label: date,
          value: Math.round(avgPrice),
          dataPointText: `₹${Math.round(avgPrice)}`,
          timestamp: data.timestamp,
          count: data.prices.length,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allFarmerCrops, selectedCrop, priceUnit]);

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
            {markerPosition && mapHtml ? (
              <WebView
                key={`${markerPosition.latitude}-${markerPosition.longitude}-${radius}-${selectedMapType}`}
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
            ) : (
              <View style={styles.mapLoading}>
                <Text style={styles.mapLoadingText}>
                  {currentLocation ? 'Loading Map...' : 'Getting Location...'}
                </Text>
              </View>
            )}
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

          {/* Consumer Information Panel */}
          <View style={styles.consumerInfoPanel}>
            <View style={styles.consumerInfoHeader}>
              <Text style={styles.consumerInfoTitle}>
                Consumer Reported Buying Price: {cropOptions.find(c => c.value === selectedCrop)?.icon} {cropOptions.find(c => c.value === selectedCrop)?.label}
              </Text>
            </View>
            <View style={styles.consumerStatsContainer}>
              <View style={styles.consumerStat}>
                <Text style={styles.consumerStatLabel}>Average Consumer Price</Text>
                <Text style={styles.consumerStatValue}>
                  ₹{priceUnit === 'perKg' ? consumerStats.averagePricePerKg : consumerStats.averagePrice}
                  <Text style={styles.consumerStatUnit}>
                    {priceUnit === 'perKg' ? '/kg' : '/unit'}
                  </Text>
                </Text>
              </View>
              <View style={styles.consumerStat}>
                <Text style={styles.consumerStatLabel}>Consumers in Radius</Text>
                <Text style={styles.consumerStatValue}>{consumerStats.count}</Text>
              </View>
            </View>
          </View>

          {/* Price Unit Toggle */}
          <View style={styles.priceUnitContainer}>
            <TouchableOpacity
              style={[styles.priceUnitButton, priceUnit === 'perUnit' && styles.priceUnitButtonActive]}
              onPress={() => setPriceUnit('perUnit')}
            >
              <Text style={[styles.priceUnitText, priceUnit === 'perUnit' && styles.priceUnitTextActive]}>
                Price per Unit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.priceUnitButton, priceUnit === 'perKg' && styles.priceUnitButtonActive]}
              onPress={() => setPriceUnit('perKg')}
            >
              <Text style={[styles.priceUnitText, priceUnit === 'perKg' && styles.priceUnitTextActive]}>
                Price per Kg
              </Text>
            </TouchableOpacity>
          </View>

          {/* Debug info */}
          <View style={styles.debugSection}>
            <Text style={styles.debugText}>
              Total crops: {allCrops.length} | Consumer: {allConsumerCrops.length} | Farmer: {allFarmerCrops.length}
            </Text>
            <Text style={styles.debugText}>
              Selected: {selectedCrop} | Radius: {Math.round(radius * 1000)}m | Unit: {priceUnit}
            </Text>
          </View>

          {/* Consumer Chart Section */}
          {consumerChartData.length > 0 ? (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                Consumer Buying Price Trends: {cropOptions.find(c => c.value === selectedCrop)?.icon} {cropOptions.find(c => c.value === selectedCrop)?.label}
              </Text>
              <Text style={styles.chartSubtitle}>
                Daily {priceUnit === 'perKg' ? 'per kg' : 'per unit'} prices from all consumer reports
                {consumerChartData.length > 1 && (
                  <>
                    {' • '}
                    {consumerChartData[0]?.label} to {consumerChartData[consumerChartData.length - 1]?.label}
                    {' • '}{consumerChartData.length} days with data
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
                    data={consumerChartData}
                    width={Math.max(width - 40, consumerChartData.length * 120)}
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
                      Math.max(...consumerChartData.map((d) => d.value)) + 20
                    }
                    minValue={Math.max(
                      0,
                      Math.min(...consumerChartData.map((d) => d.value)) - 20
                    )}
                    textShiftY={-25}
                    textShiftX={0}
                    showDataPoints
                    curved
                    dataPointsColor="#1F4E3D"
                    dataPointsRadius={7}
                    spacing={consumerChartData.length > 10 ? 50 : 80}
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
                        const dataPoint = consumerChartData.find(d => d.label === item.label);
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
                              ₹{item.value} {priceUnit === 'perKg' ? '/kg' : '/unit'}
                            </Text>
                            {dataPoint && (
                              <Text style={{ color: "#ddd", fontSize: 11, textAlign: "center" }}>
                                {dataPoint.count} consumer reports
                              </Text>
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
              <Text style={styles.noDataTitle}>No Consumer Data</Text>
              <Text style={styles.noDataText}>
                No consumer reports found for {cropOptions.find(c => c.value === selectedCrop)?.label || selectedCrop}.
              </Text>
            </View>
          )}

          {/* Farmer Chart Section */}
          {farmerChartData.length > 0 ? (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                Farmer Selling Price Trends: {cropOptions.find(c => c.value === selectedCrop)?.icon} {cropOptions.find(c => c.value === selectedCrop)?.label}
              </Text>
              <Text style={styles.chartSubtitle}>
                Daily {priceUnit === 'perKg' ? 'per kg' : 'per unit'} prices from all farmer reports
                {farmerChartData.length > 1 && (
                  <>
                    {' • '}
                    {farmerChartData[0]?.label} to {farmerChartData[farmerChartData.length - 1]?.label}
                    {' • '}{farmerChartData.length} days with data
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
                    data={farmerChartData}
                    width={Math.max(width - 40, farmerChartData.length * 120)}
                    height={280}
                    yAxisLabel={"₹"}
                    xAxisLabelTextStyle={{
                      color: "#8B4513",
                      fontSize: 11,
                      rotation: 45,
                    }}
                    yAxisLabelTextStyle={{
                      color: "#8B4513",
                      fontSize: 12,
                    }}
                    showVerticalLines
                    verticalLinesColor="rgba(139, 69, 19, 0.1)"
                    textColor="#8B4513"
                    color="#FFA500"
                    areaChart
                    startFillColor={"#FFA500"}
                    endFillColor={"#FFA500"}
                    startOpacity={0.2}
                    endOpacity={0.05}
                    maxValue={
                      Math.max(...farmerChartData.map((d) => d.value)) + 20
                    }
                    minValue={Math.max(
                      0,
                      Math.min(...farmerChartData.map((d) => d.value)) - 20
                    )}
                    textShiftY={-25}
                    textShiftX={0}
                    showDataPoints
                    curved
                    dataPointsColor="#8B4513"
                    dataPointsRadius={7}
                    spacing={farmerChartData.length > 10 ? 50 : 80}
                    initialSpacing={30}
                    endSpacing={30}
                    rulesColor="rgba(139, 69, 19, 0.2)"
                    rulesType="solid"
                    xAxisColor="#8B4513"
                    yAxisColor="#8B4513"
                    hideRules={false}
                    hideDataPoints={false}
                    focusEnabled
                    pressEnabled
                    showValuesAsDataPointsText={true}
                    pointerConfig={{
                      pointerStripHeight: 180,
                      pointerStripColor: "rgba(139, 69, 19, 0.1)",
                      pointerStripWidth: 2,
                      pointerColor: "#8B4513",
                      radius: 6,
                      pointerLabelComponent: (item) => {
                        const dataPoint = farmerChartData.find(d => d.label === item.label);
                        return (
                          <View
                            style={{
                              backgroundColor: "#8B4513",
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
                              ₹{item.value} {priceUnit === 'perKg' ? '/kg' : '/unit'}
                            </Text>
                            {dataPoint && (
                              <Text style={{ color: "#ddd", fontSize: 11, textAlign: "center" }}>
                                {dataPoint.count} farmer reports
                              </Text>
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
              <Text style={styles.noDataTitle}>No Farmer Data</Text>
              <Text style={styles.noDataText}>
                No farmer reports found for {cropOptions.find(c => c.value === selectedCrop)?.label || selectedCrop}.
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
  // Consumer Info Panel Styles
  consumerInfoPanel: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consumerInfoHeader: {
    backgroundColor: "#1F4E3D",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  consumerInfoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  consumerStatsContainer: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  consumerStat: {
    alignItems: "center",
    flex: 1,
  },
  consumerStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  consumerStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#49A760",
    textAlign: "center",
  },
  consumerStatUnit: {
    fontSize: 14,
    color: "#666",
  },
  // Price Unit Toggle Styles
  priceUnitContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 4,
  },
  priceUnitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  priceUnitButtonActive: {
    backgroundColor: "#49A760",
  },
  priceUnitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  priceUnitTextActive: {
    color: "#fff",
  },
  // Map Loading Styles
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  mapLoadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
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
 