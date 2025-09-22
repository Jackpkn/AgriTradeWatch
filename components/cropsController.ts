/**
 * Crops Controller (TypeScript)
 * This service module handles all API operations related to crop data,
 * including adding new crops and fetching existing ones.
 */

import { apiWithRetry, APIError } from '@/services';

// ========================================================================
// Type Definitions
// ========================================================================

/**
 * The exact data structure required by the POST /crops/add/ endpoint.
 * Note: `latitude` and `longitude` are explicitly required as numbers.
 */
export interface AddCropPayload {
  commodity: string;
  buyingprice: number;
  quantitybought: number;
  unit: string;
  latitude: number;
  longitude: number;
}

/**
 * The data structure returned by the API after a crop is successfully added.
 */
export interface CropApiResponse {
  id: string; // UUID
  commodity: string;
  date: string; // ISO date string
  image: string | null;
  latitude: number;
  longitude: number;
  quantitysold: number | null;
  receipt: string | null;
  sellingprice: number | null;
  unit: string;
}

/**
 * A generic representation of crop data fetched from list endpoints.
 * This should be updated to match the actual structure from your services.
 */
export interface CropData {
  id: string;
  commodity?: string;
  name?: string; // Some sources might use 'name'
  // ... other relevant fields
}

// ========================================================================
// MOCK SERVICES (as consumersService/farmersService were not provided)
// ========================================================================
// TODO: Replace these mocks with your actual service imports.
const consumersService = {
  getAllConsumers: async (): Promise<CropData[]> => {
    console.warn("Using MOCK consumersService.getAllConsumers");
    return [];
  },
  getConsumersDataByUserId: async (userId: string): Promise<CropData[]> => {
    console.warn("Using MOCK consumersService.getConsumersDataByUserId");
    return [];
  }
};
const farmersService = {
  getAllFarmers: async (): Promise<CropData[]> => {
    console.warn("Using MOCK farmersService.getAllFarmers");
    return [];
  }
};
// ========================================================================

/**
 * Submits new crop data to the API.
 * @param cropData The data for the new crop, conforming to the AddCropPayload interface.
 * @returns A promise that resolves with the newly created crop data from the API.
 */
export const addCrop = async (cropData: AddCropPayload): Promise<CropApiResponse> => {
  try {
    console.log('🌾 Adding crop data:', cropData);

    // Make the API call
    const response = await apiWithRetry.post('/crops/add/', cropData);

    console.log('✅ Crop added successfully:', response.data);
    return response.data as CropApiResponse;

  } catch (error: unknown) {
    console.error('❌ Error adding crop:', error);

    if (error instanceof APIError) {
      // Use the structured error from our API service
      throw new Error(error.message || 'Failed to add crop due to an API error.');
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error('An unknown error occurred while adding the crop.');
  }
};

/**
 * Fetches all crop data, optionally filtered by job type.
 * @param job The role to filter by ('consumer' or 'farmers').
 * @returns A promise that resolves with an array of crop data.
 */
export const getAllCrops = async (job?: 'consumer' | 'farmers'): Promise<CropData[]> => {
  try {
    let crops: CropData[] = [];
    if (job === 'consumer') {
      crops = await consumersService.getAllConsumers();
    } else if (job === 'farmers') {
      crops = await farmersService.getAllFarmers();
    } else {
      const [farmersData, consumersData] = await Promise.all([
        farmersService.getAllFarmers(),
        consumersService.getAllConsumers()
      ]);
      crops = [...farmersData, ...consumersData];
    }
    return crops;
  } catch (error) {
    console.error('Error getting all crops:', error);
    throw error; // Re-throw to be handled by the calling component
  }
};

/**
 * Fetches crop data associated with a specific user ID.
 * @param userId The ID of the user.
 * @param job The role of the user, defaults to 'farmers'.
 * @returns A promise that resolves with an array of crop data for that user.
 */
export const getCropById = async (userId: string, job: 'consumer' | 'farmers' = 'farmers'): Promise<CropData[]> => {
  try {
    if (job === 'consumer') {
      return await consumersService.getConsumersDataByUserId(userId);
    } else {
      // As noted in the original code, this may need a different implementation
      return await farmersService.getAllFarmers();
    }
  } catch (error) {
    console.error(`Error getting crop by ID for user ${userId}:`, error);
    throw error;
  }
};