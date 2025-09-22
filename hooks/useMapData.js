import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchCrops } from "../components/crud";
import { MAP_CONFIG } from "../constants/mapConfig";
import { authService } from "../services";

export const useMapData = () => {
  const [allConsumerCrops, setAllConsumerCrops] = useState([]);
  const [allFarmerCrops, setAllFarmerCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  // Fetch all crops data
  useEffect(() => {
    const fetchAllCrops = async () => {
      try {
        console.log("useMapData: Starting to fetch crops data...");
        setLoading(true);
        setAuthError(false);

        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log("useMapData: Fetch timeout after 30 seconds");
          setError(new Error("Request timeout - please check your internet connection"));
          setLoading(false);
        }, 30000); // 30 second timeout

        // Check authentication first
        const currentUser = authService.getCurrentUser();
        console.log("useMapData: Current user check:", currentUser);

        if (!currentUser) {
          console.log("useMapData: No authenticated user found");
          setAuthError(true);
          setError(new Error("Authentication required"));
          setLoading(false);
          return;
        }

        console.log("useMapData: User authenticated:", currentUser.username);

        // Test network connectivity first
        const { networkManager } = await import("../utils/networkUtils");
        const networkStatus = await networkManager.getNetworkStatus();
        console.log("useMapData: Network status:", networkStatus);

        if (!networkStatus.isConnected) {
          console.log("useMapData: No network connection detected");
          setError(new Error("No internet connection"));
          setLoading(false);
          return;
        }

        console.log("useMapData: Fetching consumer crops...");
        const consumerCrops = await fetchCrops("consumers");
        console.log("useMapData: Consumer crops received:", consumerCrops?.length || 0);

        console.log("useMapData: Fetching farmer crops...");
        const farmerCrops = await fetchCrops("farmers");
        console.log("useMapData: Farmer crops received:", farmerCrops?.length || 0);

        setAllConsumerCrops(consumerCrops || []);
        setAllFarmerCrops(farmerCrops || []);
        setError(null);
        setAuthError(false);

        console.log("useMapData: Successfully loaded all crop data");
        clearTimeout(timeoutId); // Clear timeout on success
      } catch (err) {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error("useMapData: Error fetching crops:", err);

        // Check if it's an authentication error
        if (err.status === 401 || err.status === 403 || err.message?.includes('Authentication')) {
          console.log("useMapData: Authentication error detected");
          setAuthError(true);
          setError(new Error("Authentication failed. Please login again."));
        } else {
          setError(err);
        }

        // Set empty arrays to prevent undefined errors
        setAllConsumerCrops([]);
        setAllFarmerCrops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCrops();
  }, []);

  // Combine all crops for backward compatibility
  const allCrops = useMemo(() => {
    const combined = [...allConsumerCrops, ...allFarmerCrops];
    console.log('useMapData: Combined crops:', {
      consumerCount: allConsumerCrops.length,
      farmerCount: allFarmerCrops.length,
      totalCount: combined.length,
      loading
    });
    return combined;
  }, [allConsumerCrops, allFarmerCrops, loading]);

  return {
    allConsumerCrops,
    allFarmerCrops,
    allCrops,
    loading,
    error,
    authError,
  };
};
