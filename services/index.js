/**
 * Services Index
 * Central export point for all API services
 */

// Core API utilities
export { api, apiWithRetry, APIError, HTTP_STATUS, setAuthToken, getStoredToken, clearAuthToken } from './api';

// Service classes
export { default as authService, AuthService } from './authService';
export { default as userService, UserService, transformUserData, transformUserForAPI } from './userService';
export { default as cropsService, CropsService, transformCropData, transformCropForAPI } from './cropsService';
export { default as farmersService, FarmersService, transformFarmerData, transformFarmerForAPI } from './farmersService';
export { default as consumersService, ConsumersService, transformConsumerData, transformConsumerForAPI } from './consumersService';

// Re-export commonly used functions for convenience
// Note: These are direct references to the service methods, not destructured exports
// Use the services directly: authService.login(), userService.getAllUsers(), etc.
