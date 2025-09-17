/**
 * Protected Services
 * Wraps API services with authentication guards
 */

import farmersService from './farmersService';
import consumersService from './consumersService';
import { createProtectedService } from '@/utils/authGuard';

// Create protected versions of services
export const protectedFarmersService = createProtectedService(farmersService, {
  requireAuth: true,
  onUnauthorized: () => {
    console.warn('Farmers service call blocked: User not authenticated');
  },
  fallbackValue: []
});

export const protectedConsumersService = createProtectedService(consumersService, {
  requireAuth: true,
  onUnauthorized: () => {
    console.warn('Consumers service call blocked: User not authenticated');
  },
  fallbackValue: []
});

// Export individual protected methods for convenience
export const {
  getAllFarmers: getProtectedFarmers,
  getFarmerById: getProtectedFarmerById,
  createFarmerData: createProtectedFarmerData,
  updateFarmerData: updateProtectedFarmerData,
  deleteFarmerData: deleteProtectedFarmerData,
  searchFarmersData: searchProtectedFarmersData,
  getFarmersDataByCommodity: getProtectedFarmersDataByCommodity,
  getFarmersDataByLocation: getProtectedFarmersDataByLocation
} = protectedFarmersService;

export const {
  getAllConsumers: getProtectedConsumers,
  getConsumerById: getProtectedConsumerById,
  createConsumerData: createProtectedConsumerData,
  updateConsumerData: updateProtectedConsumerData,
  deleteConsumerData: deleteProtectedConsumerData,
  searchConsumersData: searchProtectedConsumersData,
  getConsumersDataByUserId: getProtectedConsumersDataByUserId,
  getConsumersDataByCommodity: getProtectedConsumersDataByCommodity,
  getConsumersDataByLocation: getProtectedConsumersDataByLocation,
  getUserPurchaseHistory: getProtectedUserPurchaseHistory,
  getMarketTrends: getProtectedMarketTrends
} = protectedConsumersService;

export default {
  farmers: protectedFarmersService,
  consumers: protectedConsumersService
};