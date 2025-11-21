import axios from 'axios';
import { getStoredToken } from './api-pro';
import { ProducePayload, APIResponse } from '@/types/api';

/**
 * Service for digital thela (produce) management
 */
export class ProduceService {
  private static instance: ProduceService;
  private readonly BASE_URL = 'https://mandigo.in/api/create-produce/';

  private constructor() { }

  static getInstance(): ProduceService {
    if (!ProduceService.instance) {
      ProduceService.instance = new ProduceService();
    }
    return ProduceService.instance;
  }

  /**
   * Submit produce details for digital thela
   * @param produceData The produce data to submit
   * @returns Promise with the API response
   */
  async submitProduce(produceData: ProducePayload): Promise<APIResponse> {
    try {
      console.log('🛒 Preparing produce submission');

      const token = await getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // Fetch CSRF token first
      let csrfToken = null;
      try {
        // Use a known working endpoint to fetch the CSRF token
        const csrfResponse = await axios.get('https://mandigo.in/api/damage/crop/', {
          headers: { Authorization: `Bearer ${token}` }
        });

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

        if (Array.isArray(setCookie)) {
          csrfToken = getCookie('csrftoken', setCookie);
        } else if (typeof setCookie === 'string') {
          const match = setCookie.match(/csrftoken=([^;]+)/);
          if (match) csrfToken = match[1];
        }

        if (csrfToken) {
          console.log('🔑 Found CSRF Token:', csrfToken);
        } else {
          console.log('⚠️ No CSRF token found in headers');
        }

      } catch (csrfError) {
        console.warn('⚠️ Failed to fetch CSRF token, proceeding anyway:', csrfError);
      }

      const formData = new FormData();

      // Add CSRF token to body if found (Required based on working curl)
      if (csrfToken) {
        formData.append('csrfmiddlewaretoken', csrfToken);
      }

      // Add all required fields
      formData.append('sale_commodity', produceData.sale_commodity || '');
      formData.append('variety_name', produceData.variety_name || '');
      formData.append('method', produceData.method || '');
      formData.append('level_of_produce', produceData.level_of_produce || '');

      // Send empty strings for optional dates if not provided
      formData.append('sowing_date', produceData.sowing_date || '');
      formData.append('harvest_date', produceData.harvest_date || '');

      formData.append('quantity_for_sale', produceData.quantity_for_sale?.toString() || '');
      formData.append('cost', produceData.cost?.toString() || '');
      formData.append('unit', produceData.unit || '');

      // Send empty strings for optional expenses if not provided
      formData.append('produce_expense', produceData.produce_expense?.toString() || '');
      formData.append('profit_expectation', produceData.profit_expectation?.toString() || '');

      // Add location if provided
      if (produceData.latitude !== undefined) {
        formData.append('latitude', produceData.latitude.toString());
      }
      if (produceData.longitude !== undefined) {
        formData.append('longitude', produceData.longitude.toString());
      }

      // Add photo/video if provided
      if (produceData.photo_or_video) {
        console.log('📸 Adding photo/video to produce listing');
        formData.append('photo_or_video', {
          uri: produceData.photo_or_video.uri,
          type: 'image/jpeg',
          name: 'produce_photo.jpg',
        } as any);
      } else {
        // If no photo, we might need to send an empty field or not send it at all.
        // The curl sent: Content-Disposition: form-data; name="photo_or_video"; filename=""
        // Content-Type: application/octet-stream
        // In RN FormData, appending a file with empty uri might not work as expected.
        // Usually, if it's optional, omitting it is safer, but the curl showed it present.
        // Let's try omitting it first if it's truly optional, as RN FormData can be finicky with empty files.
        // If that fails, we can try to simulate an empty file.
        console.log('📸 No photo provided, skipping photo_or_video field');
      }

      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data', // Let axios set this with boundary
          'Referer': 'https://mandigo.in/api/create-produce/',
          'Origin': 'https://mandigo.in',
        },
        timeout: 30000,
      };

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        config.headers['Cookie'] = `csrftoken=${csrfToken}`;
      }

      console.log('=====================================');
      console.log('🚀 DEBUG REQUEST INFO');
      console.log('URL:', this.BASE_URL);
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      console.log('CSRF Token Variable:', csrfToken);
      console.log('Produce Data:', JSON.stringify(produceData, null, 2));
      console.log('FormData Parts (Manual Log):');
      console.log('- csrfmiddlewaretoken:', csrfToken);
      console.log('- sale_commodity:', produceData.sale_commodity);
      console.log('- variety_name:', produceData.variety_name);
      console.log('=====================================');

      console.log(`📤 Sending POST to: ${this.BASE_URL}`);

      // Use fetch instead of axios for better FormData handling
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type is automatically set by fetch with the correct boundary
          'Referer': 'https://mandigo.in/api/create-produce/',
          'Origin': 'https://mandigo.in',
          ...(csrfToken ? {
            'X-CSRFToken': csrfToken,
            'Cookie': `csrftoken=${csrfToken}`
          } : {})
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (!response.ok) {
        throw new Error(responseData.message || `Request failed with status ${response.status}`);
      }

      console.log('✅ Produce submitted successfully:', responseData);

      return {
        success: true,
        data: responseData,
        message: 'Produce details submitted successfully',
      };
    } catch (error: any) {
      console.error('❌ Produce submission error:', error);

      return {
        success: false,
        error: error.message || 'Failed to submit produce details',
      };
    }
  }

  /**
   * Get all produce listings (if API supports it)
   * @returns Promise with the list of produce
   */
  async getProduceListings(): Promise<APIResponse> {
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
      console.error('Error fetching produce listings:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch produce listings',
      };
    }
  }
}

// Export singleton instance
export default ProduceService.getInstance();
