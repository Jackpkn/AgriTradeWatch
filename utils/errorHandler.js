// /**
//  * Centralized Error Handling Utility
//  * Provides consistent error handling patterns across the application
//  */

// import { Alert } from 'react-native';

// // Error types for consistent handling
// export const ERROR_TYPES = {
//   NETWORK: 'NETWORK_ERROR',
//   AUTH: 'AUTH_ERROR',
//   VALIDATION: 'VALIDATION_ERROR',
//   API: 'API_ERROR',
//   UNKNOWN: 'UNKNOWN_ERROR',
// };

// // Error severity levels
// export const ERROR_SEVERITY = {
//   LOW: 'low',
//   MEDIUM: 'medium',
//   HIGH: 'high',
//   CRITICAL: 'critical',
// };

// // Default error messages
// export const ERROR_MESSAGES = {
//   [ERROR_TYPES.NETWORK]: 'Network connection error. Please check your internet connection.',
//   [ERROR_TYPES.AUTH]: 'Authentication error. Please login again.',
//   [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
//   [ERROR_TYPES.API]: 'Server error. Please try again later.',
//   [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
// };

// // Error context for better debugging
// export const ERROR_CONTEXT = {
//   LOGIN: 'login',
//   SIGNUP: 'signup',
//   PROFILE: 'profile',
//   CROPS: 'crops',
//   MAP: 'map',
//   HOME: 'home',
//   API: 'api',
//   AUTH: 'auth',
// };

// /**
//  * Centralized error handler
//  * @param {Error} error - The error object
//  * @param {string} context - The context where the error occurred
//  * @param {Object} options - Additional options for error handling
//  */
// export const handleError = (error, context = ERROR_CONTEXT.UNKNOWN, options = {}) => {
//   const {
//     showAlert = true,
//     logError = true,
//     customMessage = null,
//     onRetry = null,
//     severity = ERROR_SEVERITY.MEDIUM,
//   } = options;

//   // Determine error type
//   const errorType = determineErrorType(error);

//   // Get error message
//   const errorMessage = customMessage || getErrorMessage(error, errorType);

//   // Log error if enabled
//   if (logError) {
//     logErrorToConsole(error, context, errorType, severity);
//   }

//   // Show alert if enabled
//   if (showAlert) {
//     showErrorAlert(errorMessage, errorType, onRetry);
//   }

//   // Return structured error info
//   return {
//     type: errorType,
//     message: errorMessage,
//     context,
//     severity,
//     originalError: error,
//   };
// };

// /**
//  * Determine the type of error based on error properties
//  */
// const determineErrorType = (error) => {
//   if (!error) return ERROR_TYPES.UNKNOWN;

//   // Network errors
//   if (error.message?.includes('Network') ||
//     error.message?.includes('fetch') ||
//     error.status === 0 ||
//     error.code === 'NETWORK_ERROR') {
//     return ERROR_TYPES.NETWORK;
//   }

//   // Authentication errors
//   if (error.status === 401 ||
//     error.message?.includes('auth') ||
//     error.message?.includes('login') ||
//     error.message?.includes('token')) {
//     return ERROR_TYPES.AUTH;
//   }

//   // Validation errors
//   if (error.status === 400 ||
//     error.message?.includes('validation') ||
//     error.message?.includes('invalid') ||
//     error.message?.includes('required')) {
//     return ERROR_TYPES.VALIDATION;
//   }

//   // API errors
//   if (error.status >= 500 ||
//     error.message?.includes('server') ||
//     error.message?.includes('API')) {
//     return ERROR_TYPES.API;
//   }

//   return ERROR_TYPES.UNKNOWN;
// };

// /**
//  * Get appropriate error message based on error type and details
//  */
// const getErrorMessage = (error, errorType) => {
//   // Check for specific error messages first
//   if (error.message) {
//     // Network specific messages
//     if (errorType === ERROR_TYPES.NETWORK) {
//       if (error.message.includes('timeout')) {
//         return 'Request timed out. Please check your connection and try again.';
//       }
//       if (error.message.includes('offline')) {
//         return 'You are currently offline. Please check your internet connection.';
//       }
//     }

//     // Auth specific messages
//     if (errorType === ERROR_TYPES.AUTH) {
//       if (error.message.includes('invalid credentials')) {
//         return 'Invalid email or password. Please try again.';
//       }
//       if (error.message.includes('expired')) {
//         return 'Your session has expired. Please login again.';
//       }
//     }

