/**
 * AG Grid Enterprise License Configuration
 *
 * Trial Mode: AG Grid Enterprise features work for 30 days without a license key.
 * After trial, purchase a license at: https://www.ag-grid.com/license-pricing/
 *
 * @version 1.0
 * @created 15 January 2026
 */

import { LicenseManager } from 'ag-grid-enterprise';

/**
 * Initialize AG Grid Enterprise
 *
 * In trial mode, no license key is required.
 * After purchasing, uncomment and set the license key below.
 */
export const initAgGridEnterprise = () => {
  // Trial mode - Enterprise features enabled for 30 days
  //
  // After purchasing a license, uncomment and add your key:
  // LicenseManager.setLicenseKey('YOUR_AG_GRID_LICENSE_KEY_HERE');

  // Suppress the trial watermark in development (optional)
  // Note: In production, you'll need a valid license to remove the watermark
  if (import.meta.env.DEV) {
    console.log('[AG Grid] Running in Enterprise trial mode');
  }
};

export default initAgGridEnterprise;
