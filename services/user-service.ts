// /**
//  * User Service (TypeScript)
//  * Handles all user-related API operations
//  * Production-ready with proper error handling and type safety
//  */

// import { apiWithRetry, APIError, HTTP_STATUS } from './api';
// import { User } from './auth-service'; // Re-using the User type for consistency

// // ========================================================================
// // Type Definitions
// // ========================================================================

// // It's crucial to define the shape of the data as it comes FROM the API,
// // as it may differ from our application's User model.
// interface ApiUser {
//     id: number;
//     name: string;
//     username: string; // API uses 'username' field for email
//     mobile: string | null;
//     job: 'consumer' | 'farmer';
//     createdat: string; // API uses lowercase 'at'
//     latitude?: number | null;
//     longitude?: number | null;
// }

// // A more detailed User type for our application, extending the base User type.
// // This is the canonical shape of a user object within the app.
// export interface AppUser extends User {
//     name: string;
//     email: string;
//     mobile: string | null;
//     role: 'consumer' | 'farmer'; // Alias for job
//     createdAt: string;
//     latitude?: number | null;
//     longitude?: number | null;
// }

// // Data shape for creating or updating a user, sent TO the API.
// type UserApiPayload = Partial<{
//     name: string;
//     username: string;
//     mobile: string | null;
//     job: 'consumer' | 'farmer';
//     latitude: number;
//     longitude: number;
// }>;

// // Defines the allowed parameters for user searches
// type UserSearchCriteria = {
//     [key: string]: string | number | undefined;
//     job?: 'consumer' | 'farmer';
//     name?: string;
// };

// // ========================================================================
// // Data Transformation Utilities
// // ========================================================================

// /**
//  * Transforms a user object from the API shape to our application's shape.
//  * @param apiUser - The user object received from the API.
//  * @returns The user object in the AppUser format.
//  */
// const transformUserData = (apiUser: ApiUser): AppUser => ({
//     id: apiUser.id,
//     name: apiUser.name,
//     email: apiUser.username,
//     username: apiUser.username,
//     mobile: apiUser.mobile,
//     job: apiUser.job,
//     role: apiUser.job,
//     createdAt: apiUser.createdat,
//     latitude: apiUser.latitude || null,
//     longitude: apiUser.longitude || null,
// });

// /**
//  * Transforms our application's user data into the shape expected by the API.
//  * @param userData - A partial user object from our application.
//  * @returns The data formatted as a payload for the API.
//  */
// const transformUserForAPI = (userData: Partial<AppUser>): UserApiPayload => {
//     const payload: UserApiPayload = {};

//     if (userData.name) {
//         payload.name = userData.name;
//     }

//     if (userData.username) {
//         payload.username = userData.username;
//     }

//     if (userData.mobile !== undefined) {
//         payload.mobile = userData.mobile;
//     }

//     if (userData.job || userData.role) {
//         payload.job! = userData.job! || userData.role;
//     }

//     if (userData.latitude !== undefined && userData.latitude !== null) {
//         payload.latitude = userData.latitude;
//     }

//     if (userData.longitude !== undefined && userData.longitude !== null) {
//         payload.longitude = userData.longitude;
//     }

//     return payload;
// };


// // ========================================================================
// // User Service Class
// // ========================================================================

// class UserService {
//     /**
//      * Get all users.
//      */
//     async getAllUsers(): Promise<AppUser[]> {
//         try {
//             const response = await apiWithRetry.get<ApiUser[]>('/users/');
//             const users = response.data.map(transformUserData);
//             if (__DEV__) console.log('📋 Retrieved users:', users.length);
//             return users;
//         } catch (error: any) {
//             console.error('Error fetching all users:', error);
//             throw new APIError('Failed to fetch users', error.status ?? 500, error.data);
//         }
//     }

//     /**
//      * Get user by ID.
//      */
//     async getUserById(userId: number | string): Promise<AppUser> {
//         try {
//             if (!userId) {
//                 throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
//             }
//             const response = await apiWithRetry.get<ApiUser>(`/users/${userId}/`);
//             const user = transformUserData(response.data);
//             if (__DEV__) console.log('👤 Retrieved user:', user.name);
//             return user;
//         } catch (error: any) {
//             console.error('Error fetching user by ID:', error);
//             if (error instanceof APIError) throw error;
//             throw new APIError('Failed to fetch user', error.status ?? 500, error.data);
//         }
//     }

