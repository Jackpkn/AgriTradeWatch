import React, { useMemo, useRef, useCallback, ForwardedRef } from "react";
import { View, Text } from "react-native";
import WebView from "react-native-webview";
import { MAP_CONFIG } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";

// Type definitions
interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface Location {
  coords: LocationCoords;
}

interface Crop {
  name?: string;
  commodity?: string;
  pricePerUnit?: number;
  location?: Location;
}

interface MarkerPosition {
  latitude: number;
  longitude: number;
}

interface InteractiveMapProps {
  markerPosition: MarkerPosition | null;
  allCrops: Crop[];
  radius: number;
  selectedCrop: string;
  selectedMapType: string;
  onMarkerMove: (position: MarkerPosition) => void;
}

interface WebViewMessage {
  type: string;
  latitude: number;
  longitude: number;
}

const InteractiveMap = React.forwardRef((
  {
    markerPosition,
    allCrops,
    radius,
    selectedCrop,
    selectedMapType,
    onMarkerMove,
  }: InteractiveMapProps,
  ref: ForwardedRef<WebView>
) => {
  // Use forwarded ref or create local ref
  const localWebViewRef = useRef<WebView>(null);
  const webViewRef = ref || localWebViewRef;

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

      // If coordinates are 0,0 or invalid, skip this crop
      if (!lat || !lon || (lat === 0 && lon === 0)) {
        console.warn('InteractiveMap: Crop has invalid coordinates, skipping:', {
          cropName: crop.name || crop.commodity,
          originalCoords: crop.location?.coords
        });
        return ""; // Return empty string to filter out invalid markers
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
    (event: any) => {
      try {
        const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
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

  // Debug logging
  console.log('InteractiveMap render check:', {
    hasMarkerPosition: !!markerPosition,
    markerPosition,
    hasMapHtml: !!mapHtml,
    mapHtmlLength: mapHtml?.length || 0,
    allCropsLength: allCrops.length,
    selectedCrop
  });

  if (!markerPosition) {
    console.log('InteractiveMap: No marker position, using default location');
    // Use default location (Delhi, India) if no position is available
    const defaultPosition = { latitude: 28.6139, longitude: 77.2090 };
    return (
      <View style={mapStyles.mapLoading}>
        <Text style={mapStyles.mapLoadingText}>Loading Map...</Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
          Using default location. Please enable location services for better experience.
        </Text>
      </View>
    );
  }

  if (!mapHtml) {
    console.log('InteractiveMap: No map HTML generated');
    return (
      <View style={mapStyles.mapLoading}>
        <Text style={mapStyles.mapLoadingText}>Preparing Map...</Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
          Generating map content...
        </Text>
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
        console.error("WebView error: ", nativeEvent);
        // You could set an error state here to show a retry button
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error("WebView HTTP error: ", nativeEvent.statusCode);
      }}
      onLoadStart={() => console.log('Map loading started...')}
      onLoadEnd={() => console.log('Map loading completed')}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={mapStyles.mapLoading}>
          <Text style={mapStyles.mapLoadingText}>Loading Map...</Text>
        </View>
      )}
    />
  );
});

export default InteractiveMap;