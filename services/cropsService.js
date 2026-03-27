/**
 * Crops Service
 * Wrapper around farmers service for crop-related operations
 * Provides crop-specific API methods
 */

import farmersService from './farmersService.js';

class CropsService {
    /**
     * Get all crops data (alias for farmers data)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of crop data objects
     */
    async getAllCrops(options = {}) {
        return await farmersService.getAllFarmers(options);
    }

    /**
     * Get crop data by ID
     * @param {string} cropId - Crop data ID
     * @returns {Promise<Object>} Crop data object
     */
    async getCropById(cropId) {
        return await farmersService.getFarmerById(cropId);
    }

    /**
     * Create new crop data entry
     * @param {Object} cropData - Crop data object
     * @returns {Promise<Object>} Created crop data object
     */
    async createCropData(cropData) {
        return await farmersService.createFarmerData(cropData);
    }

    /**
     * Update crop data
     * @param {string} cropId - Crop data ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated crop data object
     */
    async updateCropData(cropId, updateData) {
        return await farmersService.updateFarmerData(cropId, updateData);
    }

    /**
     * Delete crop data
     * @param {string} cropId - Crop data ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCropData(cropId) {
        return await farmersService.deleteFarmerData(cropId);
    }

    /**
     * Search crops data by criteria
     * @param {Object} searchCriteria - Search parameters
     * @returns {Promise<Array>} Array of matching crops data
     */
    async searchCropsData(searchCriteria = {}) {
        return await farmersService.searchFarmersData(searchCriteria);
    }

    /**
     * Get crops data by commodity type
     * @param {string} commodity - Commodity name
     * @returns {Promise<Array>} Array of crops data for the commodity
     */
    async getCropsByCommodity(commodity) {
        return await farmersService.getFarmersDataByCommodity(commodity);
    }

    /**
     * Get crops data by location
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {number} radius - Search radius in kilometers
     * @returns {Promise<Array>} Array of crops data in the area
     */
    async getCropsByLocation(latitude, longitude, radius = 10) {
        return await farmersService.getFarmersDataByLocation(latitude, longitude, radius);
    }

    /**
     * Clear cache
     */
    clearCache() {
        farmersService.clearCache();
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        farmersService.clearExpiredCache();
    }
}

// Create and export a singleton instance
const cropsService = new CropsService();
export default cropsService;

// Export the class for testing purposes
export { CropsService };