/**
 * Farmers Service
 * Handles all farmer-related API operations
 * Production-ready with proper error handling and caching
 */

import { apiWithRetry, APIError, HTTP_STATUS } from './api';

// Farmer data transformation utilities
const transformFarmerData = (apiFarmer) => ({
  id: apiFarmer.id,
  commodity: apiFarmer.commodity,
  sellingPrice: parseFloat(apiFarmer.sellingprice) || 0,
  receipt: apiFarmer.receipt,
  quantitySold: parseFloat(apiFarmer.quantitysold) || 0,
  unit: apiFarmer.unit,
  date: apiFarmer.date,
  image: apiFarmer.image,
  latitude: parseFloat(apiFarmer.latitude) || 0,
  longitude: parseFloat(apiFarmer.longitude) || 0,
  // Compatibility fields for existing components
  name: apiFarmer.commodity || '', // Map commodity to name for compatibility
  pricePerUnit: parseFloat(apiFarmer.sellingprice) || 0, // Map sellingprice to pricePerUnit
  quantity: parseFloat(apiFarmer.quantitysold) || 0, // Map quantitysold to quantity
  createdAt: apiFarmer.date ? { seconds: Math.floor(new Date(apiFarmer.date).getTime() / 1000) } : { seconds: Math.floor(Date.now() / 1000) },
  location: {
    coords: {
      latitude: parseFloat(apiFarmer.latitude) || 0,
      longitude: parseFloat(apiFarmer.longitude) || 0,
    },
    timestamp: apiFarmer.date ? new Date(apiFarmer.date).getTime() : Date.now()
  }
});

const transformFarmerForAPI = (farmerData) => ({
  commodity: farmerData.commodity,
  sellingprice: farmerData.sellingPrice,
  receipt: farmerData.receipt,
  quantitysold: farmerData.quantitySold,
  unit: farmerData.unit,
  date: farmerData.date,
  image: farmerData.image,
  latitude: farmerData.latitude,
  longitude: farmerData.longitude,
});

// Simple in-memory cache for farmers data
class FarmersCache {
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

const farmersCache = new FarmersCache();

// Farmers Service Class
class FarmersService {
  /**
   * Get all farmers data
   * @param {Object} options - Query options (commodity, date range, etc.)
   * @returns {Promise<Array>} Array of farmer data objects
   */
  async getAllFarmers(options = {}) {
    try {
      const cacheKey = `farmers_${JSON.stringify(options)}`;
      const cachedData = farmersCache.get(cacheKey);
      
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached farmers data');
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
      const url = queryString ? `/farmers/?${queryString}` : '/farmers/';
      
      const response = await apiWithRetry.get(url);
      const farmers = Array.isArray(response.data) ? response.data.map(transformFarmerData) : [];
      
      // Cache the results
      farmersCache.set(cacheKey, farmers);
      
      if (__DEV__) {
        console.log('🚜 Retrieved farmers data:', farmers.length);
      }
      
      return farmers;
    } catch (error) {
      console.error('Error fetching farmers data:', error);
      
      // Return cached data if available, even if expired
      const cacheKey = `farmers_${JSON.stringify(options)}`;
      const cachedData = farmersCache.get(cacheKey);
      if (cachedData) {
        console.log('⚠️ Using expired cached data due to network error');
        return cachedData;
      }
      
      throw new APIError(
        'Failed to fetch farmers data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Get farmer data by ID
   * @param {string} farmerId - Farmer data ID
   * @returns {Promise<Object>} Farmer data object
   */
  async getFarmerById(farmerId) {
    try {
      if (!farmerId) {
        throw new APIError('Farmer ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const cacheKey = `farmer_${farmerId}`;
      const cachedData = farmersCache.get(cacheKey);
      
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached farmer data');
        }
        return cachedData;
      }

      const response = await apiWithRetry.get(`/farmers/${farmerId}/`);
      const farmer = transformFarmerData(response.data);
      
      // Cache the result
      farmersCache.set(cacheKey, farmer);
      
      if (__DEV__) {
        console.log('🚜 Retrieved farmer data:', farmer.commodity);
      }
      
      return farmer;
    } catch (error) {
      console.error('Error fetching farmer by ID:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Farmer data not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to fetch farmer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Create new farmer data entry
   * @param {Object} farmerData - Farmer data object
   * @returns {Promise<Object>} Created farmer data object
   */
  async createFarmerData(farmerData) {
    try {
      if (!farmerData || !farmerData.commodity || !farmerData.sellingPrice) {
        throw new APIError('Commodity and selling price are required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformFarmerForAPI(farmerData);
      const response = await apiWithRetry.post('/farmers/', transformedData);
      const farmer = transformFarmerData(response.data);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('✅ Created farmer data:', farmer.commodity);
      }
      
      return farmer;
    } catch (error) {
      console.error('Error creating farmer data:', error);
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid farmer data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to create farmer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Update farmer data
   * @param {string} farmerId - Farmer data ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated farmer data object
   */
  async updateFarmerData(farmerId, updateData) {
    try {
      if (!farmerId) {
        throw new APIError('Farmer ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformFarmerForAPI(updateData);
      const response = await apiWithRetry.put(`/farmers/${farmerId}/`, transformedData);
      const farmer = transformFarmerData(response.data);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('🔄 Updated farmer data:', farmer.commodity);
      }
      
      return farmer;
    } catch (error) {
      console.error('Error updating farmer data:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Farmer data not found', HTTP_STATUS.NOT_FOUND);
      }
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid update data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to update farmer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Delete farmer data
   * @param {string} farmerId - Farmer data ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFarmerData(farmerId) {
    try {
      if (!farmerId) {
        throw new APIError('Farmer ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      await apiWithRetry.delete(`/farmers/${farmerId}/`);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('🗑️ Deleted farmer data:', farmerId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting farmer data:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Farmer data not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to delete farmer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Search farmers data by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Array>} Array of matching farmers data
   */
  async searchFarmersData(searchCriteria = {}) {
    try {
      return await this.getAllFarmers(searchCriteria);
    } catch (error) {
      console.error('Error searching farmers data:', error);
      throw error;
    }
  }

  /**
   * Get farmers data by commodity
   * @param {string} commodity - Commodity name
   * @returns {Promise<Array>} Array of farmers data for the commodity
   */
  async getFarmersDataByCommodity(commodity) {
    try {
      if (!commodity) {
        throw new APIError('Commodity is required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchFarmersData({ commodity });
    } catch (error) {
      console.error('Error fetching farmers data by commodity:', error);
      throw error;
    }
  }

  /**
   * Get farmers data by location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Array>} Array of farmers data in the area
   */
  async getFarmersDataByLocation(latitude, longitude, radius = 10) {
    try {
      if (latitude === undefined || longitude === undefined) {
        throw new APIError('Latitude and longitude are required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchFarmersData({
        latitude,
        longitude,
        radius,
      });
    } catch (error) {
      console.error('Error fetching farmers data by location:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    farmersCache.clear();
    if (__DEV__) {
      console.log('🗑️ Farmers cache cleared');
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    farmersCache.clearExpired();
  }
}

// Create and export a singleton instance
const farmersService = new FarmersService();
export default farmersService;

// Export the class for testing purposes
export { FarmersService };

// Export utility functions for external use
export { transformFarmerData, transformFarmerForAPI };
