import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { GlobalContext } from "../../context/GlobalProvider";

const Map = () => {
  const { currentLocation } = useContext(GlobalContext);
  const [mapHtml, setMapHtml] = useState("");

  useEffect(() => {
    // Default to a central location if current location is not available
    const latitude = currentLocation?.coords?.latitude || 20.5937;
    const longitude = currentLocation?.coords?.longitude || 78.9629;

    const html = `
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
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add marker for current location
            L.marker([${latitude}, ${longitude}])
              .addTo(map)
              .bindPopup('Your Location')
              .openPopup();
          </script>
        </body>
      </html>
    `;

    setMapHtml(html);
  }, [currentLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerText}>Location Map</Text>
        <Text style={styles.subHeaderText}>
          View crop locations and market areas
        </Text>
      </View>
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eafbe7",
  },
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
  mapContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    margin: 10,
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
});

export default Map;
