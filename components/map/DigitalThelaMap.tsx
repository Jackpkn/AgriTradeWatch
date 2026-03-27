import React, { forwardRef, useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { StyleSheet, View, Platform } from "react-native";

export interface DTEntry {
  id: number;
  username_id: string;
  sale_commodity: string;
  variety_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  quantity_for_sale: number;
  cost: number;
  unit: string;
  photo_or_video: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface DigitalThelaMapProps {
  entries: DTEntry[];
  selectedCommodity: string | null;
  onEntrySelect?: (entry: DTEntry | null) => void;
  onUsernamePress?: (username: string) => void;
  userLocation?: UserLocation | null;
}

// Comprehensive commodity-to-emoji mapping for fruits, vegetables, grains, and more
const COMMODITY_EMOJIS: Record<string, string> = {
  // Vegetables
  potato: "🥔",
  potatoes: "🥔",
  onion: "🧅",
  onions: "🧅",
  garlic: "🧄",
  carrot: "🥕",
  carrots: "🥕",
  tomato: "🍅",
  tomatoes: "🍅",
  eggplant: "🍆",
  brinjal: "🍆",
  baingan: "🍆",
  cucumber: "🥒",
  cucumbers: "🥒",
  lettuce: "🥬",
  cabbage: "🥬",
  broccoli: "🥦",
  corn: "🌽",
  maize: "🌽",
  makka: "🌽",
  pepper: "🌶️",
  chilli: "🌶️",
  chili: "🌶️",
  mirchi: "🌶️",
  bellpepper: "🫑",
  capsicum: "🫑",
  shimla: "🫑",
  mushroom: "🍄",
  mushrooms: "🍄",
  peas: "🫛",
  matar: "🫛",
  beans: "🫘",
  leafygreens: "🥬",
  spinach: "🥬",
  palak: "🥬",
  methi: "🥬",
  beetroot: "🫒",
  radish: "🫒",
  mooli: "🫒",
  ginger: "🫚",
  adrak: "🫚",

  // Fruits
  apple: "🍎",
  apples: "🍎",
  seb: "🍎",
  greenapple: "🍏",
  banana: "🍌",
  bananas: "🍌",
  kela: "🍌",
  orange: "🍊",
  oranges: "🍊",
  santra: "🍊",
  lemon: "🍋",
  lemons: "🍋",
  nimbu: "🍋",
  lime: "🍋",
  watermelon: "🍉",
  tarbooz: "🍉",
  grapes: "🍇",
  angoor: "🍇",
  strawberry: "🍓",
  strawberries: "🍓",
  blueberry: "🫐",
  blueberries: "🫐",
  peach: "🍑",
  peaches: "🍑",
  aadu: "🍑",
  mango: "🥭",
  mangoes: "🥭",
  aam: "🥭",
  pineapple: "🍍",
  ananas: "🍍",
  coconut: "🥥",
  nariyal: "🥥",
  kiwi: "🥝",
  cherry: "🍒",
  cherries: "🍒",
  pear: "🍐",
  pears: "🍐",
  nashpati: "🍐",
  melon: "🍈",
  kharbooja: "🍈",
  papaya: "🥭",
  pomegranate: "🫐",
  anaar: "🫐",
  guava: "🍐",
  amrood: "🍐",
  fig: "🫐",
  anjeer: "🫐",
  plum: "🫐",
  aloo_bukhara: "🫐",
  custardapple: "🍏",
  sitafal: "🍏",
  jackfruit: "🍈",
  kathal: "🍈",
  litchi: "🍒",
  lychee: "🍒",

  // Grains & Cereals
  wheat: "🌾",
  gehun: "🌾",
  rice: "🍚",
  chawal: "🍚",
  paddy: "🌾",
  dhan: "🌾",
  bajra: "🌾",
  jowar: "🌾",
  ragi: "🌾",
  barley: "🌾",
  jau: "🌾",
  oats: "🌾",
  millet: "🌾",

  // Pulses & Legumes
  dal: "🫘",
  lentils: "🫘",
  masoor: "🫘",
  moong: "🫘",
  chana: "🫘",
  chickpeas: "🫘",
  rajma: "🫘",
  kidneybean: "🫘",
  soybean: "🫘",
  groundnut: "🥜",
  peanut: "🥜",
  peanuts: "🥜",
  moongfali: "🥜",

  // Cash Crops
  sugarcane: "🎋",
  ganna: "🎋",
  cotton: "🧶",
  kapas: "🧶",
  jute: "🧶",
  tobacco: "🍂",
  tea: "🍵",
  chai: "🍵",
  coffee: "☕",

  // Spices
  turmeric: "🟡",
  haldi: "🟡",
  cumin: "🟤",
  jeera: "🟤",
  coriander: "🌿",
  dhaniya: "🌿",
  mustard: "🟡",
  sarson: "🟡",

  // Others
  milk: "🥛",
  doodh: "🥛",
  egg: "🥚",
  eggs: "🥚",
  anda: "🥚",
  honey: "🍯",
  shahad: "🍯",
};

// Get emoji for a commodity, with fallback
const getCommodityEmoji = (commodity: string): string => {
  const normalized = commodity.toLowerCase().replace(/\s+/g, '');
  return COMMODITY_EMOJIS[normalized] || "🛒";
};

const DigitalThelaMap = forwardRef<WebView, DigitalThelaMapProps>(
  ({ entries, selectedCommodity, onEntrySelect, onUsernamePress, userLocation }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [mapReady, setMapReady] = useState(false);

    // Filter entries based on selected commodity
    const filteredEntries = selectedCommodity
      ? entries.filter(
          (entry) =>
            entry.sale_commodity.toLowerCase() ===
            selectedCommodity.toLowerCase()
        )
      : entries;

    // Calculate center of all entries or default to Mumbai
    const mapCenter =
      filteredEntries.length > 0
        ? {
            lat:
              filteredEntries.reduce((sum, e) => sum + e.latitude, 0) /
              filteredEntries.length,
            lng:
              filteredEntries.reduce((sum, e) => sum + e.longitude, 0) /
              filteredEntries.length,
          }
        : { lat: 19.076, lng: 72.8777 }; // Mumbai default

    useEffect(() => {
      if (mapReady && webViewRef.current) {
        // Update map when entries or selected commodity changes
        const message = {
          type: "updateEntries",
          entries: filteredEntries,
          center: mapCenter,
        };
        webViewRef.current.postMessage(JSON.stringify(message));
      }
    }, [filteredEntries, selectedCommodity, mapReady]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === "mapReady") {
          setMapReady(true);
        } else if (data.type === "entrySelected") {
          const selectedEntry = filteredEntries.find(
            (e) => e.id === data.entryId
          );
          onEntrySelect?.(selectedEntry || null);
        } else if (data.type === "mapClicked") {
          onEntrySelect?.(null);
        } else if (data.type === "usernameClicked") {
          onUsernamePress?.(data.username);
        }
      } catch (error) {
        console.error("Error parsing message from WebView:", error);
      }
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
    #map {
      height: 100%;
      width: 100%;
    }
    .custom-marker {
      background: none;
      border: none;
    }
    .emoji-marker {
      font-size: 32px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
    }
    .current-location-marker {
      width: 16px;
      height: 16px;
      background: #4285F4;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .current-location-pulse {
      position: absolute;
      width: 40px;
      height: 40px;
      background: rgba(66, 133, 244, 0.2);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }
    .marker-pin {
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      background: #9C27B0;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -20px 0 0 -15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    .marker-pin::after {
      content: '';
      width: 20px;
      height: 20px;
      margin: 5px 0 0 5px;
      background: #fff;
      position: absolute;
      border-radius: 50%;
    }
    .custom-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .popup-title {
      font-size: 16px;
      font-weight: bold;
      color: #9C27B0;
      margin-bottom: 8px;
      text-transform: capitalize;
    }
    .popup-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-size: 14px;
    }
    .popup-label {
      font-weight: 600;
      color: #666;
    }
    .popup-value {
      color: #333;
      font-weight: 500;
    }
    .popup-seller {
      background: #f3e5f5;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 8px;
      text-align: center;
      font-size: 12px;
      color: #7B1FA2;
      cursor: pointer;
    }
    .popup-seller:hover {
      background: #e1bee7;
    }
    .username-link {
      color: #9C27B0;
      font-weight: bold;
      text-decoration: underline;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let markers = [];

    // Handle username click
    function handleUsernameClick(username, event) {
      event.stopPropagation();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'usernameClicked',
        username: username
      }));
    }

    // Initialize map
    map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([${mapCenter.lat}, ${mapCenter.lng}], 5);

    // Satellite imagery layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    }).addTo(map);

    // Labels overlay layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    }).addTo(map);

    // Commodity emoji mapping
    const COMMODITY_EMOJIS = ${JSON.stringify(COMMODITY_EMOJIS)};

    // Get emoji for commodity with fallback
    function getCommodityEmoji(commodity) {
      const normalized = commodity.toLowerCase().replace(/\\s+/g, '');
      return COMMODITY_EMOJIS[normalized] || '🛒';
    }

    // Create emoji icon for a commodity
    function createEmojiIcon(commodity) {
      const emoji = getCommodityEmoji(commodity);
      return L.divIcon({
        className: 'custom-marker',
        html: '<div class="emoji-marker">' + emoji + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });
    }

    // Fallback marker icon (purple pin)
    const fallbackIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -42]
    });

    function createPopupContent(entry) {
      return \`
        <div class="custom-popup">
          <div class="popup-title">\${entry.sale_commodity}</div>
          <div class="popup-row">
            <span class="popup-label">Variety:</span>
            <span class="popup-value">\${entry.variety_name}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Quantity:</span>
            <span class="popup-value">\${entry.quantity_for_sale} \${entry.unit}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Price:</span>
            <span class="popup-value">₹\${entry.cost}/\${entry.unit}</span>
          </div>
          <div class="popup-seller" onclick="handleUsernameClick('\${entry.username_id}', event)">
            Seller: <span class="username-link">\${entry.username_id}</span>
          </div>
        </div>
      \`;
    }

    function updateMarkers(entries) {
      // Clear existing markers
      markers.forEach(marker => map.removeLayer(marker));
      markers = [];

      if (entries.length === 0) {
        return;
      }

      // Add new markers
      entries.forEach(entry => {
        const icon = createEmojiIcon(entry.sale_commodity);
        const marker = L.marker([entry.latitude, entry.longitude], {
          icon: icon
        }).addTo(map);

        marker.bindPopup(createPopupContent(entry), {
          maxWidth: 250,
          className: 'custom-popup-wrapper'
        });

        marker.on('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'entrySelected',
            entryId: entry.id
          }));
        });

        markers.push(marker);
      });

      // Fit bounds to show all markers
      if (entries.length > 0) {
        const bounds = L.latLngBounds(entries.map(e => [e.latitude, e.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }

    // Handle map click (deselect)
    map.on('click', function(e) {
      if (!e.originalEvent.target.closest('.leaflet-marker-icon')) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapClicked'
        }));
      }
    });

    // Initial entries
    const initialEntries = ${JSON.stringify(filteredEntries)};
    updateMarkers(initialEntries);

    // Listen for messages from React Native
    window.addEventListener('message', function(event) {
      const data = JSON.parse(event.data);
      if (data.type === 'updateEntries') {
        updateMarkers(data.entries);
        if (data.center) {
          map.setView([data.center.lat, data.center.lng], 5);
        }
      }
    });

    // For Android
    document.addEventListener('message', function(event) {
      const data = JSON.parse(event.data);
      if (data.type === 'updateEntries') {
        updateMarkers(data.entries);
        if (data.center) {
          map.setView([data.center.lat, data.center.lng], 5);
        }
      }
    });

    // Current location marker
    const userLocationData = ${userLocation ? JSON.stringify(userLocation) : 'null'};

    // Create blue dot icon for current location
    const currentLocationIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="current-location-pulse"></div><div class="current-location-marker"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    // Show current location if available
    if (userLocationData) {
      const currentLocationMarker = L.marker([userLocationData.latitude, userLocationData.longitude], {
        icon: currentLocationIcon,
        zIndexOffset: 1000
      }).addTo(map);

      currentLocationMarker.bindPopup('<div style="text-align:center;font-weight:600;color:#4285F4;">Your Location</div>');
    }

    // Notify React Native that map is ready
    setTimeout(() => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }, 500);
  </script>
</body>
</html>
    `;

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          onMessage={handleMessage}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          androidLayerType="hardware"
          startInLoadingState={false}
          renderToHardwareTextureAndroid={true}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

DigitalThelaMap.displayName = "DigitalThelaMap";

export default React.memo(DigitalThelaMap);
