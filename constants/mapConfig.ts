import { ENV_CONFIG, PRICE_CONVERSION_RATES } from "../config/environment";

// Map configuration constants
export const MAP_CONFIG = {
  DEFAULT_ZOOM: ENV_CONFIG.MAP.DEFAULT_ZOOM,
  MIN_ZOOM: ENV_CONFIG.MAP.MIN_ZOOM,
  MAX_ZOOM: ENV_CONFIG.MAP.MAX_ZOOM,
  RADIUS: {
    MIN: 0.01, // 10m in km
    MAX: 0.7, // 700m in km
    DEFAULT: 0.1, // 100m in km (changed from 500m)
    DEBOUNCE_MS: ENV_CONFIG.MAP.DEBOUNCE_MS,
  },
  PRICE_CONVERSION: {
    RATES: PRICE_CONVERSION_RATES,
    UNITS: {
      PER_UNIT: "perUnit",
      PER_KG: "perKg",
    },
  },
  COLORS: {
    PRIMARY: "#49A760",
    SECONDARY: "#1F4E3D",
    INSIDE_RADIUS: "#49A760",
    OUTSIDE_RADIUS: "#FFA500",
    USER_LOCATION: "red",
  },
  EARTH_RADIUS_KM: 6371,
  MAX_MARKERS: ENV_CONFIG.MAP.MAX_MARKERS,
};

export const CROP_OPTIONS = [
  { label: "Onion", value: "onion", icon: "🧅" },
  { label: "Tomato", value: "tomato", icon: "🍅" },
  { label: "Drumstick", value: "drumstick", icon: "🥬" },
  { label: "Lemon", value: "lemon", icon: "🍋" },
];

export const MAP_TYPES = [
  { label: "Satellite Map", value: "default" },
  { label: "Street Map", value: "street" },
];
