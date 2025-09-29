/**
 * API Service Layer (TypeScript)
 * Production-ready API service with proper error handling, request/response interceptors,
 * and easy JWT integration support
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ========================================================================
// Type Definitions
// ========================================================================

type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Describes the configuration for an API request
interface RequestConfig {
  url: string;
  method?: HTTPMethod;
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

// Describes the structure of a successful API response
interface APIResponse<T> {
  data: T;
  status: number;
  config: RequestConfig;
}

// Describes the shape of the error object, similar to AxiosError
interface APIErrorObject {
  message: string;
  response?: {
    status: number;
    data: any;
  };
  request?: any;
}

// ========================================================================
// Configuration and Constants
// ========================================================================

// Base API configuration
const API_CONFIG = {
  BASE_URL: "https://mandigo.in/api",
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

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
} as const;

// ========================================================================
// Custom Error Class
// ========================================================================

class APIError extends Error {
  public readonly status: number;
  public readonly data: any;
  public readonly timestamp: string;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

// ========================================================================
// Interceptors
// ========================================================================

// Request interceptor for adding auth headers, logging, etc.
const requestInterceptor = async (
  config: RequestConfig
): Promise<RequestConfig> => {
  // Add authentication token if available, but skip for auth endpoints
  const isAuthEndpoint =
    config.url?.includes("/login/") ||
    config.url?.includes("/register/") ||
    config.url?.includes("/token/");

  if (!isAuthEndpoint) {
    const token = await getStoredToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  // Add common headers (but don't override Content-Type if it's explicitly set to undefined for FormData)
  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  // Only add Content-Type if it's not explicitly set to undefined (for FormData)
  if (!config.headers || config.headers["Content-Type"] !== undefined) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  config.headers = {
    ...defaultHeaders,
    ...config.headers,
  };

  // Remove undefined headers (for FormData support)
  if (config.headers["Content-Type"] === undefined) {
    delete config.headers["Content-Type"];
  }

  if (__DEV__) {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      {
        headers: config.headers,
        data: config.data,
      }
    );
  }

  return config;
};

// Response interceptor for logging, etc.
const responseInterceptor = <T>(response: APIResponse<T>): APIResponse<T> => {
  if (__DEV__) {
    console.log(`✅ API Response: ${response.status} ${response.config?.url}`, {
      data: response.data,
    });
  }
  return response;
};

// Error interceptor for consistent error handling. `never` indicates it always throws.
const errorInterceptor = (error: APIErrorObject): never => {
  const { response, request, message } = error;

  if (__DEV__) {
    console.error(`❌ API Error:`, {
      message: error.message,
      status: response?.status,
      data: response?.data,
      url: request?.url, // Note: `request.url` might not be available with `fetch`
    });
  }

  if (response) {
    const { status, data } = response;
    const errorMessage =
      data?.message || data?.error || getDefaultErrorMessage(status);

    if (status === HTTP_STATUS.UNAUTHORIZED) {
      clearAuthToken().catch(console.error);
      if (data?.code === "token_not_valid" || data?.detail?.includes("token")) {
        throw new APIError(
          "Your session has expired. Please login again.",
          status,
          data
        );
      }
    }

    throw new APIError(errorMessage, status, data);
  } else if (request) {
    throw new APIError("Network error - no response received", 0);
  } else {
    throw new APIError(message || "An unexpected error occurred", 0);
  }
};

// Get default error message based on status code
const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return "Invalid request. Please check your input.";
    case HTTP_STATUS.UNAUTHORIZED:
      return "Authentication required. Please login again.";
    case HTTP_STATUS.FORBIDDEN:
      return "Access denied. You do not have permission to perform this action.";
    case HTTP_STATUS.NOT_FOUND:
      return "The requested resource was not found.";
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return "Server error. Please try again later.";
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return "An error occurred. Please try again.";
  }
};

// ========================================================================
// Token Management
// ========================================================================

let authToken: string | null = null;

export const setAuthToken = async (token: string): Promise<void> => {
  authToken = token;
  try {
    await AsyncStorage.setItem("auth_token", token);
    console.log("Auth token stored successfully", token);
  } catch (error) {
    console.error("Error storing auth token:", error);
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  if (authToken) {
    return authToken;
  }
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      authToken = token;
      return token;
    }
  } catch (error) {
    console.error("Error retrieving auth token:", error);
  }
  return null;
};

export const clearAuthToken = async (): Promise<void> => {
  authToken = null;
  try {
    await AsyncStorage.removeItem("auth_token");
  } catch (error) {
    console.error("Error clearing auth token:", error);
  }
};

// ========================================================================
// Core HTTP Client & Retry Logic
// ========================================================================

// Determine if a request should be retried
const shouldRetry = (error: unknown): boolean => {
  if (error instanceof APIError) {
    // Retry on server errors and network issues
    return error.status >= 500 || error.status === 0;
  }
  return false;
};

// Retry mechanism for failed requests
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  attempt = 1
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (attempt < API_CONFIG.RETRY_ATTEMPTS && shouldRetry(error)) {
      console.log(
        `Retrying request (attempt ${attempt + 1}/${API_CONFIG.RETRY_ATTEMPTS})`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt)
      );
      return retryRequest(requestFn, attempt + 1);
    }
    throw error;
  }
};

// Core HTTP client with interceptors
const httpClient = async <T>(
  config: RequestConfig
): Promise<APIResponse<T>> => {
  const requestConfig = await requestInterceptor({
    timeout: API_CONFIG.TIMEOUT,
    ...config,
  });

  try {
    if (__DEV__) {
      console.log(`📤 Sending request to: ${API_CONFIG.BASE_URL}${config.url}`);
      console.log(`📤 Headers:`, requestConfig.headers);
    }

    const fetchOptions: RequestInit = {
      method: config.method || "GET",
    };

    // Only add headers if they exist (avoid undefined)
    if (requestConfig.headers) {
      fetchOptions.headers = requestConfig.headers;
    }

    // Only add body if we have data (avoid undefined)
    if (config.data) {
      // Check if data is FormData - if so, don't stringify it
      if (config.data instanceof FormData) {
        fetchOptions.body = config.data;
      } else {
        fetchOptions.body = JSON.stringify(config.data);
      }
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${config.url}`,
      fetchOptions
    );

    const contentType = response.headers.get("content-type");
    let responseData: any;

    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      const textResponse = await response.text();
      console.warn(
        "Non-JSON response received:",
        textResponse.substring(0, 200)
      );
      responseData = {
        message: "Invalid response format",
        rawResponse: textResponse,
      };
    }

    if (!response.ok) {
      // Create an error object that our interceptor can handle
      const error: APIErrorObject = {
        message: `Request failed with status code ${response.status}`,
        response: {
          status: response.status,
          data: responseData,
        },
      };
      throw error;
    }

    return responseInterceptor({
      data: responseData as T,
      status: response.status,
      config: requestConfig,
    });
  } catch (error: any) {
    // Re-throw through the error interceptor
    return errorInterceptor(error);
  }
};

// ========================================================================
// Exported API Methods
// ========================================================================

// Interface for our API clients to ensure they have the same methods
interface IApiClient {
  get: <T>(
    url: string,
    config?: Partial<RequestConfig>
  ) => Promise<APIResponse<T>>;
  post: <T>(
    url: string,
    data: unknown,
    config?: Partial<RequestConfig>
  ) => Promise<APIResponse<T>>;
  put: <T>(
    url: string,
    data: unknown,
    config?: Partial<RequestConfig>
  ) => Promise<APIResponse<T>>;
  patch: <T>(
    url: string,
    data: unknown,
    config?: Partial<RequestConfig>
  ) => Promise<APIResponse<T>>;
  delete: <T>(
    url: string,
    config?: Partial<RequestConfig>
  ) => Promise<APIResponse<T>>;
}

export const api: IApiClient = {
  get: (url, config) => httpClient({ ...config, method: "GET", url }),
  post: (url, data, config) =>
    httpClient({ ...config, method: "POST", url, data }),
  put: (url, data, config) =>
    httpClient({ ...config, method: "PUT", url, data }),
  patch: (url, data, config) =>
    httpClient({ ...config, method: "PATCH", url, data }),
  delete: (url, config) => httpClient({ ...config, method: "DELETE", url }),
};

export const apiWithRetry: IApiClient = {
  get: (url, config) => retryRequest(() => api.get(url, config)),
  post: (url, data, config) => retryRequest(() => api.post(url, data, config)),
  put: (url, data, config) => retryRequest(() => api.put(url, data, config)),
  patch: (url, data, config) =>
    retryRequest(() => api.patch(url, data, config)),
  delete: (url, config) => retryRequest(() => api.delete(url, config)),
};

// Export error class and HTTP status for use in other modules
export { APIError, HTTP_STATUS };

// NOTE: I've omitted the `debugTokenStatus` and `testAPIConnection` functions
// for brevity, but they can be easily typed and included if needed.
