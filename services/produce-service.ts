import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredToken } from './api-pro';
import { ProducePayload, APIResponse } from '@/types/api';

/**
 * Service for digital thela (produce) management
 */
export class ProduceService {
  private static instance: ProduceService;
  private readonly CREATE_PRODUCE_URL = 'https://mandigo.in/api/create-produce-api/';
  private readonly DT_ENTRIES_URL = 'https://mandigo.in/api/DtEntries/';

  private constructor() { }

  static getInstance(): ProduceService {
    if (!ProduceService.instance) {
      ProduceService.instance = new ProduceService();
    }
    return ProduceService.instance;
  }

  /**
   * Get all Digital Thela entries (no filtering)
   * @returns Promise with the API response containing all entries
   */
  async getAllDTEntries(): Promise<APIResponse> {
    try {
      const token = await getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log('🛒 Fetching all DT Entries from:', this.DT_ENTRIES_URL);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': '*/*',
          'Referer': 'https://mandigo.in/dtDashboard/',
        },
        timeout: 30000,
      };

      const response = await axios.get(this.DT_ENTRIES_URL, config);

      console.log('✅ DT Entries fetched successfully:', response.data?.length || 0, 'entries');

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('❌ Error fetching DT entries:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch Digital Thela entries',
      };
    }
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
        // Fetch CSRF token from the same endpoint we're going to POST to
        const csrfResponse = await axios.get(this.CREATE_PRODUCE_URL, {
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
          console.log('⚠️ No CSRF token found in headers, proceeding without explicit token header');
        }

      } catch (csrfError) {
        console.warn('⚠️ Failed to fetch CSRF token, proceeding anyway:', csrfError);
      }

      const formData = new FormData();

      // Add required fields matching the curl command
      formData.append('sale_commodity', produceData.sale_commodity || '');
      formData.append('variety_name', produceData.variety_name || '');
      formData.append('quantity_for_sale', produceData.quantity_for_sale?.toString() || '');
      formData.append('cost', produceData.cost?.toString() || '');
      formData.append('unit', produceData.unit || '');
      formData.append('latitude', produceData.latitude?.toString() || '');
      formData.append('longitude', produceData.longitude?.toString() || '');
      formData.append('location_confirmed', (produceData as any).location_confirmed ? 'true' : 'false');

      // Add optional description field
      if ((produceData as any).description) {
        formData.append('description', (produceData as any).description);
      }

      // Add photo/video if provided
      if (produceData.photo_or_video) {
        console.log('📸 Adding photo/video to produce listing');
        formData.append('photo_or_video', {
          uri: produceData.photo_or_video.uri,
          type: 'image/jpeg',
          name: 'produce_photo.jpg',
        } as any);
      }

      // Add voice description if provided
      if ((produceData as any).description_voice) {
        const voice = (produceData as any).description_voice;
        console.log('🎙️ Adding voice description to produce listing:', voice.type);
        formData.append('description_voice', {
          uri: voice.uri,
          type: voice.type || 'audio/wav',
          name: voice.name || 'description_voice.wav',
        } as any);
      }

      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Referer': 'https://mandigo.in/api/create-produce-api/',
          'Origin': 'https://mandigo.in',
        },
        timeout: 30000,
      };

      // Add CSRF token to headers if found
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        config.headers['Cookie'] = `csrftoken=${csrfToken}`;
      }

      console.log('=====================================');
      console.log('🚀 DEBUG REQUEST INFO');
      console.log('URL:', this.CREATE_PRODUCE_URL);
      console.log('CSRF Token:', csrfToken);
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      console.log('Produce Data:', JSON.stringify(produceData, null, 2));
      console.log('FormData Parts:');
      console.log('- sale_commodity:', produceData.sale_commodity);
      console.log('- variety_name:', produceData.variety_name);
      console.log('- quantity_for_sale:', produceData.quantity_for_sale);
      console.log('- cost:', produceData.cost);
      console.log('- unit:', produceData.unit);
      console.log('- latitude:', produceData.latitude);
      console.log('- longitude:', produceData.longitude);
      console.log('- location_confirmed:', (produceData as any).location_confirmed);
      console.log('=====================================');

      console.log(`📤 Sending POST to: ${this.CREATE_PRODUCE_URL}`);

      // Use axios for better React Native compatibility
      const response = await axios.post(this.CREATE_PRODUCE_URL, formData, config);

      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Data:', response.data);

      console.log('✅ Produce submitted successfully:', response.data);

      return {
        success: true,
        data: response.data,
        message: 'Produce details submitted successfully',
      };
    } catch (error: any) {
      console.error('❌ Produce submission error:', error);
      console.error('Error response:', error.response?.data);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit produce details',
      };
    }
  }

  /**
   * Get all produce listings
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

      const response = await axios.get(this.CREATE_PRODUCE_URL, config);
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
