import { MAP_CONFIG } from "../constants/mapConfig";
import { performanceMonitor } from "./performance";

export const processChartData = (crops, selectedCrop, priceUnit) => {
  return performanceMonitor.measureDataProcessing(
    "processChartData",
    crops.length,
    () => {
      if (!crops.length) return [];

      const cropData = crops.filter(
        (crop) =>
          selectedCrop &&
          crop.name?.toLowerCase() === selectedCrop.toLowerCase()
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

        // Use crop-specific conversion rates
        const conversionRate =
          MAP_CONFIG.PRICE_CONVERSION.RATES[selectedCrop]?.perKgMultiplier || 2;
        const price =
          priceUnit === MAP_CONFIG.PRICE_CONVERSION.UNITS.PER_KG
            ? (Number(crop.pricePerUnit) || 0) * conversionRate
            : Number(crop.pricePerUnit) || 0;

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
      if (!consumersInRadius.length) {
        return { count: 0, averagePrice: 0, averagePricePerKg: 0 };
      }

      const prices = consumersInRadius
        .map((crop) => Number(crop.pricePerUnit) || 0)
        .filter((price) => price > 0);

      const averagePrice =
        prices.length > 0
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length
          : 0;

      // Use crop-specific conversion rate
      const conversionRate =
        MAP_CONFIG.PRICE_CONVERSION.RATES[selectedCrop]?.perKgMultiplier || 2;
      const averagePricePerKg = averagePrice * conversionRate;

      return {
        count: consumersInRadius.length,
        averagePrice: Math.round(averagePrice),
        averagePricePerKg: Math.round(averagePricePerKg),
      };
    }
  );
};
