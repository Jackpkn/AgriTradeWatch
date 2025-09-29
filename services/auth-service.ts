/**
 * Authentication Service (TypeScript) - v2
 * Handles user authentication, registration, and session management.
 * Updated to match the specific API contract for login and registration.
 */

import {
  apiWithRetry,
  setAuthToken,
  getStoredToken,
  APIError,
  HTTP_STATUS,
} from "./api-pro";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base-64";

// ========================================================================
// Type Definitions - UPDATED
// ========================================================================

// The canonical User object used throughout the application.
// NOTE: The user ID from the API is a string (UUID).
export interface User {
  id: string; // Changed from number to string
  username: string;
  job: "consumer" | "farmer";
}

// The shape of the JWT payload after decoding.
interface JWTPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: string; // API returns user_id as a string
}

// --- Registration Types ---
export interface RegistrationData {
  username: string;
  password: string;
  job: "consumer" | "farmer";
  email?: string | undefined;
  mobile?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}
// Models the nested `data` object in the successful registration response.
interface ApiRegisterData {
  id: string;
  username: string;
  email: string;
  mobile: string | null;
  job: string | null; // API might return empty string
}
// Models the entire API response for registration.
interface ApiRegisterResponse {
  status: "success" | "error";
  message: string;
  data: ApiRegisterData;
}
// The simplified response from our service's register method.
interface RegistrationServiceResponse {
  success: boolean;
  message: string;
  data?: ApiRegisterData;
}

// --- Login Types ---
// Models the entire API response for a successful login.
interface ApiLoginResponse {
  status: "success" | "error";
  message: string;
  user_id: string;
  username: string;
  access: string;
  refresh: string;
}
// The response from our service's login method.
interface LoginServiceResponse {
  user: User;
  token: string;
  refreshToken: string;
  message: string;
}

type AuthStateListener = (user: User | null) => void;

// ========================================================================
// MOCK: userService - UPDATED
// ========================================================================
const userService = {
  // The mock is updated to accept a string ID, matching our User interface.
  updateUser: async (
    userId: string,
    updateData: Partial<User>
  ): Promise<User> => {
    console.warn("Using MOCK userService.updateUser");
    const response = await apiWithRetry.patch<User>(
      `/users/${userId}/`,
      updateData
    );
    return response.data;
  },
};
// ========================================================================

// State management remains the same
let currentUser: User | null = null;
let authStateListeners: AuthStateListener[] = [];
// ... (addAuthStateListener and notifyAuthStateChange are unchanged)
const addAuthStateListener = (listener: AuthStateListener): (() => void) => {
  authStateListeners.push(listener);
  return () =>
    (authStateListeners = authStateListeners.filter((l) => l !== listener));
};
const notifyAuthStateChange = (user: User | null): void => {
  currentUser = user;
  authStateListeners.forEach((listener) => listener(user));
};
// ========================================================================

