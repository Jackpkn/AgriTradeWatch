import { useState, useEffect, useMemo } from "react";

/**
 * Hook for virtualizing large datasets to improve performance
 * @param {Array} data - The full dataset
 * @param {number} threshold - Threshold above which to enable virtualization
 * @param {number} maxItems - Maximum items to show when virtualizing
 * @returns {Object} - { virtualizedData, isVirtualizing, totalCount }
 */
export const useVirtualizedData = (
  data = [],
  threshold = 1000,
  maxItems = 500
) => {
  const [isVirtualizing, setIsVirtualizing] = useState(false);

  // Check if we need to virtualize based on data size
  useEffect(() => {
    setIsVirtualizing(data.length > threshold);
  }, [data.length, threshold]);

  // Create virtualized dataset
  const virtualizedCrops = useMemo(() => {
    if (!isVirtualizing) return data;

    // For now, just take the first N items
    // In a more sophisticated implementation, this could be based on:
    // - Geographic proximity to current location
    // - Recent activity/timestamps
    // - User preferences
    return data.slice(0, maxItems);
  }, [data, isVirtualizing, maxItems]);

  return {
    virtualizedCrops,
    isVirtualizing,
    totalCount: data.length,
    displayedCount: virtualizedCrops.length,
  };
};
