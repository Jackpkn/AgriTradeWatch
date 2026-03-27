import axios from 'axios';
import { getStoredToken } from './api-pro';
import { DamageCropPayload, APIResponse } from '@/types/api';

/**
 * Service for damage crop reporting
 */
export class DamageService {
  private static instance: DamageService;
  private readonly BASE_URL = 'https://mandigo.in/api/damage/crop/';

  private constructor() { }

  static getInstance(): DamageService {
    if (!DamageService.instance) {
      DamageService.instance = new DamageService();
    }
    return DamageService.instance;
  }

  /**
   * Submit damage crop report
   * @param damageData The damage crop data to submit
   * @returns Promise with the API response
   */
  async submitDamageReport(damageData: DamageCropPayload): Promise<APIResponse> {
    try {
      console.log('🚨 Preparing damage report submission');
      console.log('📋 Damage data received:', JSON.stringify(damageData, null, 2));

      const token = await getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const formData = new FormData();

      // Capitalize first letter of commodity (API expects "Onion" not "onion")
      const formattedCommodity = damageData.commodity.charAt(0).toUpperCase() + damageData.commodity.slice(1);

      // Limit latitude and longitude to 6 decimal places (API requirement)
      const formattedLatitude = damageData.latitude.toFixed(6);
      const formattedLongitude = damageData.longitude.toFixed(6);

      // Add all required fields
      formData.append('commodity', formattedCommodity);
      formData.append('damage', damageData.damage.toString());
      formData.append('unit', damageData.unit);
      formData.append('place_damage', damageData.place_damage);
      formData.append('damage_date', damageData.damage_date);
      formData.append('report_date', damageData.report_date);
      formData.append('remarks', damageData.remarks || '');
      formData.append('latitude', formattedLatitude);
      formData.append('longitude', formattedLongitude);

      console.log('📤 FormData fields:', {
        commodity: formattedCommodity,
        damage: damageData.damage.toString(),
        unit: damageData.unit,
        place_damage: damageData.place_damage,
        damage_date: damageData.damage_date,
        report_date: damageData.report_date,
        remarks: damageData.remarks || '',
        latitude: formattedLatitude,
        longitude: formattedLongitude,
        hasPhoto: !!damageData.photo,
      });

      // Add photo if provided
      if (damageData.photo) {
        console.log('📸 Adding photo to damage report');
        formData.append('photo', {
          uri: damageData.photo.uri,
          type: 'image/jpeg',
          name: 'damage_photo.jpg',
        } as any);
      }

      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Referer': 'https://mandigo.in/api/damage/crop/',
          'Origin': 'https://mandigo.in',
        },
        timeout: 30000,
      };

      // Fetch CSRF token
      try {
        const csrfResponse = await axios.get(this.BASE_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Extract CSRF token from cookies
        // Note: This is a best-effort attempt. In some RN environments, cookies are handled automatically.
        // If the server sends Set-Cookie, we might need to extract it.
        // However, for many Django setups, just making the GET request sets the cookie in the cookie jar.
        // But we also need the X-CSRFToken header.

        // Let's try to parse it from headers if available, or assume the cookie jar handles it
        // and we just need to read it. 
        // Since we can't easily access the cookie jar in pure axios without a wrapper,
        // we will try to parse the 'set-cookie' header if exposed.

        console.log('🍪 CSRF Fetch Headers:', csrfResponse.headers);

        // Helper to parse cookie string
        const getCookie = (name: string, cookies: string[]) => {
          if (!cookies) return null;
          for (let cookie of cookies) {
            if (cookie.includes(name)) {
              const match = cookie.match(new RegExp(name + '=([^;]+)'));
              return match ? match[1] : null;
            }
          }
          return null;
        };

        // Axios in RN might return headers as an object with lowercase keys
        const setCookie = csrfResponse.headers['set-cookie'];
        let csrfToken = null;

        if (Array.isArray(setCookie)) {
          csrfToken = getCookie('csrftoken', setCookie);
        } else if (typeof setCookie === 'string') {
          // Sometimes it's a single string
          const match = setCookie.match(/csrftoken=([^;]+)/);
          if (match) csrfToken = match[1];
        }

        if (csrfToken) {
          console.log('🔑 Found CSRF Token:', csrfToken);
          config.headers['X-CSRFToken'] = csrfToken;
          config.headers['Cookie'] = `csrftoken=${csrfToken}`;
        } else {
          console.log('⚠️ No CSRF token found in headers, proceeding without explicit token header');
        }

      } catch (csrfError) {
        console.warn('⚠️ Failed to fetch CSRF token, proceeding anyway:', csrfError);
      }

      console.log(`📤 Sending POST to: ${this.BASE_URL}`);

      const response = await axios.post(this.BASE_URL, formData, config);

      console.log('✅ Damage report submitted successfully:', response.data);

      return {
        success: true,
        data: response.data,
        message: 'Damage report submitted successfully',
      };
    } catch (error: any) {
      console.error('❌ Damage report submission error:', error);

      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Headers:', error.response.headers);
      }

      // Extract error message from various possible response formats
      let errorMessage = 'Failed to submit damage report';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : data.non_field_errors;
        } else {
          // Try to extract field-specific errors
          const fieldErrors = Object.entries(data)
            .filter(([key, value]) => Array.isArray(value) || typeof value === 'string')
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all damage reports (if API supports it)
   * @returns Promise with the list of damage reports
   */
  async getDamageReports(): Promise<APIResponse> {
    try {
      const token = await getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      };

      const response = await axios.get(this.BASE_URL, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching damage reports:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch damage reports',
      };
    }
  }
}

// Export singleton instance
export default DamageService.getInstance();
