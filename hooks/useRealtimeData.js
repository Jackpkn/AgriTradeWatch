import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, doc } from "firebase/firestore";
import { db } from "../firebase";
import { realtimeCacheManager } from "../utils/realtimeCache";
import { networkManager } from "../utils/networkUtils";

export const useRealtimeData = (firestoreRef, cacheKey, options = {}) => {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes default
    enableOfflineSync = true,
    syncInterval = 30000,
    onError = null,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());

  const cleanupRef = useRef(null);

  const handleDataUpdate = useCallback(
    (newData, meta) => {
      setData(newData);
      setIsFromCache(meta.fromCache || false);
      setIsStale(meta.stale || false);
      setLoading(false);

      if (meta.error) {
        setError(meta.error);
        if (onError) onError(meta.error);
      } else {
        setError(null);
      }
    },
    [onError]
  );

  const refreshData = useCallback(async () => {
    if (!firestoreRef) return;

    setLoading(true);
    setError(null);

    try {
      await realtimeCacheManager.invalidateCache(cacheKey);
      // The real-time listener will automatically fetch fresh data
    } catch (err) {
      setError(err);
      setLoading(false);
      if (onError) onError(err);
    }
  }, [firestoreRef, cacheKey, onError]);

  useEffect(() => {
    if (!firestoreRef) {
      setLoading(false);
      return;
    }

    // Set up real-time data monitoring
    const setupRealtime = async () => {
      try {
        await realtimeCacheManager.setupRealtimeCache(cacheKey, firestoreRef, {
          maxAge,
          enableOfflineSync,
          onDataUpdate: handleDataUpdate,
          syncInterval,
        });
      } catch (err) {
        setError(err);
        setLoading(false);
        if (onError) onError(err);
      }
    };

    setupRealtime();

    // Cleanup function
    cleanupRef.current = () => {
      realtimeCacheManager.cleanup(cacheKey);
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [
    firestoreRef,
    cacheKey,
    maxAge,
    enableOfflineSync,
    syncInterval,
    handleDataUpdate,
    onError,
  ]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = networkManager.addListener((connected) => {
      setIsOnline(connected);

      if (connected && data && isFromCache) {
        // Network is back and we have cached data, refresh it
        refreshData();
      }
    });

    return unsubscribe;
  }, [data, isFromCache, refreshData]);

  return {
    data,
    loading,
    error,
    isFromCache,
    isStale,
    isOnline,
    refresh: refreshData,
    cleanup: () => cleanupRef.current?.(),
  };
};

// Hook for real-time crops data
export const useRealtimeCrops = (path, options = {}) => {
  const cacheKey = `realtime_crops_${path}`;
  const firestoreRef = path ? collection(db, path) : null;

  return useRealtimeData(firestoreRef, cacheKey, {
    maxAge: 2 * 60 * 1000, // 2 minutes for crops
    ...options,
  });
};

// Hook for real-time price data
export const useRealtimePrices = (cropId, location, options = {}) => {
  const cacheKey = `realtime_prices_${cropId}_${location}`;
  const firestoreRef = cropId
    ? query(
        collection(db, "prices")
        // Add your query constraints here
      )
    : null;

  return useRealtimeData(firestoreRef, cacheKey, {
    maxAge: 1 * 60 * 1000, // 1 minute for prices
    syncInterval: 15000, // 15 seconds
    ...options,
  });
};

// Hook for real-time user data
export const useRealtimeUser = (userId, options = {}) => {
  const cacheKey = `realtime_user_${userId}`;
  const firestoreRef = userId ? doc(db, "users", userId) : null;

  return useRealtimeData(firestoreRef, cacheKey, {
    maxAge: 10 * 60 * 1000, // 10 minutes for user data
    ...options,
  });
};
