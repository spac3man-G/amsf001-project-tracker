/**
 * Billing Widget
 * 
 * Dashboard widget showing billable milestones with payment tracking.
 * Displays milestone amount, expected date, billed/received status, and PO number.
 * Editable by Admin and Supplier PM roles only.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoundSterling, Check, X, Calendar, FileText } from 'lucide-react';
import { milestonesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../contexts/ToastContext';

export default function BillingWidget() {
  const navigate = useNavigate();
  const { projectId } = useProject();
  const { canEditBilling } = usePermissions();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [editingPO, setEditingPO] = useState(null);
  const [poValue, setPOValue] = useState('');

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await milestonesService.getBillableMilestones(projectId);
      setMilestones(data || []);
    } catch (error) {
      console.error('BillingWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (milestone, field) => {
    if (!canEditBilling) return;
    
    try {
      const newValue = !milestone[field];
      await milestonesService.update(milestone.id, { [field]: newValue });
      setMilestones(prev => prev.map(m => 
        m.id === milestone.id ? { ...m, [field]: newValue } : m
      ));
      showSuccess(`${field === 'is_billed' ? 'Billed' : 'Received'} status updated`);
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const handlePOEdit = (milestone) => {
    if (!canEditBilling) return;
    setEditingPO(milestone.id);
    setPOValue(milestone.purchase_order || '');
  };

  const handlePOSave = async (milestone) => {
    try {
      await milestonesService.update(milestone.id, { purchase_order: poValue });
      setMilestones(prev => prev.map(m => 
        m.id === milestone.id ? { ...m, purchase_order: poValue } : m
      ));
      setEditingPO(null);
      showSuccess('PO number updated');
    } catch (error) {
      showError('Failed to update PO number');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalBillable = milestones.reduce((sum, m) => sum + (m.billable || 0), 0);
  const totalBilled = milestones.filter(m => m.is_billed).reduce((sum, m) => sum + (m.billable || 0), 0);
  const totalReceived = milestones.filter(m => m.is_received).reduce((sum, m) => sum + (m.billable || 0), 0);

  if (loading) {
    return (
      <div className="dashboard-widget billing-widget">
        <div className="widget-header">
          <div className="widget-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <PoundSterling size={20} />
          </div>
          <span className="widget-title">Billing</span>
        </div>
        <div className="widget-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget billing-widget" style={{ gridColumn: 'span 2' }}>
      <div className="widget-header">
        <div className="widget-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
          <PoundSterling size={20} />
        </div>
        <span className="widget-title">Billing</span>
        <span className="widget-total">{formatCurrency(totalBillable)} Total</span>
      </div>

      {/* Summary Row */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        padding: '0.75rem 1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <span style={{ color: '#64748b' }}>Billed: </span>
          <span style={{ fontWeight: '600', color: '#16a34a' }}>{formatCurrency(totalBilled)}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Received: </span>
          <span style={{ fontWeight: '600', color: '#2563eb' }}>{formatCurrency(totalReceived)}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Outstanding: </span>
          <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(totalBillable - totalReceived)}</span>
        </div>
      </div>

      {/* Milestones Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Milestone</th>
              <th style={{ textAlign: 'right', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Amount</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Expected</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Billed</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Received</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>PO Number</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map(milestone => (
              <tr 
                key={milestone.id} 
                style={{ 
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: milestone.is_received ? '#f0fdf4' : 'transparent'
                }}
              >
                <td style={{ padding: '0.625rem 0.25rem' }}>
                  <div style={{ fontWeight: '500' }}>{milestone.milestone_ref}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {milestone.name}
                  </div>
                </td>
                <td style={{ textAlign: 'right', padding: '0.625rem 0.25rem', fontWeight: '600' }}>
                  {formatCurrency(milestone.billable)}
                </td>
                <td style={{ textAlign: 'center', padding: '0.625rem 0.25rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {formatDate(milestone.expected_date)}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '0.625rem 0.25rem' }}>
                  <button
                    onClick={() => handleToggle(milestone, 'is_billed')}
                    disabled={!canEditBilling}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: canEditBilling ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: milestone.is_billed ? '#dcfce7' : '#f1f5f9',
                      color: milestone.is_billed ? '#16a34a' : '#94a3b8'
                    }}
                  >
                    {milestone.is_billed ? <Check size={16} /> : <X size={16} />}
                  </button>
                </td>
                <td style={{ textAlign: 'center', padding: '0.625rem 0.25rem' }}>
                  <button
                    onClick={() => handleToggle(milestone, 'is_received')}
                    disabled={!canEditBilling}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: canEditBilling ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: milestone.is_received ? '#dbeafe' : '#f1f5f9',
                      color: milestone.is_received ? '#2563eb' : '#94a3b8'
                    }}
                  >
                    {milestone.is_received ? <Check size={16} /> : <X size={16} />}
                  </button>
                </td>
                <td style={{ padding: '0.625rem 0.25rem' }}>
                  {editingPO === milestone.id ? (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input
                        type="text"
                        value={poValue}
                        onChange={(e) => setPOValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePOSave(milestone)}
                        style={{
                          width: '100px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handlePOSave(milestone)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => canEditBilling && handlePOEdit(milestone)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        color: milestone.purchase_order ? '#1e293b' : '#94a3b8',
                        cursor: canEditBilling ? 'pointer' : 'default',
                        borderRadius: '4px',
                        backgroundColor: canEditBilling ? '#f8fafc' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <FileText size={12} />
                      {milestone.purchase_order || (canEditBilling ? 'Add PO' : '—')}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {milestones.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          No billable milestones found
        </div>
      )}
    </div>
  );
}
