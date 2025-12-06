/**
 * Resource Detail Page
 * 
 * Full view and edit page for a single resource.
 * Features:
 * - Complete resource information display
 * - Partner association for third-party resources
 * - Timesheet and expense summaries
 * - Margin calculations (admin/supplier PM only)
 * 
 * @version 3.0 - Refactored to use centralised utilities, removed allocation tracking
 * @updated 6 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Clock, DollarSign, AlertCircle, X, Edit2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useResourcePermissions } from '../hooks/useResourcePermissions';
import { VALID_STATUSES, hoursToDays } from '../config/metricsConfig';
import { TIMESHEET_STATUS } from '../lib/timesheetCalculations';
import { LoadingSpinner, StatCard } from '../components/common';
import { resourcesService, partnersService, timesheetsService, expensesService } from '../services';
import {
  RESOURCE_TYPE,
  sfiaToDisplay,
  sfiaToDatabase,
  getSfiaOptions,
  getResourceTypeConfig,
  calculateMargin,
  getMarginConfig,
  calculateSellValue,
  calculateCostValue
} from '../lib/resourceCalculations';

// Extracted components
import {
  ResourceEditForm,
  ResourceDateFilter,
  ResourceDetailsDisplay,
  TimesheetsCard,
  ExpensesCard
} from '../components/resources';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  
  // Use the new resource permissions hook
  const { 
    canEdit: canEditResource, 
    canSeeCostPrice, 
    canSeeResourceType,
    canSeeMargins 
  } = useResourcePermissions();

  // State
  const [resource, setResource] = useState(null);
  const [partners, setPartners] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (id) fetchResourceData();
  }, [id, dateRange.start, dateRange.end]);

  useEffect(() => {
    async function fetchPartners() {
      if (resource?.project_id && userRole && ['admin', 'supplier_pm'].includes(userRole)) {
        try {
          const partnersData = await partnersService.getAll(resource.project_id, {
            filters: [{ column: 'is_active', operator: 'eq', value: true }],
            select: 'id, name, is_active',
            orderBy: { column: 'name', ascending: true }
          });
          setPartners(partnersData || []);
        } catch (error) {
          console.error('Error fetching partners:', error);
        }
      }
    }
    fetchPartners();
  }, [resource?.project_id, userRole]);

  async function fetchResourceData() {
    try {
      setLoading(true);
      setError(null);

      const resourceData = await resourcesService.getById(id, {
        select: '*, partner:partners(id, name, contact_name, contact_email, is_active)'
      });

      if (!resourceData) {
        setError('Resource not found');
        setLoading(false);
        return;
      }

      // Get timesheet summary for stats
      const timesheetsForSummary = await timesheetsService.getAll(resourceData.project_id, {
        filters: [{ column: 'resource_id', operator: 'eq', value: id }],
        select: 'id, hours_worked, hours, status, was_rejected'
      });

      let totalHours = 0, approvedHours = 0, pendingHours = 0;
      if (timesheetsForSummary) {
        timesheetsForSummary.forEach(ts => {
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          totalHours += hours;
          if (VALID_STATUSES.timesheets.completed.includes(ts.status)) {
            approvedHours += hours;
          } else if (ts.status === TIMESHEET_STATUS.SUBMITTED && !ts.was_rejected) {
            pendingHours += hours;
          }
        });
      }

      setResource({
        ...resourceData,
        timesheetSummary: { 
          totalEntries: timesheetsForSummary?.length || 0, 
          totalHours, 
          approvedHours, 
          pendingHours, 
          daysWorked: hoursToDays(totalHours) 
        }
      });

      // Fetch filtered timesheets for display
      const tsFilters = [{ column: 'resource_id', operator: 'eq', value: id }];
      if (dateRange.start) tsFilters.push({ column: 'date', operator: 'gte', value: dateRange.start });
      if (dateRange.end) tsFilters.push({ column: 'date', operator: 'lte', value: dateRange.end });
      
      const tsData = await timesheetsService.getAll(resourceData.project_id, {
        filters: tsFilters,
        select: 'id, date, hours_worked, hours, status, description, milestone:milestones(milestone_ref, name)',
        orderBy: { column: 'date', ascending: false }
      });
      setTimesheets((tsData || []).slice(0, 100));

      // Fetch filtered expenses
      const expFilters = [{ column: 'resource_id', operator: 'eq', value: id }];
      if (dateRange.start) expFilters.push({ column: 'expense_date', operator: 'gte', value: dateRange.start });
      if (dateRange.end) expFilters.push({ column: 'expense_date', operator: 'lte', value: dateRange.end });
      
      const expData = await expensesService.getAll(resourceData.project_id, {
        filters: expFilters,
        select: 'id, expense_date, category, reason, amount, chargeable_to_customer, procurement_method, status',
        orderBy: { column: 'expense_date', ascending: false }
      });
      setExpenses((expData || []).slice(0, 100));

    } catch (err) {
      console.error('Error fetching resource data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Date range handling
  function handleMonthChange(monthValue) {
    setSelectedMonth(monthValue);
    if (monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      setDateRange({ 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      });
    } else {
      setDateRange({ start: null, end: null });
    }
  }

  function handleCustomDateChange(field, value) {
    setSelectedMonth('');
    setDateRange(prev => ({ ...prev, [field]: value }));
  }

  function clearDateFilter() {
    setSelectedMonth('');
    setDateRange({ start: null, end: null });
  }

  function getDateRangeLabel() {
    if (!dateRange.start && !dateRange.end) return 'All Time';
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    if (dateRange.start && dateRange.end) {
      return `${new Date(dateRange.start).toLocaleDateString('en-GB')} - ${new Date(dateRange.end).toLocaleDateString('en-GB')}`;
    }
    if (dateRange.start) return `From ${new Date(dateRange.start).toLocaleDateString('en-GB')}`;
    if (dateRange.end) return `Until ${new Date(dateRange.end).toLocaleDateString('en-GB')}`;
    return 'All Time';
  }

  // Edit handling
  function startEditing() {
    setEditForm({
      name: resource.name || '',
      email: resource.email || '',
      role: resource.role || '',
      resource_ref: resource.resource_ref || '',
      sfia_level: sfiaToDisplay(resource.sfia_level),
      sell_price: resource.sell_price || '',
      cost_price: resource.cost_price || '',
      discount_percent: resource.discount_percent || 0,
      resource_type: resource.resource_type || RESOURCE_TYPE.INTERNAL,
      partner_id: resource.partner_id || ''
    });
    setIsEditing(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const updates = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        resource_ref: editForm.resource_ref,
        sfia_level: sfiaToDatabase(editForm.sfia_level),
        sell_price: parseFloat(editForm.sell_price) || 0,
        discount_percent: parseFloat(editForm.discount_percent) || 0,
        resource_type: editForm.resource_type,
        partner_id: editForm.resource_type === RESOURCE_TYPE.THIRD_PARTY 
          ? (editForm.partner_id || null) 
          : null
      };

      if (canSeeCostPrice) {
        updates.cost_price = editForm.cost_price === '' ? null : parseFloat(editForm.cost_price);
      }

      await resourcesService.update(id, updates);
      await fetchResourceData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading resource..." size="large" fullPage />;

  if (error && !resource) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Resource Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/resources')}>
            <ArrowLeft size={16} /> Back to Resources
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const margin = calculateMargin(resource.sell_price, resource.cost_price);
  const marginConfig = getMarginConfig(margin.percent);
  const MarginIcon = marginConfig.icon;
  const typeConfig = getResourceTypeConfig(resource.resource_type);
  const TypeIcon = typeConfig.icon;
  
  const daysUsed = resource.timesheetSummary?.daysWorked || 0;
  const sellValue = calculateSellValue(daysUsed, resource.sell_price);
  const costValue = canSeeCostPrice ? calculateCostValue(daysUsed, resource.cost_price) : null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <button 
            onClick={() => navigate('/resources')} 
            className="btn btn-secondary" 
            style={{ marginRight: '1rem', padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <User size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>{resource.name}</h1>
              {canSeeResourceType && (
                <span style={{
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem', 
                  backgroundColor: typeConfig.bg, 
                  color: typeConfig.color,
                  borderRadius: '6px', 
                  fontSize: '0.85rem', 
                  fontWeight: '500'
                }}>
                  <TypeIcon size={14} />
                  {typeConfig.label}
                </span>
              )}
            </div>
            <p style={{ color: '#64748b' }}>{resource.role} • {resource.email}</p>
          </div>
        </div>
        {canEditResource && !isEditing && (
          <button className="btn btn-primary" onClick={startEditing}>
            <Edit2 size={18} /> Edit Resource
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          borderRadius: '8px', 
          marginBottom: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <AlertCircle size={18} />
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard 
          icon={Clock} 
          label="Days Used" 
          value={daysUsed.toFixed(1)} 
          subtext={`${resource.timesheetSummary?.totalHours?.toFixed(1) || 0} hours logged`}
          color="#3b82f6" 
        />
        <StatCard 
          icon={DollarSign} 
          label="Sell Value" 
          value={`£${sellValue.toLocaleString()}`} 
          subtext={`@ £${resource.sell_price}/day`}
          color="#10b981" 
        />
        {canSeeCostPrice && (
          <StatCard 
            icon={DollarSign} 
            label="Cost Value" 
            value={costValue !== null ? `£${costValue.toLocaleString()}` : 'N/A'} 
            subtext={resource.cost_price ? `@ £${resource.cost_price}/day` : 'No cost set'}
            color="#6366f1" 
          />
        )}
        {canSeeMargins && (
          <div className="stat-card" style={{ borderLeft: `4px solid ${marginConfig.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MarginIcon size={20} style={{ color: marginConfig.color }} />
              <span className="stat-label">Margin</span>
            </div>
            <div className="stat-value" style={{ color: marginConfig.color }}>
              {margin.percent !== null ? `${margin.percent.toFixed(1)}%` : 'N/A'}
            </div>
            {margin.amount !== null && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                £{margin.amount.toFixed(0)} per day
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <ResourceDateFilter
        selectedMonth={selectedMonth}
        dateRange={dateRange}
        onMonthChange={handleMonthChange}
        onDateChange={handleCustomDateChange}
        onClear={clearDateFilter}
        dateRangeLabel={getDateRangeLabel()}
      />

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr', 
        gap: '1.5rem' 
      }}>
        
        {/* Resource Details Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {isEditing ? 'Edit Resource Details' : 'Resource Details'}
            </h2>
          </div>
          
          {isEditing ? (
            <ResourceEditForm
              form={editForm}
              onFormChange={setEditForm}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              saving={saving}
              partners={partners}
              canSeeCostPrice={canSeeCostPrice}
              canSeeResourceType={canSeeResourceType}
            />
          ) : (
            <ResourceDetailsDisplay
              resource={resource}
              daysUsed={daysUsed}
              sellValue={sellValue}
              canSeeResourceType={canSeeResourceType}
            />
          )}
        </div>

        {/* Right Column - only shown when not editing */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <TimesheetsCard 
              timesheets={timesheets} 
              dateRangeLabel={getDateRangeLabel()} 
            />
          </div>
        )}
      </div>

      {/* Expenses - full width below */}
      {!isEditing && (
        <ExpensesCard 
          expenses={expenses} 
          dateRangeLabel={getDateRangeLabel()} 
        />
      )}
    </div>
  );
}
