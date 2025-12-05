/**
 * SignatureBox Component
 * 
 * Reusable component for displaying signature status and
 * capturing signatures in dual-signature workflows.
 * 
 * Used for:
 * - Baseline commitment signing
 * - Acceptance certificate signing
 * 
 * @version 1.0
 * @created 5 December 2025
 */

import React from 'react';
import { CheckCircle, PenTool } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import './SignatureBox.css';

/**
 * Individual signature box component.
 * 
 * @param {Object} props
 * @param {string} props.role - Display label (e.g., "Supplier PM", "Customer PM")
 * @param {string} props.signedBy - Name of signer (null if not signed)
 * @param {string} props.signedAt - ISO date string of signature (null if not signed)
 * @param {boolean} props.canSign - Whether current user can sign
 * @param {function} props.onSign - Callback when sign button clicked
 * @param {boolean} props.saving - Whether a save operation is in progress
 * @param {'default' | 'customer'} props.variant - Visual variant
 * @param {string} props.buttonText - Custom button text (default: "Sign to Commit")
 */
export function SignatureBox({
  role,
  signedBy,
  signedAt,
  canSign = false,
  onSign,
  saving = false,
  variant = 'default',
  buttonText = 'Sign to Commit'
}) {
  const isSigned = !!signedAt;
  
  return (
    <div className={`signature-box ${isSigned ? 'signed' : ''} ${variant}`}>
      <div className="signature-header">
        <span className="signature-role">{role}</span>
        {isSigned && <CheckCircle size={16} className="signed-icon" />}
      </div>
      
      {isSigned ? (
        <div className="signature-info">
          <div className="signature-name-row">
            <PenTool size={14} />
            <span className="signer-name">{signedBy}</span>
          </div>
          <span className="signed-date">{formatDate(signedAt)}</span>
        </div>
      ) : canSign ? (
        <button 
          className={`sign-button ${variant}`}
          onClick={onSign}
          disabled={saving}
        >
          <PenTool size={14} />
          {saving ? 'Signing...' : buttonText}
        </button>
      ) : (
        <span className="awaiting-text">Awaiting signature</span>
      )}
    </div>
  );
}

/**
 * Grid wrapper for two signature boxes side by side.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - SignatureBox components
 */
export function SignatureGrid({ children }) {
  return (
    <div className="signature-grid">
      {children}
    </div>
  );
}

/**
 * Convenience component for dual signatures (Supplier + Customer).
 * 
 * @param {Object} props
 * @param {Object} props.supplier - Supplier signature data
 * @param {string} props.supplier.signedBy - Supplier signer name
 * @param {string} props.supplier.signedAt - Supplier signature date
 * @param {boolean} props.supplier.canSign - Can current user sign as supplier
 * @param {function} props.supplier.onSign - Supplier sign callback
 * @param {Object} props.customer - Customer signature data
 * @param {string} props.customer.signedBy - Customer signer name
 * @param {string} props.customer.signedAt - Customer signature date
 * @param {boolean} props.customer.canSign - Can current user sign as customer
 * @param {function} props.customer.onSign - Customer sign callback
 * @param {boolean} props.saving - Whether a save operation is in progress
 * @param {string} props.supplierButtonText - Custom supplier button text
 * @param {string} props.customerButtonText - Custom customer button text
 */
export function DualSignature({
  supplier,
  customer,
  saving = false,
  supplierButtonText = 'Sign as Supplier PM',
  customerButtonText = 'Sign as Customer PM'
}) {
  return (
    <SignatureGrid>
      <SignatureBox
        role="Supplier PM"
        signedBy={supplier.signedBy}
        signedAt={supplier.signedAt}
        canSign={supplier.canSign}
        onSign={supplier.onSign}
        saving={saving}
        buttonText={supplierButtonText}
      />
      <SignatureBox
        role="Customer PM"
        signedBy={customer.signedBy}
        signedAt={customer.signedAt}
        canSign={customer.canSign}
        onSign={customer.onSign}
        saving={saving}
        variant="customer"
        buttonText={customerButtonText}
      />
    </SignatureGrid>
  );
}

/**
 * Status indicator for when both signatures are complete.
 * 
 * @param {Object} props
 * @param {string} props.message - Message to display
 * @param {'success' | 'info'} props.variant - Visual variant
 */
export function SignatureComplete({ 
  message = 'Both signatures complete', 
  variant = 'success' 
}) {
  return (
    <div className={`signature-complete ${variant}`}>
      <CheckCircle size={18} />
      <span>{message}</span>
    </div>
  );
}

export default SignatureBox;
