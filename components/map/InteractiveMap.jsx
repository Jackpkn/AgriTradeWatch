import React, { useMemo, useRef, useCallback } from "react";
import { View, Text } from "react-native";
import WebView from "react-native-webview";
import { CROP_OPTIONS, MAP_CONFIG } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";

const InteractiveMap = React.forwardRef(({
  markerPosition,
  allCrops,
  radius,
  selectedCrop,
  selectedMapType,
  onMarkerMove,
}, ref) => {
  // Use forwarded ref or create local ref
  const webViewRef = ref || React.useRef(null);

  // Generate proper Leaflet map HTML
  const mapHtml = useMemo(() => {
    if (!markerPosition) return "";

    const { latitude, longitude } = markerPosition;


    // Filter and process crop markers
    const filteredCrops = allCrops.filter((crop) => {
      if (!crop) return false;
      const cropNameToCheck = crop.name || crop.commodity;
      return cropNameToCheck && cropNameToCheck.toLowerCase() === selectedCrop.toLowerCase();
    });
    
    console.log('InteractiveMap: Total crops:', allCrops.length);
    console.log('InteractiveMap: Selected crop:', selectedCrop);
    console.log('InteractiveMap: Filtered crops:', filteredCrops.length);
    
    const selectedCropMarkers = filteredCrops.map((crop) => {
        let lat = crop.location?.coords?.latitude;
        let lon = crop.location?.coords?.longitude;
        
        // If coordinates are 0,0 or invalid, generate random coordinates around user location
        if (!lat || !lon || (lat === 0 && lon === 0)) {
          // Generate random coordinates within a reasonable range around user location
          const randomLat = latitude + (Math.random() - 0.5) * 0.01; // ~500m range
          const randomLon = longitude + (Math.random() - 0.5) * 0.01;
          lat = randomLat;
          lon = randomLon;
          console.log('InteractiveMap: Using generated coordinates for crop:', {
            cropName: crop.name || crop.commodity,
            originalCoords: crop.location?.coords,
            generatedCoords: { lat, lon }
          });
        }

        // Calculate distance for marker styling
        const distance = Math.sqrt(
          Math.pow((lat - latitude) * 111319.9, 2) +
            Math.pow((lon - longitude) * 111319.9 * Math.cos((latitude * Math.PI) / 180), 2)
        );

        const isInsideRadius = distance <= radius * 1000;
        const markerColor = isInsideRadius ? "#49A760" : "#FFA500";

        return `L.marker([${lat}, ${lon}], {
          icon: L.divIcon({
            className: 'custom-crop-marker',
            html: '<div style="background-color: ${markerColor}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map).bindPopup('<div style="font-family: Arial, sans-serif;"><strong>${crop.name}</strong><br>Price: ₹${crop.pricePerUnit}<br>Distance: ${Math.round(distance)}m</div>');`;
      })
      .filter(marker => marker !== ""); // Remove empty markers
    
    console.log('InteractiveMap: Valid markers created:', selectedCropMarkers.length);
    
    const markerHtml = selectedCropMarkers.join("");

    // Choose tile layer based on map type
    const tileLayer = selectedMapType === "street"
      ? `L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 20, attribution: '© ' })`
      : `L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© ' })`;

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
            .custom-crop-marker, .custom-marker, .user-location-marker {
              background: transparent !important;
              border: none !important;
            }
            .user-location-marker {
              z-index: 1000 !important;
              pointer-events: auto !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            console.log('Initializing Leaflet map at:', ${latitude}, ${longitude});
            var map = L.map('map').setView([${latitude}, ${longitude}], ${MAP_CONFIG.DEFAULT_ZOOM});
            ${tileLayer}.addTo(map);
            console.log('Map initialized successfully');

            // Add draggable red marker (user location)
            var redMarker = L.marker([${latitude}, ${longitude}], {
              draggable: true,
              icon: L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background-color: red; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).addTo(map);

            redMarker.bindPopup('Your Location - Drag me to change search area');

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
            L.circle([${latitude}, ${longitude}], {
              color: '#49A760',
              fillColor: '#49A760',
              fillOpacity: 0.1,
              radius: ${radius * 1000}
            }).addTo(map);

            // Add crop markers
            ${markerHtml}

            console.log('Red marker, circle, and crop markers added to map');
          </script>
        </body>
      </html>
    `;
  }, [markerPosition, allCrops, selectedCrop, radius, selectedMapType]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log("WebView message received:", data);

        if (data.type === "markerMoved") {
          onMarkerMove({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      } catch (error) {
        console.error("Error parsing WebView message:", error);
      }
    },
    [onMarkerMove]
  );

  // Key for WebView re-rendering
  const webViewKey = useMemo(
    () => `map-${markerPosition?.latitude}-${markerPosition?.longitude}-${selectedCrop}-${radius}-${selectedMapType}-${allCrops.length}`,
    [markerPosition, selectedCrop, radius, selectedMapType, allCrops.length]
  );

  if (!markerPosition || !mapHtml) {
    return (
      <View style={mapStyles.mapLoading}>
        <Text style={mapStyles.mapLoadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <WebView
      key={webViewKey}
      ref={webViewRef}
      source={{ html: mapHtml }}
      style={mapStyles.map}
      scrollEnabled={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onMessage={handleWebViewMessage}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn("WebView error: ", nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn("WebView HTTP error: ", nativeEvent.statusCode);
      }}
    />
  );
});

export default InteractiveMap;
