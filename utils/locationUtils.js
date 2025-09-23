/**
 * Location utilities for validating and handling location data
 */

/**
 * Validates if coordinates are valid
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {boolean}
 */
export const isValidCoordinate = (latitude, longitude) => {
    const isValid = (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude !== 0 &&
        longitude !== 0 &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );

    return isValid;
};

/**
 * Validates location object
 * @param {object} location 
 * @returns {boolean}
 */
export const isValidLocation = (location) => {
    if (!location) return false;

    // Handle both formats: location.coords.latitude and location.latitude
    let latitude, longitude;

    if (location.coords) {
        // Format: { coords: { latitude, longitude } }
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
    } else {
        // Format: { latitude, longitude }
        latitude = location.latitude;
        longitude = location.longitude;
    }

    return isValidCoordinate(latitude, longitude);
};

/**
 * Gets a fallback location (Delhi, India)
 * @returns {object}
 */
export const getFallbackLocation = () => ({
    coords: {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 100
    },
    timestamp: Date.now()
});

/**
 * Sanitizes location data and converts to consistent format
 * @param {object} location 
 * @returns {object|null}
 */
export const sanitizeLocation = (location) => {
    if (!isValidLocation(location)) {
        console.warn('Invalid location detected, using fallback');
        return getFallbackLocation();
    }

    // Convert to consistent format expected by global context
    let latitude, longitude, accuracy, timestamp;

    if (location.coords) {
        // Format: { coords: { latitude, longitude, accuracy }, timestamp }
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
        accuracy = location.coords.accuracy;
        timestamp = location.timestamp;
    } else {
        // Format: { latitude, longitude, accuracy }
        latitude = location.latitude;
        longitude = location.longitude;
        accuracy = location.accuracy;
        timestamp = location.timestamp || Date.now();
    }

    // Return in the format expected by global context (simple object)
    return {
        latitude,
        longitude,
        accuracy,
        timestamp
    };
};