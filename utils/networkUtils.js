import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

class NetworkManager {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
    this.init();
  }

  init() {
    // Listen for network state changes
    NetInfo.addEventListener((state) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable;

      console.log("Network state changed:", {
        isConnected: this.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Notify listeners if connection status changed
      if (wasConnected !== this.isConnected) {
        this.notifyListeners(this.isConnected);
      }
    });
  }

  // Add listener for network changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  // Notify all listeners
  notifyListeners(isConnected) {
    this.listeners.forEach((callback) => callback(isConnected));
  }

  // Get current network status
  async getNetworkStatus() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected && state.isInternetReachable;
    return {
      isConnected: this.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };
  }

  // Check if device is online
  isOnline() {
    return this.isConnected;
  }
}

// Cache management
export class CacheManager {
  static CACHE_KEYS = {
    USER_DATA: "cached_user_data",
    CONSUMER_CROPS: "cached_consumer_crops",
    FARMER_CROPS: "cached_farmer_crops",
    LAST_SYNC: "last_sync_timestamp",
  };

  // Save data to cache
  static async saveToCache(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: "1.0",
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`Data cached successfully for key: ${key}`);
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }

  // Get data from cache
  static async getFromCache(key, maxAge = 24 * 60 * 60 * 1000) {
    // 24 hours default
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      if (!cachedItem) return null;

      const { data, timestamp } = JSON.parse(cachedItem);
      const age = Date.now() - timestamp;

      if (age > maxAge) {
        console.log(`Cache expired for key: ${key}`);
        await AsyncStorage.removeItem(key);
        return null;
      }

      console.log(`Cache hit for key: ${key}, age: ${Math.round(age / 1000)}s`);
      return data;
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  }

  // Clear specific cache
  static async clearCache(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Cache cleared for key: ${key}`);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  // Clear all app cache
  static async clearAllCache() {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log("All cache cleared");
    } catch (error) {
      console.error("Error clearing all cache:", error);
    }
  }

  // Get cache info
  static async getCacheInfo() {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      const cacheInfo = {};

      for (const key of keys) {
        const cachedItem = await AsyncStorage.getItem(key);
        if (cachedItem) {
          const { timestamp } = JSON.parse(cachedItem);
          cacheInfo[key] = {
            lastUpdated: new Date(timestamp).toLocaleString(),
            age: Date.now() - timestamp,
          };
        }
      }

      return cacheInfo;
    } catch (error) {
      console.error("Error getting cache info:", error);
      return {};
    }
  }
}

// Enhanced fetch with offline support
export class OfflineCapableAPI {
  static async fetchWithCache(fetchFunction, cacheKey, options = {}) {
    const {
      maxAge = 24 * 60 * 60 * 1000, // 24 hours
      forceRefresh = false,
      fallbackToCache = true,
    } = options;

    // If force refresh is not requested and we have valid cache, use it
    if (!forceRefresh) {
      const cachedData = await CacheManager.getFromCache(cacheKey, maxAge);
      if (cachedData && networkManager.isOnline()) {
        console.log(`Using cached data for ${cacheKey}`);
        return { data: cachedData, fromCache: true };
      }
    }

    // Try to fetch fresh data if online
    if (networkManager.isOnline()) {
      try {
        console.log(`Fetching fresh data for ${cacheKey}`);
        const freshData = await fetchFunction();

        // Cache the fresh data
        await CacheManager.saveToCache(cacheKey, freshData);

        return { data: freshData, fromCache: false };
      } catch (error) {
        console.error(`Error fetching fresh data for ${cacheKey}:`, error);

        // If fetch fails but we have cache, use it
        if (fallbackToCache) {
          const cachedData = await CacheManager.getFromCache(
            cacheKey,
            Infinity
          ); // Accept any age
          if (cachedData) {
            console.log(`Falling back to cached data for ${cacheKey}`);
            return { data: cachedData, fromCache: true, error };
          }
        }

        throw error;
      }
    } else {
      // Offline - try to use cached data
      console.log("App is offline, trying to get cached data...");
      const cachedData = await CacheManager.getFromCache(cacheKey, Infinity); // Accept any age when offline

      if (cachedData) {
        console.log(`Using offline cached data for ${cacheKey}`);
        return { data: cachedData, fromCache: true, offline: true };
      } else {
        throw new Error("No internet connection and no cached data available");
      }
    }
  }
}

// Singleton instance
export const networkManager = new NetworkManager();

// Utility functions
export const getNetworkStatus = () => networkManager.getNetworkStatus();
export const isOnline = () => networkManager.isOnline();
export const addNetworkListener = (callback) =>
  networkManager.addListener(callback);
