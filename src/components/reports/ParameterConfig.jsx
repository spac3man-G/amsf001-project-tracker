/**
 * Parameter Config
 * 
 * Step 2 of the Report Builder Wizard.
 * Allows users to configure report name, reporting period,
 * and other parameters before building sections.
 * 
 * Features:
 * - Report name input with validation
 * - Reporting period selector with visual cards
 * - Custom date range picker (conditional)
 * - Cover page and table of contents toggles
 * - Template info display
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 7
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Calendar,
  CalendarRange,
  CalendarDays,
  CalendarClock,
  Settings,
  Check,
  AlertCircle,
  BookOpen,
  LayoutList,
  Info
} from 'lucide-react';
import { useReportBuilder } from '../../contexts/ReportBuilderContext';
import { 
  REPORTING_PERIOD,
  REPORTING_PERIOD_CONFIG 
} from '../../services/reportTemplates.service';
import { format, subMonths, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear } from 'date-fns';

// ============================================
// PERIOD CARD ICONS
// ============================================

const PERIOD_ICONS = {
  [REPORTING_PERIOD.LAST_MONTH]: Calendar,
  [REPORTING_PERIOD.LAST_QUARTER]: CalendarRange,
  [REPORTING_PERIOD.LAST_6_MONTHS]: CalendarDays,
  [REPORTING_PERIOD.YEAR_TO_DATE]: CalendarClock,
  [REPORTING_PERIOD.CUSTOM]: Settings
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate the actual date range for a reporting period
 */
function getDateRangeForPeriod(period) {
  const now = new Date();
  
  switch (period) {
    case REPORTING_PERIOD.LAST_MONTH: {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: format(lastMonth, 'MMMM yyyy')
      };
    }
    
    case REPORTING_PERIOD.LAST_QUARTER: {
      const lastQuarterEnd = subDays(startOfQuarter(now), 1);
      const lastQuarterStart = startOfQuarter(lastQuarterEnd);
      return {
        start: lastQuarterStart,
        end: lastQuarterEnd,
        label: `Q${Math.ceil((lastQuarterStart.getMonth() + 1) / 3)} ${lastQuarterStart.getFullYear()}`
      };
    }
    
    case REPORTING_PERIOD.LAST_6_MONTHS: {
      const sixMonthsAgo = subMonths(now, 6);
      return {
        start: startOfMonth(sixMonthsAgo),
        end: endOfMonth(subMonths(now, 1)),
        label: `${format(sixMonthsAgo, 'MMM yyyy')} - ${format(subMonths(now, 1), 'MMM yyyy')}`
      };
    }
    
    case REPORTING_PERIOD.YEAR_TO_DATE: {
      return {
        start: startOfYear(now),
        end: now,
        label: `Jan - ${format(now, 'MMM yyyy')}`
      };
    }
    
    case REPORTING_PERIOD.CUSTOM:
    default:
      return {
        start: null,
        end: null,
        label: 'Select dates'
      };
  }
}

/**
 * Format date for display
 */
function formatDateDisplay(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return format(d, 'd MMM yyyy');
  } catch {
    return '';
  }
}

/**
 * Format date for input value
 */
