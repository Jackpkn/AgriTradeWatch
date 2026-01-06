import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Linking,
  StyleSheet,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import WebView from "react-native-webview";

import { useGlobal } from "@/context/global-provider";
import { produceService } from "@/services";
import { useOrientation } from "@/utils/orientationUtils";
import { useTranslation } from "@/hooks/useTranslation";
import {
  COMMODITIES,
  CROP_UNITS,
  PRODUCTION_LEVELS,
} from "@/constants/appConstants";

// Types
interface ProduceFormState {
  sale_commodity: string;
  new_commodity: string;
  variety_name: string;
  level_of_produce: string;
  quantity_for_sale: string;
  cost: string;
  unit: string;
  state: string;
  district: string;
  tehsil: string;
}

interface PhotoState {
  uri: string;
  base64?: string;
  fileName?: string;
  type?: string;
}


interface LocationData {
  [state: string]: {
    [district: string]: string[];
  };
}

// Styles - created once for better performance
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fffe" },
    gradient: { flex: 1 },
    scrollContent: { paddingBottom: 24 },
    headerSection: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
    },
    headerGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 20,
      borderRadius: 12,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#fff",
      marginLeft: 12,
    },
    formContainer: {
      paddingHorizontal: 16,
    },
    formCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
      color: "#333",
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#333",
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: "#fff",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      borderRadius: 4,
      backgroundColor: "#fff",
      overflow: "hidden",
    },
    picker: {
      height: 50,
    },
    imageSection: {
      marginTop: 8,
    },
    imageHelpText: {
      fontSize: 12,
      color: "#888",
      marginBottom: 12,
    },
    imageButtons: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    imageButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderWidth: 1,
      borderColor: "#9C27B0",
      borderRadius: 8,
      gap: 8,
    },
    imageButtonText: {
      color: "#9C27B0",
      fontWeight: "600",
      fontSize: 14,
    },
    imagePreview: {
      position: "relative",
      marginTop: 12,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    previewImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
    },
    removeImageButton: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 4,
    },
    imageInfo: {
      padding: 8,
      backgroundColor: "#f8f9fa",
    },
    imageInfoText: {
      fontSize: 12,
      color: "#666",
    },
    submitButton: {
      marginTop: 24,
      borderRadius: 8,
      overflow: "hidden",
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#fff",
    },
    footerInfo: {
      marginTop: 16,
      gap: 4,
    },
    footerText: {
      fontSize: 12,
      color: "#888",
      textAlign: "center",
    },
    cameraContainer: {
      flex: 1,
      backgroundColor: "#000",
    },
    camera: {
      flex: 1,
    },
    cameraControls: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    captureButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#fff",
      borderWidth: 5,
      borderColor: "#9C27B0",
    },
    cameraCloseButton: {
      position: "absolute",
      top: 40,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      padding: 8,
    },
    mapContainer: {
      marginTop: 8,
      height: 300,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    confirmLocationButton: {
      marginTop: 12,
      borderRadius: 8,
      overflow: "hidden",
    },
    confirmLocationGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 8,
    },
    confirmLocationText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    locationConfirmedText: {
      fontSize: 12,
      color: "#4caf50",
      marginTop: 8,
      textAlign: "center",
      fontWeight: "600",
    },
  });

