// Type definitions for the map module

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coords: Coordinates;
  timestamp?: number;
}

export interface CropData {
  id: string;
  name: string;
  pricePerUnit: number;
  quantity: number;
  location: LocationData;
  createdAt?: {
    seconds: number;
  };
  type?: "consumer" | "farmer";
}

export interface CropOption {
  label: string;
  value: string;
  icon: string;
}

export interface MapType {
  label: string;
  value: string;
}

export interface ConsumerStats {
  count: number;
  averagePrice: number;
  averagePricePerKg: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  dataPointText: string;
  timestamp: number;
  count: number;
}

export interface MapConfig {
  DEFAULT_ZOOM: number;
  RADIUS: {
    MIN: number;
    MAX: number;
    DEFAULT: number;
    DEBOUNCE_MS: number;
  };
  PRICE_CONVERSION: {
    PER_KG_MULTIPLIER: number;
    UNITS: {
      PER_UNIT: string;
      PER_KG: string;
    };
  };
  COLORS: {
    PRIMARY: string;
    SECONDARY: string;
    INSIDE_RADIUS: string;
    OUTSIDE_RADIUS: string;
    USER_LOCATION: string;
  };
  EARTH_RADIUS_KM: number;
}

export interface PerformanceStats {
  count: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  averageTime: number;
}

export interface VirtualizedDataResult {
  virtualizedCrops: CropData[];
  isVirtualizing: boolean;
  totalCount: number;
  displayedCount: number;
}

// Component Props Types
export interface MapHeaderProps {
  selectedCrop: string;
  selectedMapType: string;
  onCropPress: () => void;
  onMapTypeChange: (mapType: string) => void;
}

export interface InteractiveMapProps {
  markerPosition: Coordinates | null;
  allCrops: CropData[];
  radius: number;
  selectedCrop: string;
  selectedMapType: string;
  onMarkerMove: (position: Coordinates) => void;
}

export interface RadiusSliderProps {
  radius: number;
  onRadiusChange: (value: number) => void;
}

export interface ConsumerInfoPanelProps {
  selectedCrop: string;
  radius: number;
  consumerStats: ConsumerStats;
  priceUnit: string;
}

export interface PriceUnitToggleProps {
  priceUnit: string;
  onPriceUnitChange: (unit: string) => void;
}

export interface MapLegendProps {
  selectedCrop: string;
  radius: number;
}

export interface PriceChartProps {
  chartData: ChartDataPoint[];
  selectedCrop: string;
  priceUnit: string;
  title: string;
  isConsumerChart?: boolean;
}

export interface CropSelectionModalProps {
  visible: boolean;
  selectedCrop: string;
  onSelect: (crop: string) => void;
  onClose: () => void;
}