function formatDateInput(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return format(d, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

// ============================================
// PERIOD CARD COMPONENT
// ============================================

function PeriodCard({ period, config, isSelected, onClick, dateRange }) {
  const Icon = PERIOD_ICONS[period] || Calendar;
  
  return (
    <div 
      className={`parameter-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="parameter-card-icon">
        <Icon size={20} />
      </div>
      <div className="parameter-card-content">
        <span className="parameter-card-label">{config.label}</span>
        <span className="parameter-card-description">
          {period === REPORTING_PERIOD.CUSTOM 
            ? config.description 
            : dateRange.label
          }
        </span>
      </div>
      {isSelected && (
        <div className="parameter-card-check">
          <Check size={16} />
        </div>
      )}
    </div>
  );
}

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================

function ToggleSwitch({ id, checked, onChange, label, description, icon: Icon }) {
  return (
    <div className="parameter-toggle">
      <div className="parameter-toggle-info">
        {Icon && <Icon size={18} className="parameter-toggle-icon" />}
        <div>
          <label htmlFor={id} className="parameter-toggle-label">{label}</label>
          {description && (
            <span className="parameter-toggle-description">{description}</span>
          )}
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-switch-thumb" />
      </button>
    </div>
  );
}

// ============================================
// TEMPLATE INFO COMPONENT
// ============================================

function TemplateInfo({ template, isCustom }) {
  if (isCustom && !template) {
    return (
      <div className="parameter-template-info custom">
        <Settings size={18} />
        <div>
          <strong>Custom Report</strong>
          <span>You're building a report from scratch</span>
        </div>
      </div>
    );
  }
  
  if (!template) return null;
  
  const sectionCount = template.template_definition?.sections?.length || 0;
  
  return (
    <div className="parameter-template-info">
      <FileText size={18} />
      <div>
        <strong>{template.name}</strong>
        <span>{sectionCount} pre-configured section{sectionCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ParameterConfig() {
  const {
    reportName,
    setReportName,
    parameters,
    updateParameter,
    selectedTemplate,
    isCustom
  } = useReportBuilder();
  
  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');
  
  // Calculate date ranges for each period
  const periodDateRanges = useMemo(() => {
    return Object.keys(REPORTING_PERIOD).reduce((acc, key) => {
      acc[REPORTING_PERIOD[key]] = getDateRangeForPeriod(REPORTING_PERIOD[key]);
      return acc;
    }, {});
  }, []);
  
  // Validate report name
  useEffect(() => {
    if (reportName.trim().length === 0) {
      setNameError('Report name is required');
    } else if (reportName.trim().length < 3) {
      setNameError('Report name must be at least 3 characters');
    } else if (reportName.trim().length > 100) {
      setNameError('Report name must be less than 100 characters');
    } else {
      setNameError('');
    }
  }, [reportName]);
  
  // Validate custom date range
  useEffect(() => {
    if (parameters.reportingPeriod === REPORTING_PERIOD.CUSTOM) {
      if (!parameters.customStartDate || !parameters.customEndDate) {
        setDateError('Both start and end dates are required for custom range');
      } else if (new Date(parameters.customStartDate) > new Date(parameters.customEndDate)) {
        setDateError('Start date must be before end date');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [parameters.reportingPeriod, parameters.customStartDate, parameters.customEndDate]);
  
  // Handle report name change
  const handleNameChange = useCallback((e) => {
    setReportName(e.target.value);
  }, [setReportName]);
  
  // Handle period selection
  const handlePeriodSelect = useCallback((period) => {
    updateParameter('reportingPeriod', period);
    
    // Clear custom dates if switching away from custom
    if (period !== REPORTING_PERIOD.CUSTOM) {
      updateParameter('customStartDate', null);
      updateParameter('customEndDate', null);
    }
  }, [updateParameter]);
  
  // Handle custom date changes
  const handleStartDateChange = useCallback((e) => {
    updateParameter('customStartDate', e.target.value || null);
  }, [updateParameter]);
  
  const handleEndDateChange = useCallback((e) => {
    updateParameter('customEndDate', e.target.value || null);
  }, [updateParameter]);
  
  // Handle toggle changes
  const handleCoverPageToggle = useCallback((value) => {
    updateParameter('includeCoverPage', value);
  }, [updateParameter]);
  
  const handleTocToggle = useCallback((value) => {
    updateParameter('includeTableOfContents', value);
  }, [updateParameter]);
  
  // Get current date range display
  const currentDateRange = useMemo(() => {
    if (parameters.reportingPeriod === REPORTING_PERIOD.CUSTOM) {
      if (parameters.customStartDate && parameters.customEndDate) {
        return `${formatDateDisplay(parameters.customStartDate)} - ${formatDateDisplay(parameters.customEndDate)}`;
      }
      return 'Select date range';
    }
    return periodDateRanges[parameters.reportingPeriod]?.label || '';
  }, [parameters.reportingPeriod, parameters.customStartDate, parameters.customEndDate, periodDateRanges]);
  
  return (
    <div className="parameter-config">
      {/* Header */}
      <div className="parameter-header">
        <h3>Configure Report</h3>
        <p>Set up your report parameters before adding sections.</p>
      </div>
      
      {/* Template Info */}
      <TemplateInfo template={selectedTemplate} isCustom={isCustom} />
      
      {/* Report Name Section */}
      <div className="parameter-section">
        <div className="parameter-section-header">
          <FileText size={18} />
          <h4>Report Name</h4>
        </div>
        
        <div className="parameter-input-group">
          <input
            type="text"
            id="reportName"
            className={`parameter-input ${nameError ? 'error' : ''}`}
            value={reportName}
            onChange={handleNameChange}
            placeholder="Enter report name..."
            maxLength={100}
          />
          {nameError && (
            <div className="parameter-error">
              <AlertCircle size={14} />
              <span>{nameError}</span>
            </div>
          )}
          <div className="parameter-hint">
            <Info size={12} />
            <span>This will appear as the title on your generated report</span>
          </div>
        </div>
      </div>
      
      {/* Reporting Period Section */}
      <div className="parameter-section">
        <div className="parameter-section-header">
          <Calendar size={18} />
          <h4>Reporting Period</h4>
        </div>
        
        <div className="parameter-period-grid">
          {Object.entries(REPORTING_PERIOD_CONFIG).map(([period, config]) => (
            <PeriodCard
              key={period}
              period={period}
              config={config}
              isSelected={parameters.reportingPeriod === period}
              onClick={() => handlePeriodSelect(period)}
              dateRange={periodDateRanges[period]}
            />
          ))}
        </div>
        
        {/* Custom Date Range Inputs */}
        {parameters.reportingPeriod === REPORTING_PERIOD.CUSTOM && (
          <div className="parameter-custom-dates">
            <div className="parameter-date-inputs">
              <div className="parameter-date-field">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  className={`parameter-input ${dateError ? 'error' : ''}`}
                  value={formatDateInput(parameters.customStartDate)}
                  onChange={handleStartDateChange}
                />
              </div>
              <span className="parameter-date-separator">to</span>
              <div className="parameter-date-field">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  className={`parameter-input ${dateError ? 'error' : ''}`}
                  value={formatDateInput(parameters.customEndDate)}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>
            {dateError && (
              <div className="parameter-error">
                <AlertCircle size={14} />
                <span>{dateError}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Current Selection Display */}
        <div className="parameter-period-summary">
          <CalendarRange size={16} />
          <span>Report will cover: <strong>{currentDateRange}</strong></span>
        </div>
      </div>
      
      {/* Document Options Section */}
      <div className="parameter-section">
        <div className="parameter-section-header">
          <Settings size={18} />
          <h4>Document Options</h4>
        </div>
        
        <div className="parameter-toggles">
          <ToggleSwitch
            id="includeCoverPage"
            checked={parameters.includeCoverPage}
            onChange={handleCoverPageToggle}
            label="Include Cover Page"
            description="Add a professional title page with project details"
            icon={BookOpen}
          />
          
          <ToggleSwitch
            id="includeTableOfContents"
            checked={parameters.includeTableOfContents}
            onChange={handleTocToggle}
            label="Include Table of Contents"
            description="Add a navigation section listing all report sections"
            icon={LayoutList}
          />
        </div>
      </div>
    </div>
  );
}
