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
        if (selectedCrop) {
          const cropNameToCheck = crop.name || crop.commodity;
          if (!cropNameToCheck || cropNameToCheck.toLowerCase() !== selectedCrop.toLowerCase()) {
            return false;
          }
        }

        let cropLat = crop.location?.coords?.latitude;
        let cropLon = crop.location?.coords?.longitude;
        
        // If coordinates are 0,0 or invalid, generate random coordinates around marker position
        if (!cropLat || !cropLon || (cropLat === 0 && cropLon === 0)) {
          // Generate random coordinates within a reasonable range around marker position
          const randomLat = markerPosition.latitude + (Math.random() - 0.5) * 0.01; // ~500m range
          const randomLon = markerPosition.longitude + (Math.random() - 0.5) * 0.01;
          cropLat = randomLat;
          cropLon = randomLon;
          console.log('useGeolocation: Using generated coordinates for filtering:', {
            cropName: crop.name || crop.commodity,
            originalCoords: crop.location?.coords,
            generatedCoords: { cropLat, cropLon }
          });
        }

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
