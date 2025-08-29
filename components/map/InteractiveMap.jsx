import React, { useMemo, useRef, useCallback } from "react";
import { View, Text } from "react-native";
import WebView from "react-native-webview";
import { CROP_OPTIONS, MAP_CONFIG } from "../../constants/mapConfig";
import { mapStyles } from "./mapStyles";

const InteractiveMap = ({
  markerPosition,
  allCrops,
  radius,
  selectedCrop,
  selectedMapType,
  onMarkerMove,
}) => {
  const webViewRef = useRef(null);

  // Generate map HTML with optimized key for better performance
  const mapHtml = useMemo(() => {
    if (!markerPosition) return "";

    const { latitude, longitude } = markerPosition;

    // Filter and process crop markers
    const selectedCropMarkers = allCrops
      .filter((crop) => crop.name?.toLowerCase() === selectedCrop.toLowerCase())
      .map((crop) => {
        const lat = crop.location?.coords?.latitude;
        const lon = crop.location?.coords?.longitude;
        if (!lat || !lon) return "";

        // Calculate distance for marker styling
        const distance = Math.sqrt(
          Math.pow((lat - latitude) * 111319.9, 2) +
            Math.pow(
              (lon - longitude) *
                111319.9 *
                Math.cos((latitude * Math.PI) / 180),
              2
            )
        );

        const isInsideRadius = distance <= radius * 1000;
        const markerColor = isInsideRadius
          ? MAP_CONFIG.COLORS.INSIDE_RADIUS
          : MAP_CONFIG.COLORS.OUTSIDE_RADIUS;

        return `
        L.marker([${lat}, ${lon}], {
          icon: L.divIcon({
            className: 'custom-crop-marker',
            html: '<div style="background-color: ${markerColor}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); ${
          isInsideRadius
            ? "box-shadow: 0 0 0 3px " +
              MAP_CONFIG.COLORS.INSIDE_RADIUS +
              ", 0 2px 6px rgba(0,0,0,0.4);"
            : ""
        }"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        })
          .addTo(map)
          .bindPopup('<div style="font-family: Arial, sans-serif; max-width: 220px;"><strong>${
            CROP_OPTIONS.find((c) => c.value === selectedCrop)?.icon
          } ${crop.name}</strong><br>Price: ₹${
          crop.pricePerUnit
        }<br>Quantity: ${
          crop.quantity
        }<br><span style="color: ${markerColor}; font-weight: bold; font-size: 14px;">${
          isInsideRadius ? "✅ Inside Radius" : "📍 Outside Radius"
        }</span><br><small>Distance: ${Math.round(
          distance
        )}m from you</small></div>');
      `;
      })
      .join("");

    // Choose tile layer based on map type
    const tileLayer =
      selectedMapType === "street"
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
            .custom-crop-marker, .custom-marker {
              background: transparent !important;
              border: none !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${latitude}, ${longitude}], ${
      MAP_CONFIG.DEFAULT_ZOOM
    });
            ${tileLayer}.addTo(map);

            // Add draggable red marker
            var redMarker = L.marker([${latitude}, ${longitude}], {
              draggable: true,
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: ${
                  MAP_CONFIG.COLORS.USER_LOCATION
                }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
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
              color: '${MAP_CONFIG.COLORS.PRIMARY}',
              fillColor: '${MAP_CONFIG.COLORS.PRIMARY}',
              fillOpacity: 0.1,
              radius: ${radius * 1000}
            }).addTo(map);

            // Add crop markers
            ${selectedCropMarkers}

            // Listen for radius updates
            window.addEventListener('message', function(event) {
              try {
                var data = JSON.parse(event.data);
                if (data.type === 'updateRadius') {
                  map.removeLayer(radiusCircle);
                  radiusCircle = L.circle([${latitude}, ${longitude}], {
                    color: '${MAP_CONFIG.COLORS.PRIMARY}',
                    fillColor: '${MAP_CONFIG.COLORS.PRIMARY}',
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
  }, [markerPosition, allCrops, radius, selectedCrop, selectedMapType]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
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

  // Optimized key for WebView re-rendering
  const webViewKey = useMemo(
    () =>
      `${markerPosition?.latitude}-${markerPosition?.longitude}-${selectedMapType}`,
    [markerPosition?.latitude, markerPosition?.longitude, selectedMapType]
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
};

export default InteractiveMap;
