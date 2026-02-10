/**
 * Commodities Service
 * Fetches commodity/crop data from the API
 */

import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'commodities_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Icon mapping for commodities
const COMMODITY_ICONS = {
  // Vegetables
  'ambat chukka': '🥬',
  'sorrel leaves': '🥬',
  'ginger': '🫚',
  'onion': '🧅',
  'cucumber': '🥒',
  'bitter gourd': '🥒',
  'coriander leaves': '🌿',
  'coriander': '🌿',
  'cabbage': '🥬',
  'cluster beans': '🫘',
  'gawar': '🫘',
  'carrot': '🥕',
  'cowpea': '🫘',
  'chawli': '🫘',
  'tomato': '🍅',
  'capsicum': '🫑',
  'shimla mirch': '🫑',
  'bottle gourd': '🥒',
  'ridge gourd': '🥒',
  'dodka': '🥒',
  'spinach': '🥬',
  'cauliflower': '🥦',
  'potato': '🥔',
  'beetroot': '🥕',
  'ladies finger': '🌱',
  'okra': '🌱',
  'pumpkin': '🎃',
  'radish': '🥕',
  'fenugreek leaves': '🌿',
  'garlic': '🧄',
  'lemon': '🍋',
  'brinjal': '🍆',
  'drumstick': '🥬',
  'green chilli': '🌶️',
  // Fruits
  'pomegranate': '🍎',
  'custard apple': '🍏',
  'dragon fruit': '🐉',
  'grapes': '🍇',
  'guava': '🍐',
  'orange': '🍊',
  'papaya': '🥭',
  'sapota': '🥔',
  'chikoo': '🥔',
  'banana': '🍌',
  'sugarcane': '🎋',
  // Pulses
  'chana dal': '🫘',
  'tur dal': '🫘',
  'moong dal': '🫘',
  // Default
  'default': '🌾',
};

// Get icon for a commodity
const getIconForCommodity = (name) => {
  const lowerName = name.toLowerCase();

  // Check for exact match
  if (COMMODITY_ICONS[lowerName]) {
    return COMMODITY_ICONS[lowerName];
  }

  // Check for partial match
  for (const [key, icon] of Object.entries(COMMODITY_ICONS)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }

  return COMMODITY_ICONS['default'];
};

// Generate labelKey for translations
const generateLabelKey = (name) => {
  // Convert "Bitter Gourd" to "cropBitterGourd"
  const cleaned = name
    .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical text
    .trim()
    .split(' ')
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
  return `crop${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}`;
};

// Transform API response to app format
const transformCommodities = (apiData) => {
  return apiData.map(item => {
    // Extract base name without parenthetical aliases
    const baseName = item.name.replace(/\s*\([^)]*\)/g, '').trim();
    const value = baseName.toLowerCase();

    return {
      id: item.id,
      label: item.name,
      value: value,
      icon: getIconForCommodity(item.name),
      labelKey: generateLabelKey(baseName),
      type: item.type,
      alias_marathi: item.alias_marathi,
    };
  });
};

// Fetch commodities from API
export const fetchCommodities = async (forceRefresh = false) => {
  try {
    // Check cache first
    if (!forceRefresh) {
      const cached = await getCachedCommodities();
      if (cached) {
        console.log('📦 Using cached commodities:', cached.length);
        return cached;
      }
    }

    console.log('🌐 Fetching commodities from API...');
    const response = await api.get('/commodities/');

    if (response.data && Array.isArray(response.data)) {
      const transformed = transformCommodities(response.data);

      // Cache the result
      await cacheCommodities(transformed);

      console.log('✅ Fetched commodities:', transformed.length);
      return transformed;
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('❌ Error fetching commodities:', error);

    // Try to return cached data as fallback
    const cached = await getCachedCommodities();
    if (cached) {
      console.log('📦 Using cached commodities as fallback:', cached.length);
      return cached;
    }

    // Return fallback data if no cache
    return getFallbackCommodities();
  }
};

// Get cached commodities
const getCachedCommodities = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (!isExpired) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading commodities cache:', error);
  }
  return null;
};

// Cache commodities
const cacheCommodities = async (data) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error caching commodities:', error);
  }
};

// Clear commodities cache
export const clearCommoditiesCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing commodities cache:', error);
  }
};

// Fallback commodities (used when API fails and no cache)
const getFallbackCommodities = () => {
  console.log('⚠️ Using fallback commodities');
  return [
    { id: 19, label: 'Onion', value: 'onion', icon: '🧅', labelKey: 'cropOnion', type: 'vegetable' },
    { id: 20, label: 'Tomato', value: 'tomato', icon: '🍅', labelKey: 'cropTomato', type: 'vegetable' },
    { id: 21, label: 'Potato', value: 'potato', icon: '🥔', labelKey: 'cropPotato', type: 'vegetable' },
    { id: 23, label: 'Carrot', value: 'carrot', icon: '🥕', labelKey: 'cropCarrot', type: 'vegetable' },
    { id: 24, label: 'Ginger', value: 'ginger', icon: '🫚', labelKey: 'cropGinger', type: 'vegetable' },
    { id: 25, label: 'Garlic', value: 'garlic', icon: '🧄', labelKey: 'cropGarlic', type: 'vegetable' },
    { id: 26, label: 'Green Chilli', value: 'green chilli', icon: '🌶️', labelKey: 'cropGreenChilli', type: 'vegetable' },
    { id: 32, label: 'Pomegranate', value: 'pomegranate', icon: '🍎', labelKey: 'cropPomegranate', type: 'fruit' },
    { id: 31, label: 'Guava', value: 'guava', icon: '🍐', labelKey: 'cropGuava', type: 'fruit' },
    { id: 34, label: 'Ambat Chukka', value: 'ambat chukka', icon: '🥬', labelKey: 'cropAmbatChukka', type: 'vegetable' },
  ];
};

export default {
  fetchCommodities,
  clearCommoditiesCache,
};
