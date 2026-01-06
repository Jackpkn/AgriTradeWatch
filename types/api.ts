// API Types for AgriTradeWatch/MandiGo

export interface User {
  id: string;
  username: string;
  email?: string;
  mobile?: string;
  job: 'farmer' | 'consumer';
  token?: string;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp?: number;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
}

export interface CropData {
  id?: string;
  name?: string;
  commodity: string;
  quantity: number;
  pricePerUnit: number;
  imageUrl?: string;
  location: Location;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
  userId?: string;
}

export interface FarmerData extends CropData {
  sellingPrice: number;
  quantitySold: number;
}

export interface ConsumerData extends CropData {
  buyingPrice: number;
  quantityBought: number;
}

// Damage Crop Types
export interface DamageCropFormData {
  commodity: string;
  damage: string;
  unit: 'ACRES' | 'TONN';
  place_damage: 'on_field' | 'on_market';
  damage_date: string;
  report_date: string;
  remarks: string;
  photo?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface DamageCropPayload {
  commodity: string;
  damage: number;
  unit: string;
  place_damage: string;
  damage_date: string;
  report_date: string;
  remarks: string;
  latitude: number;
  longitude: number;
  photo?: File | Blob | { uri: string; name: string; type: string };
}

// Digital Thela (Produce) Types
export interface ProduceFormData {
  sale_commodity: string;
  variety_name: string;
  method: 'organic' | 'inorganic';
  level_of_produce: 'selling_surplus' | 'selling_surplus_with_value_addition';
  sowing_date: string;
  harvest_date: string;
  quantity_for_sale: string;
  cost: string;
  unit: string;
  produce_expense: string;
  profit_expectation: string;
  photo_or_video?: {
    uri: string;
    name: string;
    type: string;
  };
  latitude?: number;
  longitude?: number;
}

export interface ProducePayload {
  sale_commodity: string;
  variety_name: string;
  method: string;
  level_of_produce: string;
  sowing_date: string;
  harvest_date: string;
  quantity_for_sale: number;
  cost: number;
  unit: string;
  produce_expense: number;
  profit_expectation: number;
  photo_or_video?: File | Blob;
  latitude?: number;
  longitude?: number;
  username?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  message: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  mobile?: string;
  job: 'farmer' | 'consumer';
  latitude?: number;
  longitude?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// HTTP Status codes
export enum HTTP_STATUS {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export class APIError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}