//     // Validation specific messages
//     if (errorType === ERROR_TYPES.VALIDATION) {
//       if (error.message.includes('email')) {
//         return 'Please enter a valid email address.';
//       }
//       if (error.message.includes('password')) {
//         return 'Password must be at least 6 characters long.';
//       }
//     }

//     // API specific messages
//     if (errorType === ERROR_TYPES.API) {
//       if (error.status === 500) {
//         return 'Server error. Please try again later.';
//       }
//       if (error.status === 503) {
//         return 'Service temporarily unavailable. Please try again later.';
//       }
//     }
//   }

//   // Return default message for error type
//   return ERROR_MESSAGES[errorType];
// };

// /**
//  * Log error to console with structured information
//  */
// const logErrorToConsole = (error, context, errorType, severity) => {
//   const timestamp = new Date().toISOString();
//   const logLevel = severity === ERROR_SEVERITY.CRITICAL ? 'error' :
//     severity === ERROR_SEVERITY.HIGH ? 'warn' : 'log';

//   console[logLevel](`[${timestamp}] Error in ${context}:`, {
//     type: errorType,
//     severity,
//     message: error.message,
//     stack: error.stack,
//     context,
//   });
// };

// /**
//  * Show error alert to user
//  */
// const showErrorAlert = (message, errorType, onRetry) => {
//   const title = getAlertTitle(errorType);
//   const buttons = getAlertButtons(errorType, onRetry);

//   Alert.alert(title, message, buttons);
// };

// /**
//  * Get appropriate alert title based on error type
//  */
// const getAlertTitle = (errorType) => {
//   const titles = {
//     [ERROR_TYPES.NETWORK]: 'Connection Error',
//     [ERROR_TYPES.AUTH]: 'Authentication Error',
//     [ERROR_TYPES.VALIDATION]: 'Input Error',
//     [ERROR_TYPES.API]: 'Server Error',
//     [ERROR_TYPES.UNKNOWN]: 'Error',
//   };

//   return titles[errorType] || 'Error';
// };

// /**
//  * Get appropriate alert buttons based on error type and retry option
//  */
// const getAlertButtons = (errorType, onRetry) => {
//   const buttons = [{ text: 'OK', style: 'default' }];

//   if (onRetry && typeof onRetry === 'function') {
//     buttons.unshift({
//       text: 'Retry',
//       style: 'default',
//       onPress: onRetry,
//     });
//   }

//   return buttons;
// };

// /**
//  * Async error wrapper for API calls
//  */
// export const withErrorHandling = (asyncFunction, context, options = {}) => {
//   return async (...args) => {
//     try {
//       return await asyncFunction(...args);
//     } catch (error) {
//       return handleError(error, context, options);
//     }
//   };
// };

// /**
//  * Error boundary helper for React components
//  */
// export const createErrorBoundary = (context) => {
//   return (error, errorInfo) => {
//     const errorDetails = {
//       ...error,
//       componentStack: errorInfo.componentStack,
//     };

//     handleError(errorDetails, context, {
//       severity: ERROR_SEVERITY.CRITICAL,
//       showAlert: true,
//     });
//   };
// };

// /**
//  * Validation error handler
//  */
// export const handleValidationError = (errors, context = ERROR_CONTEXT.VALIDATION) => {
//   const errorMessage = Array.isArray(errors)
//     ? errors.join('\n')
//     : errors.message || 'Validation failed';

//   return handleError(
//     new Error(errorMessage),
//     context,
//     {
//       errorType: ERROR_TYPES.VALIDATION,
//       showAlert: true,
//     }
//   );
// };

// /**
//  * Network error handler with retry logic
//  */
// export const handleNetworkError = (error, context, retryFunction) => {
//   return handleError(error, context, {
//     errorType: ERROR_TYPES.NETWORK,
//     showAlert: true,
//     onRetry: retryFunction,
//     severity: ERROR_SEVERITY.MEDIUM,
//   });
// };

// /**
//  * Authentication error handler
//  */
// export const handleAuthError = (error, context) => {
//   return handleError(error, context, {
//     errorType: ERROR_TYPES.AUTH,
//     showAlert: true,
//     severity: ERROR_SEVERITY.HIGH,
//   });
// };

// export default {
//   handleError,
//   withErrorHandling,
//   createErrorBoundary,
//   handleValidationError,
//   handleNetworkError,
//   handleAuthError,
//   ERROR_TYPES,
//   ERROR_SEVERITY,
//   ERROR_MESSAGES,
//   ERROR_CONTEXT,
// };