//     /**
//      * Create a new user.
//      */
//     async createUser(userData: Partial<AppUser>): Promise<AppUser> {
//         try {
//             if (!userData || !userData.name || (!userData.username && !userData.email)) {
//                 throw new APIError('Name and email/username are required', HTTP_STATUS.BAD_REQUEST);
//             }
//             const apiPayload = transformUserForAPI(userData);
//             const response = await apiWithRetry.post<ApiUser>('/users/', apiPayload);
//             const user = transformUserData(response.data);
//             if (__DEV__) console.log('✅ Created user:', user.name);
//             return user;
//         } catch (error: any) {
//             console.error('Error creating user:', error);
//             if (error instanceof APIError) throw error;
//             throw new APIError('Failed to create user', error.status ?? 500, error.data);
//         }
//     }

//     /**
//      * Update user data.
//      */
//     async updateUser(userId: number | string, updateData: Partial<AppUser>): Promise<AppUser> {
//         try {
//             if (!userId) throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
//             const apiPayload = transformUserForAPI(updateData);
//             const response = await apiWithRetry.patch<ApiUser>(`/users/${userId}/`, apiPayload);
//             const user = transformUserData(response.data);
//             if (__DEV__) console.log('🔄 Updated user:', user.name);
//             return user;
//         } catch (error: any) {
//             console.error('Error updating user:', error);
//             if (error instanceof APIError) throw error;
//             throw new APIError('Failed to update user', error.status ?? 500, error.data);
//         }
//     }

//     /**
//      * Delete user.
//      */
//     async deleteUser(userId: number | string): Promise<void> {
//         try {
//             if (!userId) throw new APIError('User ID is required', HTTP_STATUS.BAD_REQUEST);
//             await apiWithRetry.delete(`/users/${userId}/`);
//             if (__DEV__) console.log('🗑️ Deleted user:', userId);
//         } catch (error: any) {
//             console.error('Error deleting user:', error);
//             if (error instanceof APIError) throw error;
//             throw new APIError('Failed to delete user', error.status ?? 500, error.data);
//         }
//     }

//     /**
//      * Search users by criteria.
//      */
//     async searchUsers(searchCriteria: UserSearchCriteria = {}): Promise<AppUser[]> {
//         try {
//             const queryParams = new URLSearchParams();
//             Object.entries(searchCriteria).forEach(([key, value]) => {
//                 if (value != null && value !== '') {
//                     queryParams.append(key, String(value));
//                 }
//             });
//             const url = `/users/?${queryParams.toString()}`;
//             const response = await apiWithRetry.get<ApiUser[]>(url);
//             const users = response.data.map(transformUserData);
//             if (__DEV__) console.log(`🔍 Search results: ${users.length} users found`);
//             return users;
//         } catch (error: any) {
//             console.error('Error searching users:', error);
//             throw new APIError('Failed to search users', error.status ?? 500, error.data);
//         }
//     }

//     /**
//      * Get users by role/job type.
//      */
//     async getUsersByRole(role: 'consumer' | 'farmer'): Promise<AppUser[]> {
//         try {
//             if (!role) throw new APIError('Role is required', HTTP_STATUS.BAD_REQUEST);
//             return await this.searchUsers({ job: role });
//         } catch (error) {
//             console.error(`Error fetching users by role "${role}":`, error);
//             throw error;
//         }
//     }

//     /**
//      * Update user location.
//      */
//     async updateUserLocation(userId: number | string, latitude: number, longitude: number): Promise<AppUser> {
//         try {
//             if (latitude === undefined || longitude === undefined) {
//                 throw new APIError('Latitude and longitude are required', HTTP_STATUS.BAD_REQUEST);
//             }
//             return await this.updateUser(userId, { latitude, longitude });
//         } catch (error) {
//             console.error('Error updating user location:', error);
//             throw error;
//         }
//     }
// }

// const userService = new UserService();
// export default userService;
// export { UserService, transformUserData, transformUserForAPI };