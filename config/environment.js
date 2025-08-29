/**
 * Price conversion rates for different crops
 * Simplified: 1 unit = 1 unit (no complex kg conversion)
 * Both per-unit and per-kg show the same price for simplicity
 */
export const PRICE_CONVERSION_RATES = {
  DEFAULT_MULTIPLIER: 1.0,  // 1:1 conversion
  CROP_SPECIFIC: {
    onion: 1.0,     // 1 unit = 1 unit
    tomato: 1.0,    // 1 unit = 1 unit
    drumstick: 1.0, // 1 unit = 1 unit
    lemon: 1.0,     // 1 unit = 1 unit
    wheat: 1.0,     // 1 unit = 1 unit
    grape: 1.0,     // 1 unit = 1 unit
    coriander: 1.0, // 1 unit = 1 unit
    garlic: 1.0,    // 1 unit = 1 unit
    rice: 1.0,      // 1 unit = 1 unit
  },
};

/**
 * Environment-specific configuration
 */
const ENV_CONFIGS = {
  // Development settings
  development: {
    enablePerformanceMonitoring: true,
    enableDebugLogs: true,
    mapRefreshInterval: 5000, // 5 seconds
    maxCropsToDisplay: 1000,
    enableVirtualization: true,
    virtualizationThreshold: 500,
    MAP: {
      DEFAULT_ZOOM: 13,
      MIN_ZOOM: 8,
      MAX_ZOOM: 20,
      DEBOUNCE_MS: 150,
      MAX_MARKERS: 1000,
    },
  },

  // Production settings
  production: {
    enablePerformanceMonitoring: false,
    enableDebugLogs: false,
    mapRefreshInterval: 30000, // 30 seconds
    maxCropsToDisplay: 2000,
    enableVirtualization: true,
    virtualizationThreshold: 1000,
    MAP: {
      DEFAULT_ZOOM: 13,
      MIN_ZOOM: 8,
      MAX_ZOOM: 19,
      DEBOUNCE_MS: 300,
      MAX_MARKERS: 2000,
    },
  },

  // Test settings
  test: {
    enablePerformanceMonitoring: false,
    enableDebugLogs: false,
    mapRefreshInterval: 1000, // 1 second for faster tests
    maxCropsToDisplay: 100,
    enableVirtualization: false,
    virtualizationThreshold: 50,
    MAP: {
      DEFAULT_ZOOM: 13,
      MIN_ZOOM: 8,
      MAX_ZOOM: 18,
      DEBOUNCE_MS: 100,
      MAX_MARKERS: 100,
    },
  },
};

// Get current environment
const getCurrentEnvironment = () => {
  if (__DEV__) return "development";
  if (process.env.NODE_ENV === "test") return "test";
  return "production";
};

// Export current config
export const CURRENT_ENV = getCurrentEnvironment();
export const ENV_CONFIG = ENV_CONFIGS[CURRENT_ENV];

// Combined configuration
export const CONFIG = {
  ...ENV_CONFIG,
  environment: CURRENT_ENV,
  PRICE_CONVERSION_RATES,
};

/**
 * Get configuration value with fallback
 * @param {string} key - Configuration key
 * @param {any} fallback - Fallback value if key not found
 * @returns {any} - Configuration value or fallback
 */
export const getConfig = (key, fallback = null) => {
  return CONFIG[key] !== undefined ? CONFIG[key] : fallback;
};

/**
 * Check if feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} - Whether feature is enabled
 */
export const isFeatureEnabled = (feature) => {
  return getConfig(feature, false) === true;
};

/**
 * Get price conversion rate for a specific crop
 * @param {string} cropName - Name of the crop
 * @returns {number} - Conversion multiplier
 */
export const getPriceConversionRate = (cropName) => {
  return (
    PRICE_CONVERSION_RATES.CROP_SPECIFIC[cropName] ||
    PRICE_CONVERSION_RATES.DEFAULT_MULTIPLIER
  );
};
