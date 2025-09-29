import axios from "axios";
import { getStoredToken } from "@/services";

// --- Interfaces ---
interface AddCropPayload {
  commodity: string;
  buyingprice: number;
  quantitybought: number;
  unit: string;
  latitude: number;
  longitude: number;
  date?: string;
  image?: {
    uri: string;
    name: string;
    type: string;
  };
}

interface CropApiResponse {
  id: string;
  commodity: string;
  buyingprice: number;
  quantitybought: number;
  unit: string;
  date: string;
  latitude: number;
  longitude: number;
  userid: string;
  image?: string;
}

// --- Main function ---
export const addCrop = async (
  cropData: AddCropPayload
): Promise<CropApiResponse> => {
  const API_URL = "https://mandigo.in/api/crops/add/";

  try {
    console.log("🌾 Preparing Axios request");

    const token = await getStoredToken();
    if (!token) throw new Error("Authentication token not found.");

    // --- Create FormData ---
    const formData = new FormData();

    // Append fields exactly as your Consumer1 model expects
    formData.append("commodity", cropData.commodity);
    formData.append("buyingprice", cropData.buyingprice.toString());
    formData.append("quantitybought", cropData.quantitybought.toString());
    formData.append("unit", cropData.unit);
    formData.append("latitude", cropData.latitude.toString());
    formData.append("longitude", cropData.longitude.toString());

    if (cropData.date) {
      formData.append("date", cropData.date);
    }

    // --- SIMPLE Image Handling ---
    if (cropData.image?.uri) {
      console.log("📸 Adding image file");

      // Simple approach - just append the file directly
      formData.append("image", {
        uri: cropData.image.uri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);
    }

    // --- Axios config ---
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    };

    console.log(`📤 Sending POST to: ${API_URL}`);

    // --- API Call ---
    const response = await axios.post(API_URL, formData, config);

    console.log("✅ Crop added successfully:", response.data);
    return response.data as CropApiResponse;
  } catch (error: any) {
    console.error("❌ Crop submission error:", error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);

      throw new Error(
        `Server error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    } else {
      throw new Error(error.message || "Failed to submit crop data.");
    }
  }
};
