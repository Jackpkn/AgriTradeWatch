// App-wide Constants for AgriTradeWatch/MandiGo

// Crop Units
export const CROP_UNITS = [
  { id: "kg", label: "Kg", name: "Kilogram" },
  { id: "quintal", label: "Quintal", name: "Quintal" },
  { id: "tonn", label: "Tonn", name: "Metric Ton" },
  { id: "250 gm", label: "250 gm", name: "250 Grams" },
  { id: "bundle", label: "Bundle", name: "Bundle" },
  { id: "piece", label: "Piece", name: "Piece" },
  { id: "dozen", label: "Dozen", name: "Dozen" },
];

// Damage Crop Units
export const DAMAGE_UNITS = [
  { id: "ACRES", label: "Acres", name: "Acres" },
  { id: "TONN", label: "Ton", name: "Ton" },
];

// Damage Place Options
export const DAMAGE_PLACE = [
  { id: "on_field", label: "On Field", name: "On Field" },
  { id: "on_market", label: "On Market", name: "On Market" },
];

// Production Methods
export const PRODUCTION_METHODS = [
  { id: "organic", label: "Organic", name: "Organic" },
  { id: "inorganic", label: "Inorganic", name: "Inorganic" },
];

// Production Levels
export const PRODUCTION_LEVELS = [
  { id: "selling_surplus", label: "Selling Surplus", name: "Selling Surplus" },
  { id: "selling_surplus_with_value_addition", label: "Selling Surplus with Value Addition", name: "Selling Surplus with Value Addition" },
];

// Common Commodities (can be expanded)
export const COMMODITIES = [
  // Original items
  "Wheat",
  "Sugarcane",
  "Maize",
  "Ghee",
  "Honey",

  // Vegetables
  "Ambat Chukka",
  "Ginger",
  "Onion",
  "Cucumber",
  "Bitter Gourd",
  "Coriander Leaves",
  "Cabbage",
  "Cluster Beans",
  "Carrot",
  "Cowpea",
  "Tomato",
  "Capsicum",
  "Bottle Gourd",
  "Ridge Gourd",
  "Spinach",
  "Cauliflower",
  "Potato",
  "Beetroot",
  "Ladies Finger",
  "Pumpkin",
  "Radish",
  "Fenugreek Leaves",
  "Garlic",
  "Lemon",
  "Brinjal",
  "Drumstick",
  "Green Chilli",

  // Fruits
  "Pomegranate",
  "Custard Apple",
  "Dragon Fruit",
  "Grapes",
  "Guava",
  "Orange",
  "Papaya",
  "Sapota",
  "Banana",
] as const;

// Ensure the array is frozen to prevent modifications
export const COMMODITIES_LIST = Object.freeze([...COMMODITIES]);

// Crop emojis for map markers
export const CROP_EMOJIS: Record<string, string> = {
  // Vegetables
  "ambat chukka": "🥬",
  "ginger": "🫚",
  "onion": "🧅",
  "cucumber": "🥒",
  "bitter gourd": "🥒",
  "coriander leaves": "🌿",
  "cabbage": "🥬",
  "cluster beans": "🫘",
  "carrot": "🥕",
  "cowpea": "🫘",
  "tomato": "🍅",
  "capsicum": "🫑",
  "bottle gourd": "🥒",
  "ridge gourd": "🥒",
  "spinach": "🥬",
  "cauliflower": "🥦",
  "potato": "🥔",
  "beetroot": "🥕",
  "ladies finger": "🌱",
  "pumpkin": "🎃",
  "radish": "🥕",
  "fenugreek leaves": "🌿",
  "garlic": "🧄",
  "lemon": "🍋",
  "brinjal": "🍆",
  "drumstick": "🥬",
  "green chilli": "🌶️",

  // Fruits
  "pomegranate": "🍎",
  "custard apple": "🍏",
  "dragon fruit": "🐉",
  "grapes": "🍇",
  "guava": "🍐",
  "orange": "🍊",
  "papaya": "🥭",
  "sapota": "🥔",
  "banana": "🍌",

  // Grains and others
  "wheat": "🌾",
  "sugarcane": "🎋",
  "maize": "🌽",
  "ghee": "🧈",
  "honey": "🍯",

  // Default
  "default": "📍",
};
