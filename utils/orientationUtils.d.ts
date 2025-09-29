/**
 * TypeScript declarations for orientationUtils.js
 */

export interface ScreenDimensions {
    width: number;
    height: number;
}

export interface Breakpoints {
    isSmall: boolean;
    isMedium: boolean;
    isLarge: boolean;
    isXLarge: boolean;
    isTablet: boolean;
    isPhone: boolean;
}

export interface OrientationData {
    screenData: ScreenDimensions;
    isLandscape: boolean;
    width: number;
    height: number;
    breakpoints: Breakpoints;
}

export function getScreenDimensions(): ScreenDimensions;
export function checkIsLandscape(): boolean;
export function getBreakpoints(width: number): Breakpoints;
export function getGridColumns(isLandscape: boolean, width: number): number;
export function getCardWidth(
    isLandscape: boolean,
    width: number,
    columns?: number,
    gap?: number,
    padding?: number
): string;
export function getResponsiveFontSize(
    baseSize: number,
    isLandscape: boolean,
    width: number
): number;
export function getResponsivePadding(
    isLandscape: boolean,
    width: number,
    basePadding?: number
): number;
export function getResponsiveSpacing(
    isLandscape: boolean,
    width: number,
    baseSpacing?: number
): number;
export function createResponsiveStyles(
    isLandscape: boolean,
    width: number,
    styleFunction: (isLandscape: boolean, width: number, breakpoints: Breakpoints) => any
): any;
export function useOrientation(): OrientationData;