// Location data from Django
const LOCATION_DATA: LocationData = JSON.parse('{\u0022Maharashtra\u0022: {\u0022Pune\u0022: [\u0022Haveli\u0022, \u0022Khed\u0022, \u0022Mawal\u0022, \u0022Mulshi\u0022, \u0022Baramati\u0022, \u0022Indapur\u0022, \u0022Junnar\u0022, \u0022Shirur\u0022, \u0022Purandar\u0022, \u0022Ambegaon\u0022], \u0022Satara\u0022: [\u0022Satara\u0022, \u0022Wai\u0022, \u0022Karad\u0022, \u0022Koregaon\u0022, \u0022Jaoli\u0022, \u0022Khatav\u0022, \u0022Man\u0022, \u0022Phaltan\u0022, \u0022Mahabaleshwar\u0022, \u0022Patan\u0022], \u0022Ahmednagar\u0022: [\u0022Nagar\u0022, \u0022Sangamner\u0022, \u0022Shrigonda\u0022, \u0022Pathardi\u0022, \u0022Parner\u0022, \u0022Rahata\u0022, \u0022Rahuri\u0022, \u0022Shevgaon\u0022, \u0022Akole\u0022, \u0022Kopargaon\u0022], \u0022Nashik\u0022: [\u0022Nashik\u0022, \u0022Trimbakeshwar\u0022, \u0022Igatpuri\u0022, \u0022Dindori\u0022, \u0022Peth\u0022, \u0022Kalwan\u0022, \u0022Baglan (Satana)\u0022, \u0022Niphad\u0022, \u0022Sinnar\u0022, \u0022Yeola\u0022, \u0022Chandwad\u0022, \u0022Deola\u0022], \u0022Aurangabad (Chhatrapati Sambhajinagar)\u0022: [\u0022Aurangabad\u0022, \u0022Phulambri\u0022, \u0022Sillod\u0022, \u0022Kannad\u0022, \u0022Vaijapur\u0022, \u0022Gangapur\u0022, \u0022Paithan\u0022, \u0022Khuldabad\u0022, \u0022Soegaon\u0022], \u0022Nagpur\u0022: [\u0022Nagpur\u0022, \u0022Hingna\u0022, \u0022Kalameshwar\u0022, \u0022Kamptee\u0022, \u0022Katol\u0022, \u0022Narkhed\u0022, \u0022Ramtek\u0022, \u0022Mouda\u0022, \u0022Parseoni\u0022, \u0022Umred\u0022, \u0022Kuhi\u0022, \u0022Bhiwapur\u0022], \u0022Amravati\u0022: [\u0022Amravati\u0022, \u0022Bhatkuli\u0022, \u0022Daryapur\u0022, \u0022Nandgaon Khandeshwar\u0022, \u0022Chandur Railway\u0022, \u0022Chandur Bazar\u0022, \u0022Morshi\u0022, \u0022Warud\u0022, \u0022Achalpur\u0022, \u0022Anjangaon Surji\u0022, \u0022Dharni\u0022, \u0022Chikhaldara\u0022], \u0022Kolhapur\u0022: [\u0022Karvir\u0022, \u0022Panhala\u0022, \u0022Shahuwadi\u0022, \u0022Kagal\u0022, \u0022Hatkanangale\u0022, \u0022Shirol\u0022, \u0022Radhanagari\u0022, \u0022Gaganbawada\u0022, \u0022Ajra\u0022, \u0022Bhudargad\u0022, \u0022Chandgad\u0022, \u0022Gadhinglaj\u0022], \u0022Solapur\u0022: [\u0022Solapur North\u0022, \u0022Solapur South\u0022, \u0022Barshi\u0022, \u0022Akkalkot\u0022, \u0022Mohol\u0022, \u0022Pandharpur\u0022, \u0022Malshiras\u0022, \u0022Sangole\u0022, \u0022Mangalwedha\u0022, \u0022Madha\u0022, \u0022Karmala\u0022], \u0022Thane\u0022: [\u0022Thane\u0022, \u0022Kalyan\u0022, \u0022Murbad\u0022, \u0022Bhiwandi\u0022, \u0022Shahapur\u0022, \u0022Ulhasnagar\u0022, \u0022Ambarnath\u0022, \u0022Palghar (old tehsil, now district)\u0022, \u0022Vasai\u0022], \u0022Mumbai Suburban\u0022: [\u0022Andheri\u0022, \u0022Borivali\u0022, \u0022Kurla\u0022], \u0022Raigad\u0022: [\u0022Alibag\u0022, \u0022Panvel\u0022, \u0022Uran\u0022, \u0022Karjat\u0022, \u0022Khalapur\u0022, \u0022Pen\u0022, \u0022Sudhagad (Pali)\u0022, \u0022Roha\u0022, \u0022Tala\u0022, \u0022Mangaon\u0022, \u0022Mahad\u0022, \u0022Murud\u0022, \u0022Shrivardhan\u0022, \u0022Poladpur\u0022], \u0022Sangli\u0022: [\u0022Miraj\u0022, \u0022Walwa (Islampur)\u0022, \u0022Shirala\u0022, \u0022Khanapur (Vita)\u0022, \u0022Atpadi\u0022, \u0022Tasgaon\u0022, \u0022Palus\u0022, \u0022Kadegaon\u0022, \u0022Jath\u0022], \u0022Jalgaon\u0022: [\u0022Jalgaon\u0022, \u0022Jamner\u0022, \u0022Erandol\u0022, \u0022Dharangaon\u0022, \u0022Bhusawal\u0022, \u0022Raver\u0022, \u0022Muktainagar\u0022, \u0022Bodwad\u0022, \u0022Chopda\u0022, \u0022Yawal\u0022, \u0022Amalner\u0022, \u0022Parola\u0022, \u0022Pachora\u0022, \u0022Bhadgaon\u0022, \u0022Chalisgaon\u0022], \u0022Jalna\u0022: [\u0022Jalna\u0022, \u0022Bhokardan\u0022, \u0022Jafrabad\u0022, \u0022Badnapur\u0022, \u0022Ambad\u0022, \u0022Partur\u0022, \u0022Mantha\u0022, \u0022Ghansawangi\u0022], \u0022Parbhani\u0022: [\u0022Parbhani\u0022, \u0022Gangakhed\u0022, \u0022Sonpeth\u0022, \u0022Pathri\u0022, \u0022Manwat\u0022, \u0022Purna\u0022, \u0022Palam\u0022, \u0022Jintur\u0022, \u0022Selu\u0022], \u0022Nanded\u0022: [\u0022Nanded\u0022, \u0022Ardhapur\u0022, \u0022Mudkhed\u0022, \u0022Bhokar\u0022, \u0022Umri\u0022, \u0022Loha\u0022, \u0022Kandhar\u0022, \u0022Kinwat\u0022, \u0022Himayatnagar\u0022, \u0022Hadgaon\u0022, \u0022Mahur\u0022, \u0022Deglur\u0022, \u0022Mukhed\u0022, \u0022Dharmabad\u0022, \u0022Biloli\u0022], \u0022Beed\u0022: [\u0022Beed\u0022, \u0022Ashti\u0022, \u0022Patoda\u0022, \u0022Shirur Kasar\u0022, \u0022Georai\u0022, \u0022Manjlegaon\u0022, \u0022Wadwani\u0022, \u0022Kaij\u0022, \u0022Dharur\u0022, \u0022Parli\u0022, \u0022Ambejogai\u0022], \u0022Latur\u0022: [\u0022Latur\u0022, \u0022Renapur\u0022, \u0022Ahmadpur\u0022, \u0022Jalkot\u0022, \u0022Chakur\u0022, \u0022Shirur Anantpal\u0022, \u0022Ausa\u0022, \u0022Nilanga\u0022, \u0022Deoni\u0022, \u0022Udgir\u0022], \u0022Dhule\u0022: [\u0022Dhule\u0022, \u0022Sakri\u0022, \u0022Shirpur\u0022, \u0022Sindkheda\u0022], \u0022Bhandara\u0022: [\u0022Bhandara\u0022, \u0022Tumsar\u0022, \u0022Pauni\u0022, \u0022Mohadi\u0022, \u0022Sakoli\u0022, \u0022Lakhani\u0022, \u0022Lakhandur\u0022], \u0022Gondia\u0022: [\u0022Gondia\u0022, \u0022Tirora\u0022, \u0022Goregaon\u0022, \u0022Arjuni Morgaon\u0022, \u0022Deori\u0022, \u0022Sadak Arjuni\u0022, \u0022Amgaon\u0022, \u0022Salekasa\u0022], \u0022Chandrapur\u0022: [\u0022Chandrapur\u0022, \u0022Ballarpur\u0022, \u0022Mul\u0022, \u0022Saoli\u0022, \u0022Sindewahi\u0022, \u0022Brahmapuri\u0022, \u0022Nagbhir\u0022, \u0022Chimur\u0022, \u0022Bhadravati\u0022, \u0022Warora\u0022, \u0022Rajura\u0022, \u0022Korpana\u0022, \u0022Jiwati\u0022, \u0022Pombhurna\u0022, \u0022Gondpipri\u0022], \u0022Yavatmal\u0022: [\u0022Yavatmal\u0022, \u0022Arni\u0022, \u0022Babhulgaon\u0022, \u0022Kalamb\u0022, \u0022Darwha\u0022, \u0022Digras\u0022, \u0022Ner\u0022, \u0022Pusad\u0022, \u0022Umarkhed\u0022, \u0022Maregaon\u0022, \u0022Zari Jamani\u0022, \u0022Wani\u0022, \u0022Ralegaon\u0022, \u0022Ghatanji\u0022, \u0022Kelapur (Pandharkawada)\u0022]}}');

