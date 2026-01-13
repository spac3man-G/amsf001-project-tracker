/**
 * Billing Content - Tab content for FinanceHub
 *
 * Two-column layout showing:
 * - Left: Milestone Billing (existing BillingWidget)
 * - Right: Expenses Billing (new ExpensesBillingWidget)
 *
 * @version 2.0
 * @created 25 December 2025
 * @updated 13 January 2026 - Added Expenses Billing column
 */

import React from 'react';
import { BillingWidget, ExpensesBillingWidget } from '../../components/dashboard';

export default function BillingContent() {
  return (
    <div className="billing-content">
      <div className="billing-two-column">
        {/* Left Column - Milestone Billing */}
        <div className="billing-column billing-column-milestone">
          <BillingWidget editable={true} fullPage={true} />
        </div>

        {/* Right Column - Expenses Billing */}
        <div className="billing-column billing-column-expenses">
          <ExpensesBillingWidget editable={true} fullPage={true} />
        </div>
      </div>
    </div>
  );
}
