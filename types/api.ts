// // API Types for AgriTradeWatch/MandiGo

// export interface User {
//   id: string;
//   username: string;
//   email?: string;
//   mobile?: string;
//   job: 'farmer' | 'consumer';
//   token?: string;
//   createdAt?: FirebaseTimestamp;
//   updatedAt?: FirebaseTimestamp;
// }

// export interface FirebaseTimestamp {
//   seconds: number;
//   nanoseconds: number;
// }

// export interface Location {
//   latitude: number;
//   longitude: number;
//   timestamp?: number;
//   coords?: {
//     latitude: number;
//     longitude: number;
//     accuracy?: number;
//     altitude?: number;
//     altitudeAccuracy?: number;
//     heading?: number;
//     speed?: number;
//   };
// }

// export interface CropData {
//   id?: string;
//   name?: string;
//   commodity: string;
//   quantity: number;
//   pricePerUnit: number;
//   imageUrl?: string;
//   location: Location;
//   createdAt?: FirebaseTimestamp;
//   updatedAt?: FirebaseTimestamp;
//   userId?: string;
// }

// export interface FarmerData extends CropData {
//   sellingPrice: number;
//   quantitySold: number;
// }

// export interface ConsumerData extends CropData {
//   buyingPrice: number;
//   quantityBought: number;
// }

// export interface APIResponse<T = any> {
//   success: boolean;
//   data?: T;
//   message?: string;
//   error?: string;
// }

// export interface AuthResponse {
//   user: User;
//   token: string;
//   refreshToken?: string;
//   message: string;
// }

// export interface RegisterRequest {
//   username: string;
//   password: string;
//   email?: string;
//   mobile?: string;
//   job: 'farmer' | 'consumer';
//   latitude?: number;
//   longitude?: number;
// }

// export interface LoginRequest {
//   username: string;
//   password: string;
// }

// // HTTP Status codes
// export enum HTTP_STATUS {
//   OK = 200,
//   CREATED = 201,
//   BAD_REQUEST = 400,
//   UNAUTHORIZED = 401,
//   FORBIDDEN = 403,
//   NOT_FOUND = 404,
//   INTERNAL_SERVER_ERROR = 500,
// }

// export class APIError extends Error {
//   status: number;
//   data?: any;

//   constructor(message: string, status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, data?: any) {
//     super(message);
//     this.name = 'APIError';
//     this.status = status;
//     this.data = data;
//   }
// }