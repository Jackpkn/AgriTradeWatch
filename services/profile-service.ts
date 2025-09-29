/**
 * Profile Service
 * Handles user profile data fetching and updates
 */

import { apiWithRetry, APIError, HTTP_STATUS } from "./api-pro";

// ========================================================================
// Type Definitions
// ========================================================================

export interface ProfileData {
    id: string;
    password?: string; // We don't want to expose this in the UI
    last_login: string;
    is_superuser: boolean;
    first_name: string;
    last_name: string;
    email: string;
    date_joined: string;
    name: string | null;
    mobile: string;
    job: string | null;
    latitude: number | null;
    longitude: number | null;
    is_active: boolean;
    is_staff: boolean;
    username: string;
}

export interface EnhancedProfileData extends Omit<ProfileData, 'password'> {
    displayName: string;
    role: string;
    isVerified: boolean;
    fullName: string;
}

export interface ProfileUpdateData {
    first_name?: string;
    last_name?: string;
    name?: string;
    mobile?: string;
    job?: string;
    latitude?: number;
    longitude?: number;
}

// ========================================================================
// Profile Service Class
// ========================================================================

class ProfileService {
    /**
     * Fetch current user's profile data
     */
    async getProfile(): Promise<EnhancedProfileData> {
        try {
            const response = await apiWithRetry.get<ProfileData>("/profile/");

            if (!response.data) {
                throw new APIError("No profile data received", HTTP_STATUS.NOT_FOUND);
            }

            // Enhance the profile data with computed fields
            const profileData = response.data;
            const enhancedProfile: EnhancedProfileData = {
                ...profileData,
                password: undefined, // Remove password from the response
                displayName: this.getDisplayName(profileData),
                role: this.getUserRole(profileData),
                isVerified: profileData.is_active && !!profileData.email,
                fullName: this.getFullName(profileData),
            };

            if (__DEV__) {
                console.log("✅ Profile data fetched successfully:", enhancedProfile.username);
            }

            return enhancedProfile;
        } catch (error: any) {
            console.error("Profile fetch error:", error);

            if (error instanceof APIError) {
                if (error.status === HTTP_STATUS.UNAUTHORIZED) {
                    throw new APIError(
                        "Authentication required. Please login again.",
                        HTTP_STATUS.UNAUTHORIZED
                    );
                }
                throw error;
            }

            throw new APIError(
                "Failed to fetch profile data",
                error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
                error.data
            );
        }
    }

    /**
     * Update user profile data
     */
    async updateProfile(updateData: ProfileUpdateData): Promise<EnhancedProfileData> {
        try {
            const response = await apiWithRetry.patch<ProfileData>("/profile/", updateData);

            if (!response.data) {
                throw new APIError("No profile data received after update", HTTP_STATUS.BAD_REQUEST);
            }

            // Enhance the updated profile data
            const profileData = response.data;
            const enhancedProfile: EnhancedProfileData = {
                ...profileData,
                password: undefined,
                displayName: this.getDisplayName(profileData),
                role: this.getUserRole(profileData),
                isVerified: profileData.is_active && !!profileData.email,
                fullName: this.getFullName(profileData),
            };

            if (__DEV__) {
                console.log("✅ Profile updated successfully:", enhancedProfile.username);
            }

            return enhancedProfile;
        } catch (error: any) {
            console.error("Profile update error:", error);

            if (error instanceof APIError) {
                throw error;
            }

            throw new APIError(
                "Failed to update profile",
                error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
                error.data
            );
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    private getDisplayName(profile: ProfileData): string {
        if (profile.name) return profile.name;
        if (profile.first_name && profile.last_name) {
            return `${profile.first_name} ${profile.last_name}`.trim();
        }
        if (profile.first_name) return profile.first_name;
        if (profile.username) return profile.username;
        return "User";
    }

    private getFullName(profile: ProfileData): string {
        if (profile.first_name && profile.last_name) {
            return `${profile.first_name} ${profile.last_name}`.trim();
        }
        if (profile.name) return profile.name;
        if (profile.first_name) return profile.first_name;
        return profile.username || "User";
    }

    private getUserRole(profile: ProfileData): string {
        if (profile.is_superuser) return "Admin";
        if (profile.is_staff) return "Staff";
        if (profile.job) {
            return profile.job.charAt(0).toUpperCase() + profile.job.slice(1);
        }
        return "User";
    }

    /**
     * Format date for display
     */
    formatDate(dateString: string): string {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return "Unknown";
        }
    }

    /**
     * Get time since last login
     */
    getTimeSinceLastLogin(lastLoginString: string): string {
        try {
            const lastLogin = new Date(lastLoginString);
            const now = new Date();
            const diffMs = now.getTime() - lastLogin.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return "Just now";
            if (diffMins < 60) return `${diffMins} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) return `${diffDays} days ago`;

            return this.formatDate(lastLoginString);
        } catch (error) {
            return "Unknown";
        }
    }
}

// Export singleton instance
const profileService = new ProfileService();
export default profileService;
export { ProfileService };