import axios from 'axios';
import { getStoredToken } from './api-pro';
import { ProducePayload, APIResponse } from '@/types/api';

/**
 * Service for digital thela (produce) management
 */
export class ProduceService {
  private static instance: ProduceService;
  private readonly BASE_URL = 'https://mandigo.in/api/create-produce/';

  private constructor() {}

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

      const formData = new FormData();

      // Add all required fields
      formData.append('sale_commodity', produceData.sale_commodity);
      formData.append('variety_name', produceData.variety_name);
      formData.append('method', produceData.method);
      formData.append('level_of_produce', produceData.level_of_produce);
      formData.append('sowing_date', produceData.sowing_date);
      formData.append('harvest_date', produceData.harvest_date);
      formData.append('quantity_for_sale', produceData.quantity_for_sale.toString());
      formData.append('cost', produceData.cost.toString());
      formData.append('unit', produceData.unit);
      formData.append('produce_expense', produceData.produce_expense.toString());
      formData.append('profit_expectation', produceData.profit_expectation.toString());

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
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      };

      console.log(`📤 Sending POST to: ${this.BASE_URL}`);

      const response = await axios.post(this.BASE_URL, formData, config);

      console.log('✅ Produce submitted successfully:', response.data);

      return {
        success: true,
        data: response.data,
        message: 'Produce details submitted successfully',
      };
    } catch (error: any) {
      console.error('❌ Produce submission error:', error);

      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit produce details',
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
