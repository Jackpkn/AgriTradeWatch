import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchCrops } from "../components/crud";
import { MAP_CONFIG } from "../constants/mapConfig";

export const useMapData = () => {
  const [allConsumerCrops, setAllConsumerCrops] = useState([]);
  const [allFarmerCrops, setAllFarmerCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all crops data
  useEffect(() => {
    const fetchAllCrops = async () => {
      try {
        console.log("useMapData: Starting to fetch crops data...");
        setLoading(true);

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

        console.log("useMapData: Successfully loaded all crop data");
      } catch (err) {
        console.error("useMapData: Error fetching crops:", err);
        setError(err);
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
  const allCrops = useMemo(
    () => [...allConsumerCrops, ...allFarmerCrops],
    [allConsumerCrops, allFarmerCrops]
  );

  return {
    allConsumerCrops,
    allFarmerCrops,
    allCrops,
    loading,
    error,
  };
};
