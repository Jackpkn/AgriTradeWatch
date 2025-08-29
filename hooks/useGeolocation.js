import { useState, useEffect, useCallback, useMemo } from "react";
import { MAP_CONFIG } from "../constants/mapConfig";

export const useGeolocation = () => {
  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = MAP_CONFIG.EARTH_RADIUS_KM;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  // Filter crops within radius
  const filterCropsInRadius = useCallback(
    (crops, markerPosition, radius, selectedCrop) => {
      if (!markerPosition || !crops.length) return [];

      return crops.filter((crop) => {
        // Check crop name matching (case insensitive)
        if (
          selectedCrop &&
          crop.name?.toLowerCase() !== selectedCrop.toLowerCase()
        ) {
          return false;
        }

        const cropLat = crop.location?.coords?.latitude;
        const cropLon = crop.location?.coords?.longitude;
        if (!cropLat || !cropLon) return false;

        const distance = calculateDistance(
          markerPosition.latitude,
          markerPosition.longitude,
          cropLat,
          cropLon
        );

        return distance <= radius;
      });
    },
    [calculateDistance]
  );

  return {
    calculateDistance,
    filterCropsInRadius,
  };
};
