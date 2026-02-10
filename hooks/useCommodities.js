/**
 * useCommodities Hook
 * Fetches and caches commodities from the API for use across the app
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCommodities, clearCommoditiesCache } from '../services/commoditiesService';

// Global cache to share across components
let globalCommodities = null;
let globalLoading = false;
let globalError = null;
let fetchPromise = null;

export const useCommodities = () => {
  const [commodities, setCommodities] = useState(globalCommodities || []);
  const [loading, setLoading] = useState(!globalCommodities);
  const [error, setError] = useState(globalError);

  const loadCommodities = useCallback(async (forceRefresh = false) => {
    // If already fetching, wait for that promise
    if (fetchPromise && !forceRefresh) {
      try {
        const result = await fetchPromise;
        setCommodities(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err);
        setLoading(false);
        return [];
      }
    }

    // If cached and not forcing refresh, use cache
    if (globalCommodities && !forceRefresh) {
      setCommodities(globalCommodities);
      setLoading(false);
      return globalCommodities;
    }

    setLoading(true);
    setError(null);

    fetchPromise = fetchCommodities(forceRefresh);

    try {
      const result = await fetchPromise;
      globalCommodities = result;
      globalLoading = false;
      globalError = null;
      setCommodities(result);
      setLoading(false);
      return result;
    } catch (err) {
      globalError = err;
      globalLoading = false;
      setError(err);
      setLoading(false);
      return [];
    } finally {
      fetchPromise = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await clearCommoditiesCache();
    return loadCommodities(true);
  }, [loadCommodities]);

  useEffect(() => {
    loadCommodities();
  }, [loadCommodities]);

  // Helper to get commodity by value
  const getCommodityByValue = useCallback((value) => {
    if (!value) return null;
    return commodities.find(c =>
      c.value.toLowerCase() === value.toLowerCase()
    );
  }, [commodities]);

  // Helper to get icon for a commodity
  const getIcon = useCallback((value) => {
    const commodity = getCommodityByValue(value);
    return commodity?.icon || '🌾';
  }, [getCommodityByValue]);

  // Group commodities by type
  const groupedCommodities = useCallback(() => {
    return commodities.reduce((acc, commodity) => {
      const type = commodity.type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(commodity);
      return acc;
    }, {});
  }, [commodities]);

  return {
    commodities,
    loading,
    error,
    refresh,
    getCommodityByValue,
    getIcon,
    groupedCommodities,
  };
};

// Export a function to preload commodities (can be called at app startup)
export const preloadCommodities = async () => {
  if (!globalCommodities) {
    try {
      globalCommodities = await fetchCommodities();
    } catch (error) {
      console.error('Failed to preload commodities:', error);
    }
  }
  return globalCommodities;
};

export default useCommodities;
