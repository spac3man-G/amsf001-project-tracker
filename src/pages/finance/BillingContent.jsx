/**
 * Billing Content - Tab content for FinanceHub
 * 
 * Wrapper around BillingWidget for the Finance Hub.
 * 
 * @version 1.0
 * @created 25 December 2025
 */

import React from 'react';
import { BillingWidget } from '../../components/dashboard';

export default function BillingContent() {
  return (
    <div className="billing-content">
      <BillingWidget editable={true} fullPage={true} />
    </div>
  );
}
