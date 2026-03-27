import { Dimensions } from 'react-native';
import { useState, useEffect } from 'react';

/**
 * Utility functions for handling orientation changes across the app
 */

/**
 * Get current screen dimensions
 * @returns {Object} Screen dimensions object
 */
export const getScreenDimensions = () => {
  return Dimensions.get('window');
};

/**
 * Check if device is in landscape mode
 * @returns {boolean} True if landscape, false if portrait
 */
export const checkIsLandscape = () => {
  const { width, height } = getScreenDimensions();
  return width > height;
};

/**
 * Get responsive breakpoints based on screen width
 * @param {number} width - Screen width
 * @returns {Object} Breakpoint object
 */
export const getBreakpoints = (width) => {
  return {
    isSmall: width < 400,
    isMedium: width >= 400 && width < 768,
    isLarge: width >= 768 && width < 1024,
    isXLarge: width >= 1024,
    isTablet: width >= 768,
    isPhone: width < 768,
  };
};

/**
 * Get responsive grid columns based on screen size and orientation
 * @param {boolean} isLandscape - Whether device is in landscape mode
 * @param {number} width - Screen width
 * @returns {number} Number of columns
 */
export const getGridColumns = (isLandscape, width) => {
  if (isLandscape) {
    if (width >= 1024) return 4; // Large tablets/desktop
    if (width >= 768) return 3;  // Tablets
    return 2; // Phones in landscape
  } else {
    if (width >= 768) return 2;  // Tablets in portrait
    return 1; // Phones in portrait
  }
};

/**
 * Get responsive card width based on screen size and orientation
 * @param {boolean} isLandscape - Whether device is in landscape mode
 * @param {number} width - Screen width
 * @param {number} columns - Number of columns
 * @param {number} gap - Gap between items
 * @param {number} padding - Horizontal padding
 * @returns {string} CSS width value
 */
export const getCardWidth = (isLandscape, width, columns = 2, gap = 16, padding = 40) => {
  const availableWidth = width - padding - (gap * (columns - 1));
  const cardWidth = availableWidth / columns;
  return `${cardWidth}px`;
};

/**
 * Get responsive font size based on screen size
 * @param {number} baseSize - Base font size
 * @param {boolean} isLandscape - Whether device is in landscape mode
 * @param {number} width - Screen width
 * @returns {number} Responsive font size
 */
export const getResponsiveFontSize = (baseSize, isLandscape, width) => {
  if (isLandscape) {
    if (width >= 1024) return baseSize * 1.1;
    if (width >= 768) return baseSize * 1.05;
    return baseSize;
  } else {
    if (width >= 768) return baseSize * 1.05;
    return baseSize;
  }
};

/**
 * Get responsive padding based on screen size and orientation
 * @param {boolean} isLandscape - Whether device is in landscape mode
 * @param {number} width - Screen width
 * @param {number} basePadding - Base padding value
 * @returns {number} Responsive padding
 */
export const getResponsivePadding = (isLandscape, width, basePadding = 20) => {
  if (isLandscape) {
    if (width >= 1024) return basePadding * 1.5;
    if (width >= 768) return basePadding * 1.25;
    return basePadding;
  } else {
    if (width >= 768) return basePadding * 1.25;
    return basePadding;
  }
};

/**
 * Get responsive spacing based on screen size and orientation
 * @param {boolean} isLandscape - Whether device is in landscape mode
 * @param {number} width - Screen width
 * @param {number} baseSpacing - Base spacing value
 * @returns {number} Responsive spacing
 */
export const getResponsiveSpacing = (isLandscape, width, baseSpacing = 16) => {
  if (isLandscape) {
    if (width >= 1024) return baseSpacing * 1.5;
    if (width >= 768) return baseSpacing * 1.25;
    return baseSpacing;
  } else {
    if (width >= 768) return baseSpacing * 1.25;
    return baseSpacing;
  }
};

/**
 * Create responsive styles object
 * @param {boolean} isLandscape - Whether device is in landscape mode
 * @param {number} width - Screen width
 * @param {Function} styleFunction - Function that returns styles
 * @returns {Object} Responsive styles object
 */
export const createResponsiveStyles = (isLandscape, width, styleFunction) => {
  const breakpoints = getBreakpoints(width);
  return styleFunction(isLandscape, width, breakpoints);
};

/**
 * Hook for orientation state management
 * @returns {Object} Orientation state and utilities
 */
export const useOrientation = () => {
  const [screenData, setScreenData] = useState(getScreenDimensions());
  const [isLandscape, setIsLandscape] = useState(checkIsLandscape());

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
      setIsLandscape(result.window.width > result.window.height);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    // Set initial orientation
    const initialDimensions = getScreenDimensions();
    setScreenData(initialDimensions);
    setIsLandscape(initialDimensions.width > initialDimensions.height);

    return () => subscription?.remove();
  }, []);

  return {
    screenData,
    isLandscape,
    width: screenData.width,
    height: screenData.height,
    breakpoints: getBreakpoints(screenData.width),
  };
};

