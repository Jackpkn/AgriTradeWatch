/**
 * Consumers Service
 * Handles all consumer-related API operations
 * Production-ready with proper error handling and caching
 */

import { apiWithRetry, APIError, HTTP_STATUS } from './api';

// Consumer data transformation utilities
const transformConsumerData = (apiConsumer) => ({
  id: apiConsumer.id,
  commodity: apiConsumer.commodity,
  buyingPrice: parseFloat(apiConsumer.buyingprice) || 0,
  quantityBought: parseFloat(apiConsumer.quantitybought) || 0,
  unit: apiConsumer.unit,
  date: apiConsumer.date,
  latitude: parseFloat(apiConsumer.latitude) || 0,
  longitude: parseFloat(apiConsumer.longitude) || 0,
  userId: apiConsumer.userid,
  // Compatibility fields for existing components
  name: apiConsumer.commodity || '', // Map commodity to name for compatibility
  pricePerUnit: parseFloat(apiConsumer.buyingprice) || 0, // Map buyingprice to pricePerUnit
  quantity: parseFloat(apiConsumer.quantitybought) || 0, // Map quantitybought to quantity
  createdAt: apiConsumer.date ? { seconds: Math.floor(new Date(apiConsumer.date).getTime() / 1000) } : { seconds: Math.floor(Date.now() / 1000) },
  location: {
    coords: {
      latitude: parseFloat(apiConsumer.latitude) || 0,
      longitude: parseFloat(apiConsumer.longitude) || 0,
    },
    timestamp: apiConsumer.date ? new Date(apiConsumer.date).getTime() : Date.now()
  }
});

// Transform GeoJSON feature to consumer data format
const transformGeoJSONFeature = (feature) => {
  const props = feature.properties;
  const coords = feature.geometry.coordinates; // [longitude, latitude]
  
  return {
    id: props.id,
    commodity: props.commodity,
    buyingPrice: parseFloat(props.buyingprice) || 0,
    quantityBought: parseFloat(props.quantitybought) || 0,
    unit: props.unit,
    date: props.date,
    latitude: parseFloat(coords[1]) || 0, // GeoJSON uses [lng, lat] format
    longitude: parseFloat(coords[0]) || 0,
    userId: props.userid,
    // Compatibility fields for existing components
    name: props.commodity || '', // Map commodity to name for compatibility
    pricePerUnit: parseFloat(props.buyingprice) || 0, // Map buyingprice to pricePerUnit
    quantity: parseFloat(props.quantitybought) || 0, // Map quantitybought to quantity
    createdAt: props.date ? { seconds: Math.floor(new Date(props.date).getTime() / 1000) } : { seconds: Math.floor(Date.now() / 1000) },
    location: {
      coords: {
        latitude: parseFloat(coords[1]) || 0,
        longitude: parseFloat(coords[0]) || 0,
      },
      timestamp: props.date ? new Date(props.date).getTime() : Date.now()
    }
  };
};

const transformConsumerForAPI = (consumerData) => ({
  commodity: consumerData.commodity,
  buyingprice: consumerData.buyingPrice,
  quantitybought: consumerData.quantityBought,
  unit: consumerData.unit,
  date: consumerData.date,
  latitude: consumerData.latitude,
  longitude: consumerData.longitude,
  userid: consumerData.userId,
});

// Simple in-memory cache for consumers data
class ConsumersCache {
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

const consumersCache = new ConsumersCache();

// Consumers Service Class
class ConsumersService {
  /**
   * Get all consumers data
   * @param {Object} options - Query options (commodity, userId, date range, etc.)
   * @returns {Promise<Array>} Array of consumer data objects
   */
  async getAllConsumers(options = {}) {
    try {
      const cacheKey = `consumers_${JSON.stringify(options)}`;
      const cachedData = consumersCache.get(cacheKey);
      
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached consumers data');
        }
        return cachedData;
      }

      // Use the GeoJSON endpoint that works with authentication
      const response = await apiWithRetry.get('/consumers_geojson/');
      
      let consumers = [];
      
      // Handle GeoJSON response format
      if (response.data && response.data.type === 'FeatureCollection' && Array.isArray(response.data.features)) {
        consumers = response.data.features.map(transformGeoJSONFeature);
        console.log('🛒 Retrieved consumers data from GeoJSON:', consumers.length);
      } else if (Array.isArray(response.data)) {
        // Fallback to regular array format
        consumers = response.data.map(transformConsumerData);
        console.log('🛒 Retrieved consumers data from array:', consumers.length);
      } else {
        console.warn('Unexpected response format:', response.data);
        consumers = [];
      }
      
      // Cache the results
      consumersCache.set(cacheKey, consumers);
      
      if (__DEV__) {
        console.log('🛒 Retrieved consumers data:', consumers.length);
        if (consumers.length > 0) {
          console.log('Sample consumer data:', consumers[0]);
        }
      }
      