class AuthService {
  /**
   * Register a new user.
   * UPDATED to match POST /api/register/ response.
   */
  async register(
    userData: RegistrationData
  ): Promise<RegistrationServiceResponse> {
    try {
      // Input validation remains the same
      if (!userData.username || !userData.password || !userData.job) {
        throw new APIError(
          "Username, password, and job are required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const response = await apiWithRetry.post<ApiRegisterResponse>(
        "/register/",
        {
          username: userData.username,
          password: userData.password,
          email: userData.email,
          mobile: userData.mobile,
          job: userData.job,
          latitude: userData.latitude,
          longitude: userData.longitude,
        }
      );

      if (response.data.status !== "success") {
        throw new APIError(
          response.data.message || "Registration failed",
          HTTP_STATUS.BAD_REQUEST,
          response.data
        );
      }

      await AsyncStorage.setItem("user_job", userData.job);
      if (__DEV__)
        console.log("✅ Registration successful:", response.data.message);

      return {
        success: true,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.data?.message || "Registration failed",
        error.status || 500,
        error.data
      );
    }
  }

  /**
   * Login user with username and password.
   * UPDATED to match POST /api/login/ response.
   */
  async login(
    username: string,
    password: string
  ): Promise<LoginServiceResponse> {
    try {
      if (!username || !password) {
        throw new APIError(
          "Username and password are required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Use the correct '/login/' endpoint and expect the ApiLoginResponse shape
      const response = await apiWithRetry.post<ApiLoginResponse>("/login/", {
        username,
        password,
      });

      const {
        access,
        refresh,
        username: apiUsername,
        status,
        message,
      } = response.data;

      if (status !== "success" || !access) {
        throw new APIError(
          message || "Login failed",
          HTTP_STATUS.UNAUTHORIZED,
          response.data
        );
      }

      await setAuthToken(access);
      if (refresh) await AsyncStorage.setItem("refresh_token", refresh);

      const payload: JWTPayload = JSON.parse(decode(access.split(".")[1]!));
      const storedJob = await AsyncStorage.getItem("user_job");

      // Store username for later use during auto-login
      await AsyncStorage.setItem("username", apiUsername);

      const user: User = {
        id: payload.user_id, // Use the ID from the token payload for consistency
        username: apiUsername, // Use the username from the API response
        job: storedJob === "consumer" ? "consumer" : "farmer",
      };

      notifyAuthStateChange(user);
      if (__DEV__)
        console.log("✅ User logged in successfully:", user.username);

      return {
        user,
        token: access,
        refreshToken: refresh,
        message: "Login successful",
      };
    } catch (error: any) {
      console.error("Login error:", error);
      if (error instanceof APIError) {
        if (error.status === HTTP_STATUS.UNAUTHORIZED) {
          throw new APIError(
            "Invalid username or password",
            HTTP_STATUS.UNAUTHORIZED,
            error.data
          );
        }
        throw error;
      }
      throw new APIError("Login failed", error.status || 500, error.data);
    }
  }

  /**
   * Initialize authentication state from stored token.
   * UPDATED to handle string ID and check for empty user_id.
   */
  async initializeAuth(): Promise<User | null> {
    try {
      const token = await getStoredToken();
      if (!token) return null;

      const payload: JWTPayload = JSON.parse(decode(token.split(".")[1]!));

      // More robust checks for a valid token
      if (!payload.user_id || Date.now() >= payload.exp * 1000) {
        if (__DEV__)
          console.log("Token is invalid or expired, clearing session.");
        await this.logout();
        return null;
      }

      const storedJob = await AsyncStorage.getItem("user_job");
      const storedUsername = await AsyncStorage.getItem("username");

      const user: User = {
        id: payload.user_id,
        username: storedUsername || "User", // Use stored username or fallback to "User"
        job: storedJob === "consumer" ? "consumer" : "farmer",
      };

      notifyAuthStateChange(user);
      if (__DEV__) console.log("✅ Token validated, user auto-logged in");
      return user;
    } catch (error) {
      console.error(
        "Auth initialization error, token might be invalid:",
        error
      );
      await this.logout();
      return null;
    }
  }

  // --- Other methods (logout, getCurrentUser, etc.) are largely unchanged ---

  async logout(): Promise<void> {
    try {
      // Clear stored tokens and user data
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("refresh_token");
      await AsyncStorage.removeItem("username");
      await AsyncStorage.removeItem("user_job");

      // Clear current user state
      currentUser = null;
      notifyAuthStateChange(null);

      if (__DEV__) console.log("✅ User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }
  getCurrentUser(): User | null {
    return currentUser;
  }
  isAuthenticated(): boolean {
    return currentUser !== null;
  }
  onAuthStateChanged(listener: AuthStateListener): () => void {
    return addAuthStateListener(listener);
  }

  async updateProfile(updateData: Partial<User>): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new APIError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
    }
    // Note: This relies on the mock being updated to handle a string ID
    const updatedUser = await userService.updateUser(user.id, updateData);
    notifyAuthStateChange(updatedUser);
    if (__DEV__) console.log("🔄 Profile updated successfully");
    return updatedUser;
  }
}

const authService = new AuthService();
export default authService;
export { AuthService };
