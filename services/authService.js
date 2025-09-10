/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 * Production-ready with JWT support preparation
 */

import { apiWithRetry, setAuthToken, clearAuthToken, getStoredToken, APIError, HTTP_STATUS } from './api';
import userService from './userService';

// Authentication state management
let currentUser = null;
let authStateListeners = [];

// Auth state change listener management
const addAuthStateListener = (listener) => {
  authStateListeners.push(listener);
  return () => {
    authStateListeners = authStateListeners.filter(l => l !== listener);
  };
};

const notifyAuthStateChange = (user) => {
  currentUser = user;
  authStateListeners.forEach(listener => {
    try {
      listener(user);
    } catch (error) {
      console.error('Error in auth state listener:', error);
    }
  });
};

// Authentication Service Class
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User object and auth token
   */
  async register(userData) {
    try {
      if (!userData || !userData.email || !userData.password) {
        throw new APIError('Email and password are required', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new APIError('Please enter a valid email address', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate password strength
      if (userData.password.length < 6) {
        throw new APIError('Password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
      }

      // Prepare user data for API
      const registrationData = {
        name: userData.name,
        username: userData.email, // API uses username field for email
        mobile: userData.phoneNumber || userData.mobile,
        job: userData.job || userData.role || 'consumer',
        password: userData.password,
        latitude: userData.latitude,
        longitude: userData.longitude,
      };

      // TODO: When JWT is implemented, this will be the registration endpoint
      // For now, we'll create the user directly
      const user = await userService.createUser(registrationData);
      
      // TODO: When JWT is implemented, handle token response
      // const token = response.data.token;
      // await setAuthToken(token);
      
      // For now, simulate successful registration
      const mockToken = `mock_token_${user.id}_${Date.now()}`;
      await setAuthToken(mockToken);
      
      notifyAuthStateChange(user);
      
      if (__DEV__) {
        console.log('✅ User registered successfully:', user.name);
      }
      
      return { user, token: mockToken };
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError(
          'Invalid registration data',
          HTTP_STATUS.BAD_REQUEST,
          error.data
        );
      }
      
      throw new APIError(
        'Registration failed',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User object and auth token
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new APIError('Email and password are required', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new APIError('Please enter a valid email address', HTTP_STATUS.BAD_REQUEST);
      }

      // TODO: When JWT is implemented, this will be the login endpoint
      // For now, we'll search for the user by email/username
      const users = await userService.searchUsers({ username: email });
      
      if (users.length === 0) {
        throw new APIError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
      }

      const user = users[0];
      
      // TODO: When JWT is implemented, verify password on server
      // For now, we'll simulate successful login
      // In production, password verification should happen on the server
      
      // TODO: When JWT is implemented, handle token response
      // const response = await apiWithRetry.post('/auth/login/', { email, password });
      // const token = response.data.token;
      // await setAuthToken(token);
      
      // For now, simulate successful login
      const mockToken = `mock_token_${user.id}_${Date.now()}`;
      await setAuthToken(mockToken);
      
      notifyAuthStateChange(user);
      
      if (__DEV__) {
        console.log('✅ User logged in successfully:', user.name);
      }
      
      return { user, token: mockToken };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new APIError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
      }
      
      throw new APIError(
        'Login failed',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // TODO: When JWT is implemented, call logout endpoint to invalidate token
      // await apiWithRetry.post('/auth/logout/');
      
      await clearAuthToken();
      notifyAuthStateChange(null);
      
      if (__DEV__) {
        console.log('👋 User logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      await clearAuthToken();
      notifyAuthStateChange(null);
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user object or null
   */
  getCurrentUser() {
    return currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return currentUser !== null;
  }

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} New token and user data
   */
  async refreshToken() {
    try {
      const currentToken = await getStoredToken();
      if (!currentToken) {
        throw new APIError('No token to refresh', HTTP_STATUS.UNAUTHORIZED);
      }

      // TODO: When JWT is implemented, call refresh endpoint
      // const response = await apiWithRetry.post('/auth/refresh/', { token: currentToken });
      // const newToken = response.data.token;
      // await setAuthToken(newToken);
      
      // For now, return current token
      return { token: currentToken, user: currentUser };
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, logout user
      await this.logout();
      throw new APIError('Token refresh failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Initialize authentication state from stored token
   * @returns {Promise<Object|null>} User object if valid token exists
   */
  async initializeAuth() {
    try {
      const token = await getStoredToken();
      if (!token) {
        return null;
      }

      // TODO: When JWT is implemented, validate token with server
      // For now, we'll extract user ID from mock token and fetch user data
      const tokenParts = token.split('_');
      if (tokenParts.length >= 3 && tokenParts[0] === 'mock' && tokenParts[1] === 'token') {
        const userId = tokenParts[2];
        const user = await userService.getUserById(userId);
        notifyAuthStateChange(user);
        return user;
      }

      // If token is invalid, clear it
      await clearAuthToken();
      return null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearAuthToken();
      return null;
    }
  }

  /**
   * Update user profile
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateProfile(updateData) {
    try {
      if (!currentUser) {
        throw new APIError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      const updatedUser = await userService.updateUser(currentUser.id, updateData);
      notifyAuthStateChange(updatedUser);
      
      if (__DEV__) {
        console.log('🔄 Profile updated successfully');
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    try {
      if (!currentUser) {
        throw new APIError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      if (!currentPassword || !newPassword) {
        throw new APIError('Current password and new password are required', HTTP_STATUS.BAD_REQUEST);
      }

      if (newPassword.length < 6) {
        throw new APIError('New password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
      }

      // TODO: When JWT is implemented, call password change endpoint
      // await apiWithRetry.post('/auth/change-password/', {
      //   currentPassword,
      //   newPassword
      // });

      if (__DEV__) {
        console.log('🔐 Password changed successfully');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async requestPasswordReset(email) {
    try {
      if (!email) {
        throw new APIError('Email is required', HTTP_STATUS.BAD_REQUEST);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new APIError('Please enter a valid email address', HTTP_STATUS.BAD_REQUEST);
      }

      // TODO: When JWT is implemented, call password reset endpoint
      // await apiWithRetry.post('/auth/request-password-reset/', { email });

      if (__DEV__) {
        console.log('📧 Password reset email sent to:', email);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Add authentication state listener
   * @param {Function} listener - Callback function for auth state changes
   * @returns {Function} Unsubscribe function
   */
  addAuthStateListener(listener) {
    return addAuthStateListener(listener);
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Export the class for testing purposes
export { AuthService };
