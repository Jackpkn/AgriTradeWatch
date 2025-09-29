import { MAP_CONFIG } from "../constants/mapConfig";
import { performanceMonitor } from "./performance";

export const processChartData = (crops, selectedCrop, priceUnit) => {
  return performanceMonitor.measureDataProcessing(
    "processChartData",
    crops.length,
    () => {
      if (!crops.length) return [];

      const cropData = crops.filter(
        (crop) => {
          if (!crop || !selectedCrop) return false;
          const cropNameToCheck = crop.name || crop.commodity;
          return cropNameToCheck && cropNameToCheck.toLowerCase() === selectedCrop.toLowerCase();
        }
      );

      if (!cropData.length) return [];

      // Group by date
      const pricesByDate = {};

      cropData.forEach((crop) => {
        const timestamp =
          crop.location?.timestamp || crop.createdAt?.seconds * 1000;
        if (!timestamp) return;

        const date = new Date(timestamp);
        const dateKey = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });

        if (!pricesByDate[dateKey]) {
          pricesByDate[dateKey] = {
            prices: [],
            timestamp: timestamp,
          };
        }

        // Simplified conversion: 1 unit = 1 unit (no kg conversion needed)
        // Both per-unit and per-kg show the same price for simplicity
        const rawPrice = Number(crop.pricePerUnit) || 0;
        const price = Math.round(rawPrice); // Round immediately to prevent decimals

        console.log(`ChartDataProcessor: ${crop.name} - Raw Price: ${rawPrice}, Rounded Price: ${price}`);

        if (price > 0) {
          pricesByDate[dateKey].prices.push(price);
        }
      });

      // Convert to chart format
      const chartData = Object.entries(pricesByDate)
        .filter(([_, data]) => data.prices.length > 0)
        .map(([date, data]) => {
          const avgPrice =
            data.prices.reduce((sum, price) => sum + price, 0) /
            data.prices.length;
          const roundedPrice = Math.round(avgPrice);
          return {
            label: date,
            value: roundedPrice,
            dataPointText: `₹${roundedPrice}`,
            timestamp: data.timestamp,
            count: data.prices.length,
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      // Ensure we always return valid data or empty array
      return chartData.filter(
        (item) =>
          item.value > 0 && !isNaN(item.value) && typeof item.label === "string"
      );
    }
  );
};

export const calculateConsumerStats = (
  consumersInRadius,
  priceUnit,
  selectedCrop = "onion"
) => {
  return performanceMonitor.measureDataProcessing(
    "calculateConsumerStats",
    consumersInRadius.length,
    () => {
      console.log('calculateConsumerStats: Input data:', {
        consumersInRadius: consumersInRadius.length,
        priceUnit,
        selectedCrop
      });
      
      if (!consumersInRadius.length) {
        console.log('calculateConsumerStats: No consumers in radius');
        return { count: 0, averagePrice: 0, averagePricePerKg: 0 };
      }

      const prices = consumersInRadius
        .map((crop) => Math.round(Number(crop.pricePerUnit) || 0))
        .filter((price) => price > 0);

      const averagePrice =
        prices.length > 0
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length
          : 0;

      // Simplified conversion: 1 unit = 1 unit (no kg conversion needed)
      // Both per-unit and per-kg show the same price for simplicity
      const conversionRate = 1.0; // Always 1:1 ratio
      const averagePricePerKg = averagePrice * conversionRate; // Same as averagePrice

      const result = {
        count: consumersInRadius.length,
        averagePrice: Math.round(averagePrice),
        averagePricePerKg: Math.round(averagePricePerKg),
      };
      
      console.log('calculateConsumerStats: Calculated stats:', {
        prices: prices.length,
        validPrices: prices,
        result
      });
      
      return result;
    }
  );
};
