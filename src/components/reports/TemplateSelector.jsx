/**
 * Template Selector
 * 
 * Step 1 of the Report Builder Wizard.
 * Allows users to select from pre-built templates,
 * start from scratch, or describe their needs to AI.
 * 
 * Features:
 * - Display pre-built templates from database
 * - "Start from Scratch" option for custom reports
 * - "Describe what you need" AI option
 * - Template card selection with visual feedback
 * - Section count and type indicators
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 6
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Layout,
  Sparkles,
  Check,
  ChevronRight,
  FileStack,
  Calendar,
  DollarSign,
  ClipboardList,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useReportBuilder } from '../../contexts/ReportBuilderContext';
import { 
  reportTemplatesService, 
  REPORT_TYPE,
  REPORT_TYPE_CONFIG 
} from '../../services/reportTemplates.service';
import { LoadingSpinner } from '../common';

// ============================================
// DEFAULT TEMPLATES (FALLBACK)
// ============================================

/**
 * Default templates to show when database has none
 * These will be replaced by Segment 12 defaultReportTemplates.js
 */
const DEFAULT_TEMPLATES = [
  {
    id: 'default-monthly-retro',
    name: 'Monthly Retrospective',
    code: 'monthly_retrospective',
    description: 'Comprehensive monthly review with backward and forward-looking sections. Ideal for programme steering meetings.',
    report_type: REPORT_TYPE.MONTHLY_RETROSPECTIVE,
    is_system: true,
    template_definition: {
      metadata: {
        title: 'Monthly Retrospective Report',
        subtitle: '{{project.name}}',
        includeCoverPage: true,
        includeTableOfContents: true
      },
      sections: [
        { id: 'exec-summary', type: 'executive_summary', name: 'Executive Summary' },
        { id: 'milestone-summary', type: 'milestone_summary', name: 'Milestone Summary' },
        { id: 'deliverable-summary', type: 'deliverable_summary', name: 'Deliverable Summary' },
        { id: 'kpi-performance', type: 'kpi_performance', name: 'KPI Performance' },
        { id: 'budget-analysis', type: 'budget_analysis', name: 'Budget Analysis' },
        { id: 'raid-summary', type: 'raid_summary', name: 'RAID Summary' },
        { id: 'forward-look', type: 'forward_look', name: 'Forward Look' },
        { id: 'lessons-learned', type: 'lessons_learned', name: 'Lessons Learned' }
      ]
    },
    default_parameters: {
      reportingPeriod: 'lastMonth',
      includeCoverPage: true,
      includeTableOfContents: true
    }
  },
  {
    id: 'default-status-summary',
    name: 'Project Status Summary',
    code: 'status_summary',
    description: 'Quick status overview for stakeholder updates. Focuses on key metrics and immediate priorities.',
    report_type: REPORT_TYPE.STATUS_SUMMARY,
    is_system: true,
    template_definition: {
      metadata: {
        title: 'Project Status Summary',
        subtitle: '{{project.name}}',
        includeCoverPage: false,
        includeTableOfContents: false
      },
      sections: [
        { id: 'exec-summary', type: 'executive_summary', name: 'Executive Summary' },
        { id: 'milestone-summary', type: 'milestone_summary', name: 'Milestone Status' },
        { id: 'kpi-performance', type: 'kpi_performance', name: 'Key Metrics' },
        { id: 'raid-summary', type: 'raid_summary', name: 'Key Risks & Issues', config: { raidTypes: ['risk', 'issue'] } }
      ]
    },
    default_parameters: {
      reportingPeriod: 'lastMonth',
      includeCoverPage: false,
      includeTableOfContents: false
    }
  },
  {
    id: 'default-budget-variance',
    name: 'Budget Variance Report',
    code: 'budget_variance',
    description: 'Financial analysis with detailed budget vs actual comparison. Includes cost breakdowns and forecasts.',
    report_type: REPORT_TYPE.BUDGET_VARIANCE,
    is_system: true,
    template_definition: {
      metadata: {
        title: 'Budget Variance Report',
        subtitle: '{{project.name}}',
        includeCoverPage: true,
        includeTableOfContents: false
      },
      sections: [
        { id: 'budget-analysis', type: 'budget_analysis', name: 'Budget Overview' },
        { id: 'timesheet-summary', type: 'timesheet_summary', name: 'Timesheet Analysis' },
        { id: 'expense-summary', type: 'expense_summary', name: 'Expense Analysis' },
        { id: 'resource-summary', type: 'resource_summary', name: 'Resource Utilisation' }
      ]
    },
    default_parameters: {
      reportingPeriod: 'lastMonth',
      includeCoverPage: true,
      includeTableOfContents: false
    }
  }
];

