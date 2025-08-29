import { onSnapshot, doc, collection, query } from "firebase/firestore";
import { db } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { networkManager } from "./networkUtils";

export class RealtimeCacheManager {
  constructor() {
    this.activeListeners = new Map();
    this.cacheKeys = {
      REALTIME_CROPS: "realtime_crops",
      REALTIME_PRICES: "realtime_prices",
      REALTIME_USER_DATA: "realtime_user_data",
    };
    this.subscriptions = new Map();
  }

  // Enhanced cache strategy for real-time data
  async setupRealtimeCache(cacheKey, firestoreRef, options = {}) {
    const {
      maxAge = 5 * 60 * 1000, // 5 minutes for real-time data
      enableOfflineSync = true,
      onDataUpdate = null,
      syncInterval = 30000, // 30 seconds
    } = options;

    // First, try to get cached data for immediate display
    const cachedData = await this.getFromCache(cacheKey, maxAge);

    if (cachedData && onDataUpdate) {
      onDataUpdate(cachedData, { fromCache: true });
    }

    // Set up real-time listener if online
    if (networkManager.isOnline()) {
      const unsubscribe = onSnapshot(
        firestoreRef,
        (snapshot) => {
          let data;

          if (snapshot.docs) {
            // Collection snapshot
            data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              _lastUpdated: Date.now(),
            }));
          } else {
            // Document snapshot
            data = snapshot.exists()
              ? {
                  id: snapshot.id,
                  ...snapshot.data(),
                  _lastUpdated: Date.now(),
                }
              : null;
          }

          // Cache the real-time data
          this.saveToCache(cacheKey, data);

          // Notify callback with fresh data
          if (onDataUpdate) {
            onDataUpdate(data, { fromCache: false, realtime: true });
          }
        },
        (error) => {
          console.error(`Real-time listener error for ${cacheKey}:`, error);

          // Fallback to cached data on error
          if (enableOfflineSync && cachedData && onDataUpdate) {
            onDataUpdate(cachedData, { fromCache: true, error: true });
          }
        }
      );

      // Store the unsubscribe function
      this.subscriptions.set(cacheKey, unsubscribe);
    } else {
      // Offline mode - set up periodic cache refresh
      if (enableOfflineSync) {
        this.setupOfflineSync(
          cacheKey,
          firestoreRef,
          onDataUpdate,
          syncInterval
        );
      }
    }

    return cachedData;
  }

  // Offline sync mechanism
  setupOfflineSync(cacheKey, firestoreRef, onDataUpdate, interval) {
    const syncTimer = setInterval(async () => {
      if (networkManager.isOnline()) {
        // Network is back, set up real-time listener
        clearInterval(syncTimer);
        this.setupRealtimeCache(cacheKey, firestoreRef, { onDataUpdate });
      } else {
        // Still offline, check for any cached updates
        const cachedData = await this.getFromCache(cacheKey);
        if (cachedData && onDataUpdate) {
          onDataUpdate(cachedData, { fromCache: true, offline: true });
        }
      }
    }, interval);

    return () => clearInterval(syncTimer);
  }

  // Smart cache with staleness detection
  async getRealtimeData(cacheKey, fetchFunction, options = {}) {
    const {
      maxStaleTime = 2 * 60 * 1000, // 2 minutes
      backgroundRefresh = true,
    } = options;

    const cachedData = await this.getFromCache(cacheKey);

    if (cachedData) {
      const age = Date.now() - (cachedData._lastUpdated || 0);

      // Return cached data immediately if it's fresh enough
      if (age < maxStaleTime) {
        return { data: cachedData, fromCache: true, fresh: true };
      }

      // Data is stale but we'll return it and refresh in background
      if (backgroundRefresh && networkManager.isOnline()) {
        this.refreshInBackground(cacheKey, fetchFunction);
      }

      return { data: cachedData, fromCache: true, stale: true };
    }

    // No cached data, fetch fresh
    if (networkManager.isOnline()) {
      try {
        const freshData = await fetchFunction();
        await this.saveToCache(cacheKey, {
          ...freshData,
          _lastUpdated: Date.now(),
        });
        return { data: freshData, fromCache: false };
      } catch (error) {
        throw new Error(`Failed to fetch real-time data: ${error.message}`);
      }
    }

    throw new Error("No internet connection and no cached data available");
  }

  // Background refresh for stale data
  async refreshInBackground(cacheKey, fetchFunction) {
    try {
      console.log(`Background refresh for ${cacheKey}`);
      const freshData = await fetchFunction();
      await this.saveToCache(cacheKey, {
        ...freshData,
        _lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error(`Background refresh failed for ${cacheKey}:`, error);
    }
  }

  // Cache invalidation for real-time updates
  async invalidateCache(cacheKey) {
    try {
      await AsyncStorage.removeItem(cacheKey);
      console.log(`Cache invalidated for ${cacheKey}`);
    } catch (error) {
      console.error(`Error invalidating cache for ${cacheKey}:`, error);
    }
  }

  // Selective cache update (for partial updates)
  async updateCacheItem(cacheKey, itemId, updatedFields) {
    try {
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        const updatedData = cachedData.map((item) =>
          item.id === itemId
            ? { ...item, ...updatedFields, _lastUpdated: Date.now() }
            : item
        );
        await this.saveToCache(cacheKey, updatedData);
      }
    } catch (error) {
      console.error(`Error updating cache item:`, error);
    }
  }

  // Clean up listeners
  cleanup(cacheKey) {
    const unsubscribe = this.subscriptions.get(cacheKey);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(cacheKey);
    }
  }

  // Clean up all listeners
  cleanupAll() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }

  // Cache management methods
  async saveToCache(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: "1.0",
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }

  async getFromCache(key, maxAge = Infinity) {
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      if (!cachedItem) return null;

      const { data, timestamp } = JSON.parse(cachedItem);
      const age = Date.now() - timestamp;

      if (age > maxAge) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  }
}

export const realtimeCacheManager = new RealtimeCacheManager();
