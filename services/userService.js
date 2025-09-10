/**
 * User Service
 * Handles all user-related API operations
 * Production-ready with proper error handling and type safety
 */

import { apiWithRetry, APIError, HTTP_STATUS } from './api';

// User data transformation utilities
const transformUserData = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.username, // API uses 'username' field for email
  username: apiUser.username,
  mobile: apiUser.mobile,
  job: apiUser.job,
  role: apiUser.job, // Map job to role for consistency
  createdAt: apiUser.createdat,
  latitude: apiUser.latitude,
  longitude: apiUser.longitude,
  // Add any additional fields as needed
});

const transformUserForAPI = (userData) => ({
  name: userData.name,
  username: userData.email || userData.username,
  mobile: userData.mobile || userData.phoneNumber,
  job: userData.job || userData.role,
  latitude: userData.latitude,
  longitude: userData.longitude,
});

// User Service Class
class UserService {
  /**
   * Get all users (for admin purposes or user listing)
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsers() {
    try {
      const response = await apiWithRetry.get('/users/');
      const users = response.data.map(transformUserData);
      
      if (__DEV__) {
        console.log('📋 Retrieved users:', users.length);
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new APIError(
        'Failed to fetch users',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    try {
      if (!userId) {
        throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const response = await apiWithRetry.get(`/users/${userId}/`);
      const user = transformUserData(response.data);
      
      if (__DEV__) {
        console.log('👤 Retrieved user:', user.name);
      }
      
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('User not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to fetch user',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      if (!userData || !userData.name || !userData.username) {
        throw new APIError('Name and username are required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformUserForAPI(userData);
      const response = await apiWithRetry.post('/users/', transformedData);
      const user = transformUserData(response.data);
      
      if (__DEV__) {
        console.log('✅ Created user:', user.name);
      }
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid user data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to create user',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(userId, updateData) {
    try {
      if (!userId) {
        throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const transformedData = transformUserForAPI(updateData);
      const response = await apiWithRetry.put(`/users/${userId}/`, transformedData);
      const user = transformUserData(response.data);
      
      if (__DEV__) {
        console.log('🔄 Updated user:', user.name);
      }
      
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('User not found', HTTP_STATUS.NOT_FOUND);
      }
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid update data provided',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Failed to update user',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    try {
      if (!userId) {
        throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      await apiWithRetry.delete(`/users/${userId}/`);
      
      if (__DEV__) {
        console.log('🗑️ Deleted user:', userId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (error.status === HTTP_STATUS.NOT_FOUND) {
        throw new APIError('User not found', HTTP_STATUS.NOT_FOUND);
      }
      
      throw new APIError(
        'Failed to delete user',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Search users by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchCriteria = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add search parameters
      Object.entries(searchCriteria).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `/users/?${queryString}` : '/users/';
      
      const response = await apiWithRetry.get(url);
      const users = response.data.map(transformUserData);
      
      if (__DEV__) {
        console.log('🔍 Search results:', users.length, 'users found');
      }
      
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new APIError(
        'Failed to search users',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Get users by role/job type
   * @param {string} role - Role to filter by (farmer, consumer, etc.)
   * @returns {Promise<Array>} Array of users with specified role
   */
  async getUsersByRole(role) {
    try {
      if (!role) {
        throw new APIError('Role is required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.searchUsers({ job: role });
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  /**
   * Update user location
   * @param {string} userId - User ID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Updated user object
   */
  async updateUserLocation(userId, latitude, longitude) {
    try {
      if (!userId || latitude === undefined || longitude === undefined) {
        throw new APIError('User ID, latitude, and longitude are required', HTTP_STATUS.BAD_REQUEST);
      }

      return await this.updateUser(userId, { latitude, longitude });
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;

// Export the class for testing purposes
export { UserService };

// Export utility functions for external use
export { transformUserData, transformUserForAPI };