// ============================================
// ICON MAPPING
// ============================================

const REPORT_TYPE_ICONS = {
  [REPORT_TYPE.MONTHLY_RETROSPECTIVE]: Calendar,
  [REPORT_TYPE.STATUS_SUMMARY]: ClipboardList,
  [REPORT_TYPE.BUDGET_VARIANCE]: DollarSign,
  [REPORT_TYPE.CUSTOM]: FileText
};

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================

function TemplateCard({ 
  template, 
  isSelected, 
  onClick 
}) {
  const Icon = REPORT_TYPE_ICONS[template.report_type] || FileText;
  const sectionCount = template.template_definition?.sections?.length || 0;
  const typeConfig = REPORT_TYPE_CONFIG[template.report_type] || REPORT_TYPE_CONFIG[REPORT_TYPE.CUSTOM];
  
  return (
    <div 
      className={`template-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="template-card-header">
        <div className="template-card-icon">
          <Icon size={22} />
        </div>
        <div className="template-card-info">
          <h5 className="template-card-name">{template.name}</h5>
          <span className="template-card-type">{typeConfig.label}</span>
        </div>
        {isSelected && (
          <div className="template-card-check">
            <Check size={20} />
          </div>
        )}
      </div>
      
      <p className="template-card-description">
        {template.description}
      </p>
      
      <div className="template-card-footer">
        <div className="template-card-sections">
          <FileStack size={14} />
          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
        </div>
        {template.is_system && (
          <span className="template-card-badge">
            <Check size={12} />
            System
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// SCRATCH CARD COMPONENT
// ============================================

function ScratchCard({ isSelected, onClick }) {
  return (
    <div 
      className={`template-card scratch-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="template-card-header">
        <div className="template-card-icon">
          <Layout size={22} />
        </div>
        <div className="template-card-info">
          <h5 className="template-card-name">Start from Scratch</h5>
          <span className="template-card-type">Custom</span>
        </div>
        {isSelected && (
          <div className="template-card-check">
            <Check size={20} />
          </div>
        )}
      </div>
      
      <p className="template-card-description">
        Build a completely custom report by selecting individual sections. Perfect for unique reporting needs.
      </p>
      
      <div className="template-card-footer">
        <div className="template-card-sections">
          <FileStack size={14} />
          <span>0 sections (add your own)</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AI CARD COMPONENT
// ============================================

function AICard({ onClick }) {
  return (
    <div 
      className="template-card ai-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="template-card-header">
        <div className="template-card-icon">
          <Sparkles size={22} />
        </div>
        <div className="template-card-info">
          <h5 className="template-card-name">Describe What You Need</h5>
          <span className="template-card-type">AI-Powered</span>
        </div>
      </div>
      
      <p className="template-card-description">
        Tell the AI assistant what kind of report you need, and it will suggest the best template and sections for you.
      </p>
      
      <div className="template-card-footer">
        <div className="template-card-sections">
          <Sparkles size={14} />
          <span>AI will configure</span>
        </div>
        <span className="template-card-badge">
          <Sparkles size={12} />
          AI
        </span>
      </div>
    </div>
  );
}

// ============================================
// SELECTED INFO COMPONENT
// ============================================

function SelectedTemplateInfo({ template, isCustom }) {
  if (!template && !isCustom) return null;
  
  const name = isCustom ? 'Start from Scratch' : template?.name;
  const description = isCustom 
    ? 'You\'ll add sections manually in the next steps'
    : `${template?.template_definition?.sections?.length || 0} pre-configured sections`;
  
  return (
    <div className="selected-template-info">
      <Check size={20} />
      <div className="selected-template-info-content">
        <strong>Selected: {name}</strong>
        <span>{description}</span>
      </div>
      <ChevronRight size={20} style={{ color: 'var(--color-text-secondary)' }} />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TemplateSelector() {
  const { projectId } = useProject();
  const { 
    selectedTemplate, 
    isCustom,
    selectTemplate, 
    startFromScratch,
    setAIPanelOpen,
    nextStep 
  } = useReportBuilder();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load templates from database
  useEffect(() => {
    async function loadTemplates() {
      if (!projectId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const dbTemplates = await reportTemplatesService.getTemplatesForProject(projectId, {
          activeOnly: true,
          includeSystem: true
        });
        
        // If no templates in DB, use defaults
        if (!dbTemplates || dbTemplates.length === 0) {
          setTemplates(DEFAULT_TEMPLATES);
        } else {
          setTemplates(dbTemplates);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('Failed to load templates');
        // Fall back to default templates on error
        setTemplates(DEFAULT_TEMPLATES);
      } finally {
        setLoading(false);
      }
    }
    
    loadTemplates();
  }, [projectId]);
  
  // Handle template selection
  const handleSelectTemplate = useCallback((template) => {
    selectTemplate(template, false);
  }, [selectTemplate]);
  
  // Handle "Start from Scratch" selection
  const handleStartFromScratch = useCallback(() => {
    startFromScratch();
  }, [startFromScratch]);
  
  // Handle AI card click
  const handleAIClick = useCallback(() => {
    // Start from scratch and open AI panel
    startFromScratch();
    setAIPanelOpen(true);
  }, [startFromScratch, setAIPanelOpen]);
  
  // Group templates by type
  const groupedTemplates = useMemo(() => {
    const groups = {
      system: templates.filter(t => t.is_system),
      custom: templates.filter(t => !t.is_system)
    };
    return groups;
  }, [templates]);
  
  // Check if a template is selected
  const isTemplateSelected = useCallback((template) => {
    return selectedTemplate?.id === template.id && !isCustom;
  }, [selectedTemplate, isCustom]);
  
  // Loading state
  if (loading) {
    return (
      <div className="template-selector">
        <div className="template-loading">
          <LoadingSpinner size="large" />
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="template-selector">
      {/* Header */}
      <div className="template-selector-header">
        <h3>Choose a Template</h3>
        <p>Select a pre-built template or start from scratch to create your report.</p>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="template-error" style={{ 
          padding: 'var(--space-md)',
          background: 'var(--color-danger-light)',
          borderRadius: 'var(--radius)',
          marginBottom: 'var(--space-lg)',
          color: 'var(--color-danger)',
          fontSize: 'var(--font-size-sm)'
        }}>
          {error}. Using default templates instead.
        </div>
      )}
      
      {/* Template Categories */}
      <div className="template-categories">
        {/* Pre-built Templates */}
        {groupedTemplates.system.length > 0 && (
          <div className="template-category">
            <div className="template-category-header">
              <FileStack size={18} />
              <h4>Pre-built Templates</h4>
            </div>
            <div className="template-grid">
              {groupedTemplates.system.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={isTemplateSelected(template)}
                  onClick={() => handleSelectTemplate(template)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Custom Templates */}
        {groupedTemplates.custom.length > 0 && (
          <div className="template-category">
            <div className="template-category-header">
              <FolderOpen size={18} />
              <h4>Saved Templates</h4>
            </div>
            <div className="template-grid">
              {groupedTemplates.custom.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={isTemplateSelected(template)}
                  onClick={() => handleSelectTemplate(template)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Start Options */}
        <div className="template-category">
          <div className="template-category-header">
            <Sparkles size={18} />
            <h4>Start Fresh</h4>
          </div>
          <div className="template-grid">
            <ScratchCard
              isSelected={isCustom && !selectedTemplate}
              onClick={handleStartFromScratch}
            />
            <AICard onClick={handleAIClick} />
          </div>
        </div>
      </div>
      
      {/* Selected Template Info */}
      <SelectedTemplateInfo 
        template={selectedTemplate} 
        isCustom={isCustom && !selectedTemplate}
      />
    </div>
  );
}
