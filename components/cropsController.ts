import axios from "axios";
import { getStoredToken } from "@/services";

// --- Interfaces ---
interface AddCropPayload {
  commodity: string;
  quantity: number;
  price: number;
  latitude: number;
  longitude: number;
  date?: string;
  variety?: string;
  unit?: string;
  userRole: "farmer" | "consumer";
}

interface CropApiResponse {
  id: string;
  commodity: string;
  quantity: number;
  price: number;
  date: string;
  latitude: number;
  longitude: number;
  variety?: string;
  userid: string;
}

// --- Main function ---
export const addCrop = async (
  cropData: AddCropPayload
): Promise<CropApiResponse> => {
  const API_URL = "https://mandigo.in/api/crops/add/";

  try {
    console.log("Preparing Axios request");

    const token = await getStoredToken();
    if (!token) throw new Error("Authentication token not found.");

    // --- Create JSON payload with role-specific field names ---
    const payload: Record<string, any> = {
      commodity: cropData.commodity,
      latitude: cropData.latitude,
      longitude: cropData.longitude,
    };

    // Map field names based on user role
    if (cropData.userRole === "farmer") {
      payload.sellingprice = cropData.price;
      payload.quantitysold = cropData.quantity;
    } else if (cropData.userRole === "consumer") {
      payload.buyingprice = cropData.price;
      payload.quantitybought = cropData.quantity;
    }

    // Add unit if provided
    if (cropData.unit) {
      payload.unit = cropData.unit;
    }

    if (cropData.date) {
      payload.date = cropData.date;
    }

    if (cropData.variety) {
      payload.variety = cropData.variety;
    }

    console.log("Payload:", JSON.stringify(payload, null, 2));

    // --- Axios config ---
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    };

    console.log(`Sending POST to: ${API_URL}`);

    // --- API Call ---
    const response = await axios.post(API_URL, payload, config);

    console.log("Crop added successfully. Response:", JSON.stringify(response.data, null, 2));

    return response.data as CropApiResponse;
  } catch (error: any) {
    console.error("Crop submission error:", error);

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
