import { ENV_CONFIG, PRICE_CONVERSION_RATES } from "../config/environment";

// Map configuration constants
export const MAP_CONFIG = {
  DEFAULT_ZOOM: ENV_CONFIG.MAP.DEFAULT_ZOOM,
  MIN_ZOOM: ENV_CONFIG.MAP.MIN_ZOOM,
  MAX_ZOOM: ENV_CONFIG.MAP.MAX_ZOOM,
  RADIUS: {
    MIN: 0, // 0km
    MAX: 500, // 500km
    DEFAULT: 10, // 10km default
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
  // Vegetables
  { label: "Ambat Chukka", value: "ambat chukka", icon: "🥬" },
  { label: "Ginger", value: "ginger", icon: "🫚" },
  { label: "Onion", value: "onion", icon: "🧅" },
  { label: "Cucumber", value: "cucumber", icon: "🥒" },
  { label: "Bitter Gourd", value: "bitter gourd", icon: "🥒" },
  { label: "Coriander Leaves", value: "coriander leaves", icon: "🌿" },
  { label: "Cabbage", value: "cabbage", icon: "🥬" },
  { label: "Cluster Beans", value: "cluster beans", icon: "🫘" },
  { label: "Carrot", value: "carrot", icon: "🥕" },
  { label: "Cowpea", value: "cowpea", icon: "🫘" },
  { label: "Tomato", value: "tomato", icon: "🍅" },
  { label: "Capsicum", value: "capsicum", icon: "🫑" },
  { label: "Bottle Gourd", value: "bottle gourd", icon: "🥒" },
  { label: "Ridge Gourd", value: "ridge gourd", icon: "🥒" },
  { label: "Spinach", value: "spinach", icon: "🥬" },
  { label: "Cauliflower", value: "cauliflower", icon: "🥦" },
  { label: "Potato", value: "potato", icon: "🥔" },
  { label: "Beetroot", value: "beetroot", icon: "🥕" },
  { label: "Ladies Finger", value: "ladies finger", icon: "🌱" },
  { label: "Pumpkin", value: "pumpkin", icon: "🎃" },
  { label: "Radish", value: "radish", icon: "🥕" },
  { label: "Fenugreek Leaves", value: "fenugreek leaves", icon: "🌿" },
  { label: "Garlic", value: "garlic", icon: "🧄" },
  { label: "Lemon", value: "lemon", icon: "🍋" },
  { label: "Brinjal", value: "brinjal", icon: "🍆" },
  { label: "Drumstick", value: "drumstick", icon: "🥬" },
  { label: "Green Chilli", value: "green chilli", icon: "🌶️" },

  // Fruits
  { label: "Pomegranate", value: "pomegranate", icon: "🍎" },
  { label: "Custard Apple", value: "custard apple", icon: "🍏" },
  { label: "Dragon Fruit", value: "dragon fruit", icon: "🐉" },
  { label: "Grapes", value: "grapes", icon: "🍇" },
  { label: "Guava", value: "guava", icon: "🍐" },
  { label: "Orange", value: "orange", icon: "🍊" },
  { label: "Papaya", value: "papaya", icon: "🥭" },
  { label: "Sapota", value: "sapota", icon: "🥔" },
  { label: "Banana", value: "banana", icon: "🍌" },
];

export const MAP_TYPES = [
  { label: "Satellite Map", value: "default" },
  { label: "Street Map", value: "street" },
];
