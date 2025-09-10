/**
 * Crops Service
 * Handles all crop-related API operations
 * Production-ready with proper error handling and caching
 */

import { apiWithRetry, APIError, HTTP_STATUS } from './api';

// Crop data transformation utilities
const transformCropData = (apiCrop) => ({
  id: apiCrop.id,
  name: apiCrop.name,
  pricePerUnit: apiCrop.pricePerUnit,
  unit: apiCrop.unit,
  market: apiCrop.market,
  location: apiCrop.location,
  latitude: apiCrop.latitude,
  longitude: apiCrop.longitude,
  updatedAt: apiCrop.updatedAt || apiCrop.createdAt,
  category: apiCrop.category,
  quality: apiCrop.quality,
  // Add any additional fields as needed
});

const transformCropForAPI = (cropData) => ({
  name: cropData.name,
  pricePerUnit: cropData.pricePerUnit,
  unit: cropData.unit,
  market: cropData.market,
  location: cropData.location,
  latitude: cropData.latitude,
  longitude: cropData.longitude,
  category: cropData.category,
  quality: cropData.quality,
});

// Simple in-memory cache for crops data
class CropsCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

const cropsCache = new CropsCache();

// Crops Service Class
class CropsService {
  /**
   * Get all crops
   * @param {Object} options - Query options (location, category, etc.)
   * @returns {Promise<Array>} Array of crop objects
   */
  async getAllCrops(options = {}) {
    try {
      const cacheKey = `crops_${JSON.stringify(options)}`;
      const cachedData = cropsCache.get(cacheKey);
      
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached crops data');
        }
        return cachedData;
      }

      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `/crops/?${queryString}` : '/crops/';
      
      const response = await apiWithRetry.get(url);
      const crops = response.data.map(transformCropData);
      
      // Cache the results
      cropsCache.set(cacheKey, crops);
      
      if (__DEV__) {
        console.log('🌾 Retrieved crops:', crops.length);
      }
      
      return crops;
    } catch (error) {
      console.error('Error fetching crops:', error);
      
      // Return cached data if available, even if expired
      const cacheKey = `crops_${JSON.stringify(options)}`;
      const cachedData = cropsCache.get(cacheKey);
      if (cachedData) {
        console.log('⚠️ Using expired cached data due to network error');
        return cachedData;
      }
      
      throw new APIError(
        'Failed to fetch crops',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Get crop by ID
   * @param {string} cropId - Crop ID
   * @returns {Promise<Object>} Crop object
   */
  async getCropById(cropId) {
    try {
      if (!cropId) {
        throw new APIError('Crop ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const cacheKey = `crop_${cropId}`;
      const cachedData = cropsCache.get(cacheKey);
      
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached crop data');
        }
        return cachedData;
      }

      const response = await apiWithRetry.get(`/crops/${cropId}/`);
      const crop = transformCropData(response.data);
      
      // Cache the result
      cropsCache.set(cacheKey, crop);
      
      if (__DEV__) {
        console.log('🌾 Retrieved crop:', crop.name);
      }
      
      return crop;
    } catch (error) {
      console.error('Error fetching crop by ID:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Crop not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to fetch crop',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Create a new crop entry
   * @param {Object} cropData - Crop data object
   * @returns {Promise<Object>} Created crop object
   */
  async createCrop(cropData) {
    try {
      if (!cropData || !cropData.name || !cropData.pricePerUnit) {
        throw new APIError('Name and price are required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformCropForAPI(cropData);
      const response = await apiWithRetry.post('/crops/', transformedData);
      const crop = transformCropData(response.data);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('✅ Created crop:', crop.name);
      }
      
      return crop;
    } catch (error) {
      console.error('Error creating crop:', error);
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid crop data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to create crop',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Update crop data
   * @param {string} cropId - Crop ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated crop object
   */
  async updateCrop(cropId, updateData) {
    try {
      if (!cropId) {
        throw new APIError('Crop ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformCropForAPI(updateData);
      const response = await apiWithRetry.put(`/crops/${cropId}/`, transformedData);
      const crop = transformCropData(response.data);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('🔄 Updated crop:', crop.name);
      }
      
      return crop;
    } catch (error) {
      console.error('Error updating crop:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Crop not found', HTTP_STATUS.NOT_FOUND);
      }
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid update data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to update crop',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Delete crop
   * @param {string} cropId - Crop ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCrop(cropId) {
    try {
      if (!cropId) {
        throw new APIError('Crop ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      await apiWithRetry.delete(`/crops/${cropId}/`);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('🗑️ Deleted crop:', cropId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting crop:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Crop not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to delete crop',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Search crops by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Array>} Array of matching crops
   */
  async searchCrops(searchCriteria = {}) {
    try {
      return await this.getAllCrops(searchCriteria);
    } catch (error) {
      console.error('Error searching crops:', error);
      throw error;
    }
  }

  /**
   * Get crops by location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Array>} Array of crops in the area
   */
  async getCropsByLocation(latitude, longitude, radius = 10) {
    try {
      if (latitude === undefined || longitude === undefined) {
        throw new APIError('Latitude and longitude are required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchCrops({
        latitude,
        longitude,
        radius,
      });
    } catch (error) {
      console.error('Error fetching crops by location:', error);
      throw error;
    }
  }

  /**
   * Get crops by category
   * @param {string} category - Crop category
   * @returns {Promise<Array>} Array of crops in the category
   */
  async getCropsByCategory(category) {
    try {
      if (!category) {
        throw new APIError('Category is required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchCrops({ category });
    } catch (error) {
      console.error('Error fetching crops by category:', error);
      throw error;
    }
  }

  /**
   * Get price history for a crop
   * @param {string} cropId - Crop ID
   * @param {Object} options - Query options (date range, etc.)
   * @returns {Promise<Array>} Array of price history entries
   */
  async getCropPriceHistory(cropId, options = {}) {
    try {
      if (!cropId) {
        throw new APIError('Crop ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const queryParams = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `/crops/${cropId}/price-history/?${queryString}` : `/crops/${cropId}/price-history/`;
      
      const response = await apiWithRetry.get(url);
      
      if (__DEV__) {
        console.log('📈 Retrieved price history for crop:', cropId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching crop price history:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    cropsCache.clear();
    if (__DEV__) {
      console.log('🗑️ Crops cache cleared');
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    cropsCache.clearExpired();
  }
}

// Create and export a singleton instance
const cropsService = new CropsService();
export default cropsService;

// Export the class for testing purposes
export { CropsService };

// Export utility functions for external use
export { transformCropData, transformCropForAPI };