      return consumers;
    } catch (error) {
      console.error('Error fetching consumers data:', error);
      
      // Return cached data if available, even if expired
      const cacheKey = `consumers_${JSON.stringify(options)}`;
      const cachedData = consumersCache.get(cacheKey);
      if (cachedData) {
        console.log('⚠️ Using expired cached data due to network error');
        return cachedData;
      }
      
      throw new APIError(
        'Failed to fetch consumers data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Get consumer data by ID
   * @param {string} consumerId - Consumer data ID
   * @returns {Promise<Object>} Consumer data object
   */
  async getConsumerById(consumerId) {
    try {
      if (!consumerId) {
        throw new APIError('Consumer ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const cacheKey = `consumer_${consumerId}`;
      const cachedData = consumersCache.get(cacheKey);
      
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached consumer data');
        }
        return cachedData;
      }

      const response = await apiWithRetry.get(`/consumers/${consumerId}/`);
      const consumer = transformConsumerData(response.data);
      
      // Cache the result
      consumersCache.set(cacheKey, consumer);
      
      if (__DEV__) {
        console.log('🛒 Retrieved consumer data:', consumer.commodity);
      }
      
      return consumer;
    } catch (error) {
      console.error('Error fetching consumer by ID:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Consumer data not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to fetch consumer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Create new consumer data entry
   * @param {Object} consumerData - Consumer data object
   * @returns {Promise<Object>} Created consumer data object
   */
  async createConsumerData(consumerData) {
    try {
      if (!consumerData || !consumerData.commodity || !consumerData.buyingPrice) {
        throw new APIError('Commodity and buying price are required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformConsumerForAPI(consumerData);
      const response = await apiWithRetry.post('/consumers/', transformedData);
      const consumer = transformConsumerData(response.data);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('✅ Created consumer data:', consumer.commodity);
      }
      
      return consumer;
    } catch (error) {
      console.error('Error creating consumer data:', error);
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid consumer data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to create consumer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Update consumer data
   * @param {string} consumerId - Consumer data ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated consumer data object
   */
  async updateConsumerData(consumerId, updateData) {
    try {
      if (!consumerId) {
        throw new APIError('Consumer ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformConsumerForAPI(updateData);
      const response = await apiWithRetry.put(`/consumers/${consumerId}/`, transformedData);
      const consumer = transformConsumerData(response.data);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('🔄 Updated consumer data:', consumer.commodity);
      }
      
      return consumer;
    } catch (error) {
      console.error('Error updating consumer data:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Consumer data not found', HTTP_STATUS.NOT_FOUND);
      }
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid update data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to update consumer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Delete consumer data
   * @param {string} consumerId - Consumer data ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteConsumerData(consumerId) {
    try {
      if (!consumerId) {
        throw new APIError('Consumer ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      await apiWithRetry.delete(`/consumers/${consumerId}/`);
      
      // Clear relevant cache entries
      this.clearCache();
      
      if (__DEV__) {
        console.log('🗑️ Deleted consumer data:', consumerId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting consumer data:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('Consumer data not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to delete consumer data',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Search consumers data by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Array>} Array of matching consumers data
   */
  async searchConsumersData(searchCriteria = {}) {
    try {
      return await this.getAllConsumers(searchCriteria);
    } catch (error) {
      console.error('Error searching consumers data:', error);
      throw error;
    }
  }

  /**
   * Get consumers data by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of consumer data for the user
   */
  async getConsumersDataByUserId(userId) {
    try {
      if (!userId) {
        throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchConsumersData({ userid: userId });
    } catch (error) {
      console.error('Error fetching consumers data by user ID:', error);
      throw error;
    }
  }

  /**
   * Get consumers data by commodity
   * @param {string} commodity - Commodity name
   * @returns {Promise<Array>} Array of consumers data for the commodity
   */
  async getConsumersDataByCommodity(commodity) {
    try {
      if (!commodity) {
        throw new APIError('Commodity is required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchConsumersData({ commodity });
    } catch (error) {
      console.error('Error fetching consumers data by commodity:', error);
      throw error;
    }
  }

  /**
   * Get consumers data by location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Array>} Array of consumers data in the area
   */
  async getConsumersDataByLocation(latitude, longitude, radius = 10) {
    try {
      if (latitude === undefined || longitude === undefined) {
        throw new APIError('Latitude and longitude are required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchConsumersData({
        latitude,
        longitude,
        radius,
      });
    } catch (error) {
      console.error('Error fetching consumers data by location:', error);
      throw error;
    }
  }

  /**
   * Get user's purchase history
   * @param {string} userId - User ID
   * @param {Object} options - Additional options (date range, etc.)
   * @returns {Promise<Array>} Array of user's purchase history
   */
  async getUserPurchaseHistory(userId, options = {}) {
    try {
      if (!userId) {
        throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const searchOptions = { userid: userId, ...options };
      return await this.searchConsumersData(searchOptions);
    } catch (error) {
      console.error('Error fetching user purchase history:', error);
      throw error;
    }
  }

  /**
   * Get market trends for a commodity
   * @param {string} commodity - Commodity name
   * @param {Object} options - Additional options (date range, location, etc.)
   * @returns {Promise<Array>} Array of market trend data
   */
  async getMarketTrends(commodity, options = {}) {
    try {
      if (!commodity) {
        throw new APIError('Commodity is required', HTTP_STATUS.BAD_REQUEST);
      }

      const searchOptions = { commodity, ...options };
      return await this.searchConsumersData(searchOptions);
    } catch (error) {
      console.error('Error fetching market trends:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    consumersCache.clear();
    if (__DEV__) {
      console.log('🗑️ Consumers cache cleared');
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    consumersCache.clearExpired();
  }
}

// Create and export a singleton instance
const consumersService = new ConsumersService();
export default consumersService;

// Export the class for testing purposes
export { ConsumersService };

// Export utility functions for external use
export { transformConsumerData, transformConsumerForAPI, transformGeoJSONFeature };