const AddProduce: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { currentLocation, setIsLoading, isLogged } = useGlobal();

  const [formData, setFormData] = useState<ProduceFormState>({
    sale_commodity: "",
    new_commodity: "",
    variety_name: "",
    level_of_produce: "selling_surplus",
    quantity_for_sale: "",
    cost: "",
    unit: "",
    state: "",
    district: "",
    tehsil: "",
  });

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{latitude: number; longitude: number} | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Computed values for location dropdowns
  const availableStates = useMemo(() => Object.keys(LOCATION_DATA), []);

  const availableDistricts = useMemo(() => {
    if (!formData.state || !LOCATION_DATA[formData.state]) return [];
    return Object.keys(LOCATION_DATA[formData.state]);
  }, [formData.state]);

  const availableTehsils = useMemo(() => {
    if (!formData.state || !formData.district || !LOCATION_DATA[formData.state]?.[formData.district]) return [];
    return LOCATION_DATA[formData.state][formData.district];
  }, [formData.state, formData.district]);

  // Initialize marker position from current location
  useEffect(() => {
    if (currentLocation && !markerPosition) {
      setMarkerPosition({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation, markerPosition]);

  // Handle hardware back button - navigate to Home instead of exiting app
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Navigate to Main (Home) screen instead of exiting the app
      navigation.navigate('Main' as never);
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(
        cameraStatus.status === "granted" && mediaStatus.status === "granted"
      );
    })();
  }, []);

  const handleTakePicture = useCallback(async () => {
    if (cameraRef.current) {
      const takenPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        exif: false,
      });

      if (takenPhoto) {
        const fileName = `produce_${formData.sale_commodity || "unknown"}_${Date.now()}.jpg`;
        const mimeType = "image/jpeg";

        setPhoto({
          uri: takenPhoto.uri,
          base64: takenPhoto.base64 ?? "",
          fileName,
          type: mimeType,
        });
        setIsCameraOpen(false);

        try {
          await MediaLibrary.saveToLibraryAsync(takenPhoto.uri);
        } catch (error) {
          console.warn("Failed to save image to library:", error);
        }
      }
    }
  }, [formData.sale_commodity]);

  const handlePickImage = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(
        t.common.required,
        "Please grant camera and media library access in your device settings."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName =
        asset.fileName || `produce_${formData.sale_commodity || "unknown"}_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || "image/jpeg";

      setPhoto({
        uri: asset.uri,
        base64: "",
        fileName,
        type: mimeType,
      });
    }
  }, [hasPermission, formData.sale_commodity, t]);

  const updateField = useCallback((field: keyof ProduceFormState, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Reset dependent fields when parent changes
      if (field === 'state') {
        updated.district = '';
        updated.tehsil = '';
      } else if (field === 'district') {
        updated.tehsil = '';
      }

      return updated;
    });
  }, []);

  // Generate map HTML
  const mapHtml = useMemo(() => {
    if (!markerPosition) return "";

    const { latitude, longitude } = markerPosition;

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
            .location-marker {
              background: transparent !important;
              border: none !important;
              z-index: 1000 !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map', {
              zoomControl: true
            }).setView([${latitude}, ${longitude}], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
              maxZoom: 20,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            var locationMarker = L.marker([${latitude}, ${longitude}], {
              draggable: true,
              icon: L.divIcon({
                className: 'location-marker',
                html: '<div style="position: relative; width: 30px; height: 30px;"><div style="background: #9C27B0; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.6); position: absolute; top: 0; left: 3px;"></div><div style="background: white; width: 8px; height: 8px; border-radius: 50%; position: absolute; top: 5px; left: 11px; z-index: 1;"></div></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })
            }).addTo(map);

            locationMarker.bindPopup('<div style="font-family: Arial, sans-serif; text-align: center;"><strong>📍 Your Location</strong><br><small>Drag to adjust</small></div>');

            locationMarker.on('dragend', function(event) {
              var position = locationMarker.getLatLng();
              locationMarker.bindPopup('<div style="font-family: Arial, sans-serif; text-align: center;"><strong>📍 Location Updated</strong><br><small>Lat: ' + position.lat.toFixed(4) + '</small><br><small>Lng: ' + position.lng.toFixed(4) + '</small></div>').openPopup();

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerMoved',
                latitude: position.lat,
                longitude: position.lng
              }));
            });
          </script>
        </body>
      </html>
    `;
  }, [markerPosition]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerMoved") {
        setMarkerPosition({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        setLocationConfirmed(false); // Reset confirmation when marker moves
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  }, []);

  const handleConfirmLocation = useCallback(() => {
    if (markerPosition) {
      setLocationConfirmed(true);
      Alert.alert(
        t.common.success || "Success",
        "Location confirmed successfully!",
        [{ text: t.common.ok || "OK" }]
      );
    } else {
      Alert.alert(
        t.common.error || "Error",
        "Please select a location on the map",
        [{ text: t.common.ok || "OK" }]
      );
    }
  }, [markerPosition, t]);

  const validateForm = useCallback((): boolean => {
    if (
      !formData.sale_commodity ||
      !formData.variety_name ||
      !formData.unit
    ) {
      Alert.alert(t.common.error, t.digitalThela.fillAllFields || "Please fill all required fields");
      return false;
    }

    const quantity = parseFloat(formData.quantity_for_sale);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(t.common.error, t.digitalThela.validQuantity || "Please enter a valid quantity");
      return false;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert(t.common.error, t.digitalThela.validCost || "Please enter a valid cost");
      return false;
    }

    return true;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    if (!isLogged) {
      Alert.alert(
        t.auth.authRequired,
        t.auth.authRequiredMessage,
        [
          { text: t.auth.login, onPress: () => navigation.navigate("Login" as never) },
          { text: t.common.cancel, style: "cancel" },
        ]
      );
      return;
    }

    if (!validateForm()) return;

    if (!currentLocation) {
      Alert.alert(
        t.auth.locationRequired,
        t.crops.locationRequiredMessage || "Location is required to add produce",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: t.common.cancel, style: "cancel" },
        ]
      );
      return;
    }

    // If photo is attached, location must be confirmed
    if (photo && !locationConfirmed) {
      Alert.alert(
        "Location Required",
        "Please confirm your location on the map before uploading a photo.",
        [{ text: t.common.ok || "OK" }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Use confirmed location or current location
      // Round to 6 decimal places (approx 0.11m precision) to avoid "too many digits" error
      const finalLatitude = parseFloat((markerPosition?.latitude || currentLocation.latitude).toFixed(6));
      const finalLongitude = parseFloat((markerPosition?.longitude || currentLocation.longitude).toFixed(6));

      const payload: any = {
        sale_commodity: formData.sale_commodity || "",
        new_commodity: formData.new_commodity || "",
        variety_name: formData.variety_name || "",
        method: "organic", // Default
        level_of_produce: formData.level_of_produce || "",
        sowing_date: new Date().toISOString().split("T")[0],
        harvest_date: new Date().toISOString().split("T")[0],
        quantity_for_sale: formData.quantity_for_sale ? parseFloat(formData.quantity_for_sale) : "",
        cost: formData.cost ? parseFloat(formData.cost) : "",
        unit: formData.unit || "",
        produce_expense: 0,
        profit_expectation: 0,
        latitude: finalLatitude,
        longitude: finalLongitude,
        location_confirmed: locationConfirmed,
        state: formData.state || "",
        district: formData.district || "",
        tehsil: formData.tehsil || "",
      };

      if (photo) {
        console.log("📸 Photo available, adding to payload:", {
          uri: photo.uri,
          name: photo.fileName,
          type: photo.type,
        });

        payload.photo_or_video = {
          uri: photo.uri,
          name: photo.fileName || `produce_${Date.now()}.jpg`,
          type: photo.type || "image/jpeg",
        };
      } else {
        console.log("📸 No photo selected, submitting without image");
      }

      const response = await produceService.submitProduce(payload);

      if (response.success) {
        Alert.alert(
          t.common.success,
          t.digitalThela.submissionSuccess || "Your produce has been added successfully!",
          [
            {
              text: t.common.ok,
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t.digitalThela.submissionError || "Submission Error",
          response.error || t.digitalThela.submissionFailed || "Failed to submit produce"
        );
      }
    } catch (error: any) {
      console.error("Produce submission error:", error);
      Alert.alert(
        t.digitalThela.submissionError || "Submission Error",
        error.message || "Failed to submit produce. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, currentLocation, isLogged, setIsLoading, photo, t, navigation, markerPosition, locationConfirmed, validateForm]);

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePicture}
            accessible={true}
            accessibilityLabel="Take picture"
          />
          <TouchableOpacity
            style={styles.cameraCloseButton}
            onPress={() => setIsCameraOpen(false)}
            accessible={true}
            accessibilityLabel="Close camera"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f8fffe", "#eafbe7"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <LinearGradient
              colors={["#9C27B0", "#7B1FA2"]}
              style={styles.headerGradient}
            >
              <Ionicons name="add-circle" size={32} color="#fff" />
              <Text style={styles.headerTitle}>
                {t.digitalThela.addProduce || "Add Produce Details"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {t.digitalThela.produceInformation || "Produce Information"}
              </Text>

              {/* Commodity Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.selectCommodity || "Commodity"} *
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                  <Picker
                    selectedValue={formData.sale_commodity}
                    onValueChange={(value) => updateField("sale_commodity", value)}
                    style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                    dropdownIconColor="#000"
                  >
                    <Picker.Item
                      label={t.digitalThela.chooseCommodity || "Select a commodity"}
                      value=""
                      color="#666"
                      enabled={false}
                      style={{ backgroundColor: "#fff" }}
                    />
                    {COMMODITIES.map((commodity) => (
                      <Picker.Item
                        key={commodity}
                        label={commodity}
                        value={commodity.toLowerCase()}
                        color="#000"
                        style={{ backgroundColor: "#fff" }}
                      />
                    ))}
                    <Picker.Item
                      key="other"
                      label="Other"
                      value="other"
                      color="#000"
                      style={{ backgroundColor: "#fff" }}
                    />
                  </Picker>
                </View>
              </View>

              {/* New Commodity (Optional) - Only shown when "Other" is selected */}
              {formData.sale_commodity === "other" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    New Commodity (Optional)
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={formData.new_commodity}
                    onChangeText={(value) => updateField("new_commodity", value)}
                    placeholder="Enter new commodity if not in list"
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#9C27B0"
                  />
                </View>
              )}

              {/* Variety Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.varietyName || "Variety Name"} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  value={formData.variety_name}
                  onChangeText={(value) => updateField("variety_name", value)}
                  placeholder={t.digitalThela.enterVarietyName || "Enter variety name"}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#9C27B0"
                />
              </View>

              {/* Production Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.productionLevel || "Production Level"} *
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                  <Picker
                    selectedValue={formData.level_of_produce}
                    onValueChange={(value) =>
                      updateField("level_of_produce", value)
                    }
                    style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                    dropdownIconColor="#000"
                  >
                    {PRODUCTION_LEVELS.map((level) => (
                      <Picker.Item
                        key={level.id}
                        label={level.label}
                        value={level.id}
                        color="#000"
                        style={{ backgroundColor: "#fff" }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Quantity for Sale */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.quantityForSale || "Quantity for Sale"} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  value={formData.quantity_for_sale}
                  onChangeText={(value) =>
                    updateField("quantity_for_sale", value)
                  }
                  placeholder={t.digitalThela.enterQuantity || "Enter quantity"}
                  keyboardType="numeric"
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#9C27B0"
                />
              </View>

              {/* Cost per Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.costPerUnit || "Cost per Unit"} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  mode="outlined"
                  value={formData.cost}
                  onChangeText={(value) => updateField("cost", value)}
                  placeholder={t.digitalThela.enterCostPerUnit || "Enter cost per unit"}
                  keyboardType="numeric"
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#9C27B0"
                />
              </View>

              {/* Unit Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.selectUnit || "Unit"} *
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                  <Picker
                    selectedValue={formData.unit}
                    onValueChange={(value) => updateField("unit", value)}
                    style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                    dropdownIconColor="#000"
                  >
                    <Picker.Item
                      label={t.digitalThela.chooseUnit || "Select a unit"}
                      value=""
                      enabled={false}
                      color="#666"
                      style={{ backgroundColor: "#fff" }}
                    />
                    {CROP_UNITS.map((unit) => (
                      <Picker.Item
                        key={unit.id}
                        label={unit.label}
                        value={unit.id}
                        color="#000"
                        style={{ backgroundColor: "#fff" }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* State Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                  <Picker
                    selectedValue={formData.state}
                    onValueChange={(value) => updateField("state", value)}
                    style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                    dropdownIconColor="#000"
                  >
                    <Picker.Item label="-- Select State --" value="" color="#666" style={{ backgroundColor: "#fff" }} />
                    {availableStates.map((state) => (
                      <Picker.Item key={state} label={state} value={state} color="#000" style={{ backgroundColor: "#fff" }} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* District Picker */}
              {formData.state && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>District</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                    <Picker
                      selectedValue={formData.district}
                      onValueChange={(value) => updateField("district", value)}
                      style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                      dropdownIconColor="#000"
                    >
                      <Picker.Item label="-- Select District --" value="" color="#666" style={{ backgroundColor: "#fff" }} />
                      {availableDistricts.map((district) => (
                        <Picker.Item key={district} label={district} value={district} color="#000" style={{ backgroundColor: "#fff" }} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              {/* Tehsil Picker */}
              {formData.district && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tehsil</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                    <Picker
                      selectedValue={formData.tehsil}
                      onValueChange={(value) => updateField("tehsil", value)}
                      style={[styles.picker, { backgroundColor: "#fff", color: "#000" }]}
                      dropdownIconColor="#000"
                    >
                      <Picker.Item label="-- Select Tehsil --" value="" color="#666" style={{ backgroundColor: "#fff" }} />
                      {availableTehsils.map((tehsil) => (
                        <Picker.Item key={tehsil} label={tehsil} value={tehsil} color="#000" style={{ backgroundColor: "#fff" }} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              {/* Location Map */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Drag the marker OR choose district and Tehsil to change the location
                </Text>
                {currentLocation && markerPosition && (
                  <>
                    <View style={styles.mapContainer}>
                      <WebView
                        originWhitelist={["*"]}
                        source={{ html: mapHtml }}
                        style={{ flex: 1 }}
                        onMessage={handleWebViewMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.confirmLocationButton}
                      onPress={handleConfirmLocation}
                    >
                      <LinearGradient
                        colors={["#4caf50", "#388e3c"]}
                        style={styles.confirmLocationGradient}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.confirmLocationText}>Confirm Location</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {locationConfirmed && (
                      <Text style={styles.locationConfirmedText}>
                        ✓ Location confirmed
                      </Text>
                    )}
                  </>
                )}
              </View>

              {/* Photo Section */}
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>
                  {t.digitalThela.addPhotoVideo || "Photo / Video (optional)"}
                </Text>
                <Text style={styles.imageHelpText}>
                  {t.digitalThela.addPhotoVideoMessage ||
                    "Add a photo to help buyers see your produce"}
                </Text>

                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={() => setIsCameraOpen(true)}
                    accessible={true}
                    accessibilityLabel="Take photo with camera"
                  >
                    <Ionicons name="camera" size={24} color="#9C27B0" />
                    <Text style={styles.imageButtonText}>
                      {t.digitalThela.takePhoto || "Take Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {photo && (
                  <View style={styles.imagePreview}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setPhoto(null)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color="#ff6b6b"
                      />
                    </TouchableOpacity>
                    <View style={styles.imageInfo}>
                      <Text style={styles.imageInfoText}>
                        {t.digitalThela.photoAttached?.replace(
                          "{{fileName}}",
                          photo.fileName || "Image selected"
                        ) || `Photo: ${photo.fileName || "selected"}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <LinearGradient
                  colors={["#9C27B0", "#7B1FA2"]}
                  style={styles.submitGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {t.digitalThela.submitProduce || "Submit Produce"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerInfo}>
                <Text style={styles.footerText}>
                  {t.digitalThela.requiredFields || "* Required fields"}
                </Text>
                <Text style={styles.footerText}>
                  {currentLocation
                    ? t.crops.locationDetected || "✓ Location detected"
                    : t.crops.locationRequired || "Location is required"}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AddProduce;
