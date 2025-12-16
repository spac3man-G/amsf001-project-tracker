/**
 * Billing Page
 * 
 * Dedicated page for billing management with editable billing widget.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React from 'react';
import { PoundSterling } from 'lucide-react';
import { PageHeader } from '../components/common';
import { BillingWidget } from '../components/dashboard';

export default function Billing() {
  return (
    <div className="page-container" data-testid="billing-page">
      <PageHeader 
        icon={PoundSterling} 
        title="Billing" 
        subtitle="Track billable milestones, invoicing status, and payments"
      />

      <div style={{ maxWidth: '1200px' }}>
        <BillingWidget editable={true} fullPage={true} />
      </div>
    </div>
  );
}
