/**
 * API Service Layer
 * Production-ready API service with proper error handling, request/response interceptors,
 * and easy JWT integration support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_CONFIG = {
  BASE_URL: 'https://mandigo.in/api',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Custom error class for API errors
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

// Request interceptor for adding auth headers, logging, etc.
const requestInterceptor = async (config) => {
  // Add authentication token if available
  const token = await getStoredToken();
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Add common headers
  config.headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...config.headers,
  };

  // Log request in development
  if (__DEV__) {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
    });
  }

  return config;
};

// Response interceptor for error handling, logging, etc.
const responseInterceptor = (response) => {
  // Log response in development
  if (__DEV__) {
    console.log(`✅ API Response: ${response.status} ${response.config?.url}`, {
      data: response.data,
    });
  }

  return response;
};

// Error interceptor for consistent error handling
const errorInterceptor = (error) => {
  const { response, request, message } = error;

  // Log error in development
  if (__DEV__) {
    console.error(`❌ API Error:`, {
      message: error.message,
      status: response?.status,
      data: response?.data,
      url: request?.url,
    });
  }

  // Handle different error types
  if (response) {
    // Server responded with error status
    const { status, data } = response;
    const errorMessage = data?.message || data?.error || getDefaultErrorMessage(status);
    
    throw new APIError(errorMessage, status, data);
  } else if (request) {
    // Request was made but no response received
    throw new APIError('Network error - no response received', 0);
  } else {
    // Something else happened
    throw new APIError(message || 'An unexpected error occurred', 0);
  }
};

// Get default error message based on status code
const getDefaultErrorMessage = (status) => {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return 'Invalid request. Please check your input.';
    case HTTP_STATUS.UNAUTHORIZED:
      return 'Authentication required. Please login again.';
    case HTTP_STATUS.FORBIDDEN:
      return 'Access denied. You do not have permission to perform this action.';
    case HTTP_STATUS.NOT_FOUND:
      return 'The requested resource was not found.';
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return 'Server error. Please try again later.';
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};

// Token management functions (for future JWT integration)
let authToken = null;

export const setAuthToken = async (token) => {
  authToken = token;
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

export const getStoredToken = async () => {
  if (authToken) return authToken;
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      authToken = token;
      return token;
    }
  } catch (error) {
    console.error('Error retrieving auth token:', error);
  }
  return null;
};

export const clearAuthToken = async () => {
  authToken = null;
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

// Retry mechanism for failed requests
const retryRequest = async (requestFn, attempt = 1) => {
  try {
    return await requestFn();
  } catch (error) {
    if (attempt < API_CONFIG.RETRY_ATTEMPTS && shouldRetry(error)) {
      console.log(`Retrying request (attempt ${attempt + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
      return retryRequest(requestFn, attempt + 1);
    }
    throw error;
  }
};

// Determine if a request should be retried
const shouldRetry = (error) => {
  if (error instanceof APIError) {
    // Retry on server errors and network issues
    return error.status >= 500 || error.status === 0;
  }
  return false;
};

// Core HTTP client with interceptors
const httpClient = async (config) => {
  const requestConfig = await requestInterceptor({
    timeout: API_CONFIG.TIMEOUT,
    ...config,
  });

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${config.url}`, {
      method: config.method || 'GET',
      headers: requestConfig.headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // If not JSON, get text response
      const textResponse = await response.text();
      console.warn('Non-JSON response received:', textResponse.substring(0, 200));
      responseData = { message: 'Invalid response format', rawResponse: textResponse };
    }

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data: responseData,
        },
      };
    }

    return responseInterceptor({
      data: responseData,
      status: response.status,
      config: requestConfig,
    });
  } catch (error) {
    errorInterceptor(error);
  }
};

// HTTP methods
export const api = {
  get: (url, config = {}) => httpClient({ ...config, method: 'GET', url }),
  post: (url, data, config = {}) => httpClient({ ...config, method: 'POST', url, data }),
  put: (url, data, config = {}) => httpClient({ ...config, method: 'PUT', url, data }),
  patch: (url, data, config = {}) => httpClient({ ...config, method: 'PATCH', url, data }),
  delete: (url, config = {}) => httpClient({ ...config, method: 'DELETE', url }),
};

// Wrapper for retry logic
export const apiWithRetry = {
  get: (url, config = {}) => retryRequest(() => api.get(url, config)),
  post: (url, data, config = {}) => retryRequest(() => api.post(url, data, config)),
  put: (url, data, config = {}) => retryRequest(() => api.put(url, data, config)),
  patch: (url, data, config = {}) => retryRequest(() => api.patch(url, data, config)),
  delete: (url, config = {}) => retryRequest(() => api.delete(url, config)),
};

// Export error class and HTTP status for use in other modules
export { APIError, HTTP_STATUS };
