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
        setLoading(true);
        const [consumerCrops, farmerCrops] = await Promise.all([
          fetchCrops("consumers"),
          fetchCrops("farmers"),
        ]);
        setAllConsumerCrops(consumerCrops);
        setAllFarmerCrops(farmerCrops);
        setError(null);
      } catch (err) {
        console.error("Error fetching crops:", err);
        setError(err);
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
