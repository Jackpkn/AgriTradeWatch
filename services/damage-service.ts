import { apiWithRetry } from './api-pro';
import { DamageCropPayload, APIResponse } from '@/types/api';

/**
 * Service for damage crop reporting
 */
export class DamageService {
  private static instance: DamageService;
  private readonly BASE_URL = '/damage/crop/';

  private constructor() {}

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
      const formData = new FormData();

      // Add all required fields
      formData.append('commodity', damageData.commodity);
      formData.append('damage', damageData.damage.toString());
      formData.append('unit', damageData.unit);
      formData.append('place_damage', damageData.place_damage);
      formData.append('damage_date', damageData.damage_date);
      formData.append('report_date', damageData.report_date);
      formData.append('remarks', damageData.remarks);

      // Add photo if provided
      if (damageData.photo) {
        formData.append('photo', damageData.photo as any);
      }

      const response = await apiWithRetry.post(this.BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
        message: 'Damage report submitted successfully',
      };
    } catch (error: any) {
      console.error('Error submitting damage report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit damage report',
      };
    }
  }

  /**
   * Get all damage reports (if API supports it)
   * @returns Promise with the list of damage reports
   */
  async getDamageReports(): Promise<APIResponse> {
    try {
      const response = await apiWithRetry.get(this.BASE_URL);
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
