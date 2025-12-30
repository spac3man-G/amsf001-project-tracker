/**
 * Certificate Modal Component
 * 
 * Displays milestone acceptance certificate with:
 * - Certificate details and status
 * - Milestone information
 * - Delivered items list
 * - Dual signature workflow (Supplier PM / Customer PM)
 * 
 * @version 2.0 - TD-001: Uses useMilestonePermissions hook internally
 * @created 1 December 2025
 * @updated 28 December 2025
 */

import React from 'react';
import { Award, CheckCircle, PenTool, X } from 'lucide-react';
import { useMilestonePermissions } from '../../hooks';

function getCertificateStatusColor(status) {
  switch (status) {
    case 'Signed': return { bg: '#dcfce7', color: '#16a34a' };
    case 'Pending Supplier Signature': return { bg: '#fef3c7', color: '#d97706' };
    case 'Pending Customer Signature': return { bg: '#dbeafe', color: '#2563eb' };
    case 'Draft': return { bg: '#f1f5f9', color: '#64748b' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

export default function CertificateModal({
  certificate,
  onClose,
  onSign
}) {
  // Get permissions from hook - centralised permission logic
  const permissions = useMilestonePermissions();
  
  // Calculate certificate-specific signing permissions
  const canSignSupplier = permissions.canSignCertificateAsSupplier(certificate);
  const canSignCustomer = permissions.canSignCertificateAsCustomer(certificate);

  if (!certificate) return null;

  const statusColors = getCertificateStatusColor(certificate.status);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }} data-testid="certificate-modal">
        {/* Certificate Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #10b981', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={32} style={{ color: '#10b981' }} />
            <h2 style={{ margin: 0, color: '#166534' }}>Milestone Acceptance Certificate</h2>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }} data-testid="certificate-number">
            Certificate No: <strong>{certificate.certificate_number}</strong>
          </div>
          <div style={{ 
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: '600',
            backgroundColor: statusColors.bg,
            color: statusColors.color
          }} data-testid="certificate-status">
            {certificate.status}
          </div>
        </div>

        {/* Milestone Details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Milestone Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Reference</div>
              <div style={{ fontWeight: '600' }}>{certificate.milestone_ref}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Name</div>
              <div style={{ fontWeight: '600' }}>{certificate.milestone_name}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Payment Milestone Associated</div>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#10b981' }}>
                £{(certificate.payment_milestone_value || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Delivered Items */}
        <div style={{ marginBottom: '1.5rem' }} data-testid="certificate-deliverables">
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Deliverables Accepted</h4>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ref</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(certificate.deliverables_snapshot || []).map((d, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: '600' }}>{d.deliverable_ref}</td>
                    <td style={{ padding: '0.5rem' }}>{d.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a' }}>
                        <CheckCircle size={14} /> Accepted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ marginBottom: '1.5rem' }} data-testid="certificate-signatures">
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Signatures</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Supplier PM Signature */}
            <SignatureBox
              label="Supplier PM"
              signedBy={certificate.supplier_pm_name}
              signedAt={certificate.supplier_pm_signed_at}
              canSign={canSignSupplier && certificate.status !== 'Signed'}
              onSign={() => onSign('supplier')}
              buttonText="Sign as Supplier PM"
              buttonColor="#10b981"
              testIdPrefix="certificate-supplier"
            />

            {/* Customer PM Signature */}
            <SignatureBox
              label="Customer PM"
              signedBy={certificate.customer_pm_name}
              signedAt={certificate.customer_pm_signed_at}
              canSign={canSignCustomer && certificate.status !== 'Signed'}
              onSign={() => onSign('customer')}
              buttonText="Sign as Customer PM"
              buttonColor="#3b82f6"
              testIdPrefix="certificate-customer"
            />
          </div>
        </div>

        {/* Generated Info */}
        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '1rem' }}>
          Generated: {new Date(certificate.generated_at).toLocaleString('en-GB')}
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            data-testid="certificate-close-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SignatureBox({ label, signedBy, signedAt, canSign, onSign, buttonText, buttonColor, testIdPrefix }) {
  const isSigned = !!signedAt;
  
  return (
    <div style={{ 
      padding: '1rem', 
      border: '2px solid', 
      borderColor: isSigned ? '#10b981' : '#e2e8f0',
      borderRadius: '8px',
      backgroundColor: isSigned ? '#f0fdf4' : '#f8fafc'
    }} data-testid={testIdPrefix ? `${testIdPrefix}-signature-box` : undefined}>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>{label}</div>
      {isSigned ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#166534' }}>
            <PenTool size={16} />
            {signedBy}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {new Date(signedAt).toLocaleString('en-GB')}
          </div>
        </div>
      ) : canSign ? (
        <button
          onClick={onSign}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: buttonColor,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}
          data-testid={testIdPrefix ? `${testIdPrefix}-sign-button` : undefined}
        >
          <PenTool size={16} /> {buttonText}
        </button>
      ) : (
        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Awaiting signature</div>
      )}
    </div>
  );
}
