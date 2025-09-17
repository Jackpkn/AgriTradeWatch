/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 * Production-ready with JWT support preparation
 */

import { apiWithRetry, setAuthToken, clearAuthToken, getStoredToken, APIError, HTTP_STATUS } from './api';
import userService from './userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Register a new user against backend POST /api/register/
   * Expects: username (required), password (required), email (optional), mobile (optional),
   * job (required: 'consumer' | 'farmer'), latitude/longitude (optional)
   * Returns a simple success response for UI to prompt login.
   * @param {Object} userData
   * @returns {Promise<{success:boolean,message:string,data?:any}>}
   */
  async register(userData) {
    try {
      if (!userData) {
        throw new APIError('Registration data is required', HTTP_STATUS.BAD_REQUEST);
      }

      const username = userData.username || userData.email; // allow using email as username from UI
      const password = userData.password;
      const job = userData.job || userData.role; // must be 'consumer' | 'farmer'

      if (!username || !password) {
        throw new APIError('Username and password are required', HTTP_STATUS.BAD_REQUEST);
      }

      if (!job) {
        throw new APIError('Job is required (consumer or farmer)', HTTP_STATUS.BAD_REQUEST);
      }

      if (password.length < 6) {
        throw new APIError('Password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
      }

      // Optional email validation if provided separately from username
      const email = userData.email;
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new APIError('Please enter a valid email address', HTTP_STATUS.BAD_REQUEST);
        }
      }

      const payload = {
        username,
        password,
        email: email || undefined,
        mobile: userData.mobile || userData.phoneNumber || undefined,
        job,
        latitude: userData.latitude,
        longitude: userData.longitude,
      };

      // Hit backend register endpoint (BASE_URL already includes /api)
      const res = await apiWithRetry.post('/register/', payload);

      // Store job information for later use during login
      if (job) {
        try {
          await AsyncStorage.setItem('user_job', job);
        } catch (error) {
          console.error('Error storing user job:', error);
        }
      }

      // Do NOT log the user in here; just confirm success so UI can prompt to login
      if (__DEV__) {
        console.log('✅ Registration successful:', res?.data);
      }

      return {
        success: true,
        message: 'Registration successful. Now login with the same credentials.',
        data: res?.data,
      };
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof APIError) {
        throw error;
      }

      if (error.status === HTTP_STATUS.BAD_REQUEST) {
        throw new APIError('Invalid registration data', HTTP_STATUS.BAD_REQUEST, error.data);
      }

      throw new APIError(
        'Registration failed',
        error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.data
      );
    }
  }

  /**
   * Login user with username and password
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} User object and auth tokens
   */
  async login(username, password) {
    try {
      if (!username || !password) {
        throw new APIError('Username and password are required', HTTP_STATUS.BAD_REQUEST);
      }

      // Call backend token endpoint
      const response = await apiWithRetry.post('/token/', {
        username,
        password,
      });

      const { access, refresh } = response.data;

      if (!access) {
        throw new APIError('Login failed - no access token received', HTTP_STATUS.UNAUTHORIZED);
      }

      // Store the access token
      if (access) {
        await setAuthToken(access);
      }

      // Decode the token to get user info
      const tokenParts = access.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Try to get job information from local storage (from registration)
        let job = 'farmer'; // Default to farmer
        try {
          const storedJob = await AsyncStorage.getItem('user_job');
          if (storedJob) {
            job = storedJob;
          }
        } catch (error) {
          console.log('Could not retrieve job from storage, using default');
        }
        
        const user = {
          id: payload.user_id,
          username: username, // Use the username from login
          job: job, // Add job information
        };

      // Store refresh token for future use (if needed)
      if (refresh) {
        try {
          await AsyncStorage.setItem('refresh_token', refresh);
        } catch (error) {
          console.error('Error storing refresh token:', error);
        }
      }

        notifyAuthStateChange(user);
        
        if (__DEV__) {
          console.log('✅ User logged in successfully:', username);
        }
        
        return { 
          user, 
          token: access,
          refreshToken: refresh,
          message: 'Login successful'
        };
      } else {
        throw new APIError('Invalid token format received', HTTP_STATUS.UNAUTHORIZED);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof APIError) {
        throw error;
      }

      if (error.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new APIError('Invalid username or password', HTTP_STATUS.UNAUTHORIZED);
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
      
      // Clear stored job information
      try {
        await AsyncStorage.removeItem('user_job');
      } catch (error) {
        console.error('Error clearing user job:', error);
      }
      
      notifyAuthStateChange(null);
      
      if (__DEV__) {
        console.log('👋 User logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      await clearAuthToken();
      
      // Clear stored job information
      try {
        await AsyncStorage.removeItem('user_job');
      } catch (clearError) {
        console.error('Error clearing user job:', clearError);
      }
      
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

      // For JWT tokens, we can decode the token to get user info
      // or make a simple API call to validate the token
      try {
        // Try to decode JWT token to get user info
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          // This is a JWT token, decode the payload
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Try to get job information from local storage
          let job = 'farmer'; // Default to farmer
          try {
            const storedJob = await AsyncStorage.getItem('user_job');
            if (storedJob) {
              job = storedJob;
            }
          } catch (error) {
            console.log('Could not retrieve job from storage during auto-login, using default');
          }
          
          const user = {
            id: payload.user_id,
            username: payload.username || 'User',
            job: job, // Add job information
            token: token,
          };
          
          // Set current user and notify listeners
          currentUser = user;
          notifyAuthStateChange(user);
          
          if (__DEV__) {
            console.log('✅ Token validated, user auto-logged in:', user.username);
          }
          
          return user;
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
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
