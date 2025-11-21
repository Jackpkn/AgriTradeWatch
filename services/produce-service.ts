import { apiWithRetry } from './api-pro';
import { ProducePayload, APIResponse } from '@/types/api';

/**
 * Service for digital thela (produce) management
 */
export class ProduceService {
  private static instance: ProduceService;
  private readonly BASE_URL = '/create-produce/';

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
        formData.append('photo_or_video', produceData.photo_or_video as any);
      }

      const response = await apiWithRetry.post(this.BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
        message: 'Produce details submitted successfully',
      };
    } catch (error: any) {
      console.error('Error submitting produce:', error);
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
      const response = await apiWithRetry.get(this.BASE_URL);
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
