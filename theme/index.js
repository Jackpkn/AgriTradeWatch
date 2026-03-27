/**
 * Centralized Theme System
 * Provides consistent colors, typography, spacing, and responsive styles
 */

import { StyleSheet, Dimensions } from 'react-native';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Theme Colors
export const colors = {
  // Primary Colors
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  
  // Secondary Colors
  secondary: '#FF9800',
  secondaryLight: '#FFB74D',
  secondaryDark: '#F57C00',
  
  // Accent Colors
  accent: '#9C27B0',
  accentLight: '#BA68C8',
  accentDark: '#7B1FA2',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#F5F5F5',
  darkGray: '#424242',
  
  // Background Colors
  background: '#F8FFFE',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
};

// Typography
export const typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// Responsive utilities
export const isLandscape = () => screenWidth > screenHeight;
export const isTablet = () => screenWidth >= breakpoints.md;
export const isDesktop = () => screenWidth >= breakpoints.lg;

// Get responsive values
export const getResponsiveValue = (values) => {
  if (typeof values === 'object') {
    if (isLandscape() && values.landscape) return values.landscape;
    if (isTablet() && values.tablet) return values.tablet;
    if (isDesktop() && values.desktop) return values.desktop;
    return values.mobile || values.default || values;
  }
  return values;
};

// Common component styles
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  
  // Button styles
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  
  // Text styles
  textPrimary: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  
  textSecondary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  
  textHeading: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  
  textSubheading: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});

// Responsive style creator
export const createResponsiveStyles = (styleCreator) => {
  return (isLandscape, screenWidth) => {
    const responsiveProps = {
      isLandscape,
      screenWidth,
      screenHeight,
      isTablet: isTablet(),
      isDesktop: isDesktop(),
      breakpoints,
    };
    
    return StyleSheet.create(styleCreator(responsiveProps));
  };
};

// Gradient configurations
export const gradients = {
  primary: ['#2E7D32', '#4CAF50'],
  secondary: ['#FF9800', '#F57C00'],
  accent: ['#9C27B0', '#7B1FA2'],
  success: ['#4CAF50', '#66BB6A'],
  warning: ['#FF9800', '#FFB74D'],
  error: ['#F44336', '#EF5350'],
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  commonStyles,
  gradients,
  isLandscape,
  isTablet,
  isDesktop,
  getResponsiveValue,
  createResponsiveStyles,
};
