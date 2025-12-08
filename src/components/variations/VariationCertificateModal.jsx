/**
 * Variation Certificate Modal
 * 
 * Displays the variation certificate for viewing and print-to-PDF
 * Uses hybrid approach: renders HTML, user prints/saves as PDF
 * 
 * @version 1.0
 * @created 8 December 2025
 */

import React, { useRef } from 'react';
import { X, Download, Printer, FileCheck } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/formatters';
import { TYPE_CONFIG } from '../../services/variations.service';
import './VariationCertificateModal.css';

export default function VariationCertificateModal({ variation, onClose }) {
  const { currentProject } = useProject();
  const printRef = useRef(null);

  const typeConfig = TYPE_CONFIG[variation.variation_type];

  function handlePrint() {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${variation.certificate_number || 'Variation Certificate'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1d1d1f;
            padding: 40px;
          }
          .cert-header {
            text-align: center;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .cert-header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #0d9488;
            margin-bottom: 8px;
          }
          .cert-number {
            font-family: monospace;
            font-size: 14px;
            color: #86868b;
          }
          .cert-section {
            margin-bottom: 24px;
          }
          .cert-section h2 {
            font-size: 14px;
            font-weight: 600;
            color: #1d1d1f;
            border-bottom: 1px solid #e5e5e7;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .cert-row {
            display: flex;
            padding: 6px 0;
          }
          .cert-label {
            width: 150px;
            font-weight: 500;
            color: #86868b;
          }
          .cert-value {
            flex: 1;
            color: #1d1d1f;
          }
          .cert-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .cert-table th,
          .cert-table td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #e5e5e7;
          }
          .cert-table th {
            background: #f5f5f7;
            font-weight: 600;
          }
          .cert-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e7;
          }
          .cert-sig-block h3 {
            font-size: 12px;
            font-weight: 600;
            color: #86868b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          .cert-sig-name {
            font-size: 14px;
            font-weight: 600;
            color: #1d1d1f;
          }
          .cert-sig-date {
            font-size: 11px;
            color: #86868b;
          }
          .cert-footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e7;
            font-size: 11px;
            color: #86868b;
            text-align: center;
          }
          .impact-positive { color: #34c759; }
          .impact-negative { color: #ff3b30; }
          @media print {
            body { padding: 20px; }
            .cert-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <div className="vcm-overlay" onClick={onClose}>
      <div className="vcm-modal" onClick={e => e.stopPropagation()}>
        <div className="vcm-header">
          <div className="vcm-header-left">
            <FileCheck size={20} />
            <h2>Variation Certificate</h2>
          </div>
          <div className="vcm-header-actions">
            <button className="vcm-btn vcm-btn-secondary" onClick={handlePrint}>
              <Printer size={16} />
              Print / Save PDF
            </button>
            <button className="vcm-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="vcm-content">
          <div className="vcm-certificate" ref={printRef}>
            {/* Certificate Header */}
            <div className="cert-header">
              <h1>Variation Certificate</h1>
              <div className="cert-number">{variation.certificate_number}</div>
            </div>

            {/* Project Info */}
            <div className="cert-section">
              <h2>Project Details</h2>
              <div className="cert-row">
                <span className="cert-label">Project:</span>
                <span className="cert-value">{currentProject?.name || 'Unknown Project'}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Reference:</span>
                <span className="cert-value">{currentProject?.reference || '-'}</span>
              </div>
            </div>

            {/* Variation Details */}
            <div className="cert-section">
              <h2>Variation Details</h2>
              <div className="cert-row">
                <span className="cert-label">Reference:</span>
                <span className="cert-value">{variation.variation_ref}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Title:</span>
                <span className="cert-value">{variation.title}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Type:</span>
                <span className="cert-value">{typeConfig?.label || variation.variation_type}</span>
              </div>
              {variation.description && (
                <div className="cert-row">
                  <span className="cert-label">Description:</span>
                  <span className="cert-value">{variation.description}</span>
                </div>
              )}
              {variation.reason && (
                <div className="cert-row">
                  <span className="cert-label">Reason:</span>
                  <span className="cert-value">{variation.reason}</span>
                </div>
              )}
              {variation.contract_terms_reference && (
                <div className="cert-row">
                  <span className="cert-label">Contract Ref:</span>
                  <span className="cert-value">{variation.contract_terms_reference}</span>
                </div>
              )}
            </div>

            {/* Impact Summary */}
            <div className="cert-section">
              <h2>Impact Summary</h2>
              <div className="cert-row">
                <span className="cert-label">Cost Impact:</span>
                <span className={`cert-value ${variation.total_cost_impact >= 0 ? 'impact-positive' : 'impact-negative'}`}>
                  {variation.total_cost_impact > 0 ? '+' : ''}{formatCurrency(variation.total_cost_impact || 0)}
                </span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Schedule Impact:</span>
                <span className={`cert-value ${variation.total_days_impact >= 0 ? 'impact-positive' : 'impact-negative'}`}>
                  {variation.total_days_impact > 0 ? '+' : ''}{variation.total_days_impact || 0} days
                </span>
              </div>
              {variation.impact_summary && (
                <div className="cert-row">
                  <span className="cert-label">Summary:</span>
                  <span className="cert-value">{variation.impact_summary}</span>
                </div>
              )}
            </div>

            {/* Affected Milestones */}
            {variation.affected_milestones && variation.affected_milestones.length > 0 && (
              <div className="cert-section">
                <h2>Affected Milestones</h2>
                <table className="cert-table">
                  <thead>
                    <tr>
                      <th>Milestone</th>
                      <th>Original Cost</th>
                      <th>New Cost</th>
                      <th>Original End</th>
                      <th>New End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variation.affected_milestones.map((vm, idx) => (
                      <tr key={idx}>
                        <td>{vm.milestone?.milestone_ref || 'New'}: {vm.milestone?.name || vm.new_milestone_data?.name}</td>
                        <td>{formatCurrency(vm.original_baseline_cost)}</td>
                        <td>{formatCurrency(vm.new_baseline_cost)}</td>
                        <td>{formatDate(vm.original_baseline_end)}</td>
                        <td>{formatDate(vm.new_baseline_end)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signatures */}
            <div className="cert-signatures">
              <div className="cert-sig-block">
                <h3>Supplier PM</h3>
                {variation.supplier_signed_at ? (
                  <>
                    <div className="cert-sig-name">
                      {variation.supplier_signer?.full_name || 'Supplier PM'}
                    </div>
                    <div className="cert-sig-date">
                      Signed: {formatDateTime(variation.supplier_signed_at)}
                    </div>
                  </>
                ) : (
                  <div className="cert-sig-pending">Not signed</div>
                )}
              </div>
              <div className="cert-sig-block">
                <h3>Customer PM</h3>
                {variation.customer_signed_at ? (
                  <>
                    <div className="cert-sig-name">
                      {variation.customer_signer?.full_name || 'Customer PM'}
                    </div>
                    <div className="cert-sig-date">
                      Signed: {formatDateTime(variation.customer_signed_at)}
                    </div>
                  </>
                ) : (
                  <div className="cert-sig-pending">Not signed</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="cert-footer">
              <p>Certificate generated on {formatDateTime(variation.applied_at || new Date().toISOString())}</p>
              <p>{variation.certificate_number}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
