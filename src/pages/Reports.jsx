/**
 * Reports Page
 * 
 * Main reports page that provides access to the Report Builder Wizard.
 * Users can generate custom reports, use templates, and view report history.
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 12
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Clock, 
  Layers,
  FileBarChart,
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { ReportBuilderWizard } from '../components/reports';
import { reportTemplatesService } from '../services/reportTemplates.service';
import { DEFAULT_REPORT_TEMPLATES } from '../lib/defaultReportTemplates';
import { LoadingSpinner } from '../components/common';
import './Reports.css';

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================

function TemplateCard({ template, onSelect }) {
  const sectionCount = template.template_definition?.sections?.length || 0;
  
  return (
    <div className="report-template-card" onClick={() => onSelect(template)}>
      <div className="report-template-card-icon">
        <FileBarChart size={24} />
      </div>
      <div className="report-template-card-content">
        <h4>{template.name}</h4>
        <p>{template.description}</p>
        <div className="report-template-card-meta">
          <span>
            <Layers size={14} />
            {sectionCount} section{sectionCount !== 1 ? 's' : ''}
          </span>
          {template.is_default && (
            <span className="template-default-badge">Default</span>
          )}
        </div>
      </div>
      <ChevronRight size={20} className="report-template-card-arrow" />
    </div>
  );
}

// ============================================
// QUICK START SECTION
// ============================================

function QuickStartSection({ onOpenWizard, onSelectTemplate }) {
  return (
    <div className="report-quick-start">
      <h3>Quick Start</h3>
      <div className="report-quick-start-grid">
        {/* Create New Report */}
        <button className="report-quick-start-card primary" onClick={onOpenWizard}>
          <div className="quick-start-icon">
            <Plus size={24} />
          </div>
          <div className="quick-start-content">
            <h4>Create New Report</h4>
            <p>Build a custom report from scratch or use a template</p>
          </div>
        </button>

        {/* Use AI */}
        <button className="report-quick-start-card ai" onClick={onOpenWizard}>
          <div className="quick-start-icon">
            <Sparkles size={24} />
          </div>
          <div className="quick-start-content">
            <h4>AI-Assisted Report</h4>
            <p>Describe what you need and let AI build your report</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ============================================
// TEMPLATES SECTION
// ============================================

function TemplatesSection({ templates, isLoading, onSelectTemplate }) {
  // Combine system templates with any project-specific ones
  const systemTemplates = DEFAULT_REPORT_TEMPLATES;
  const customTemplates = templates.filter(t => !t.is_system);

  return (
    <div className="report-templates-section">
      {/* System Templates */}
      <div className="report-templates-group">
        <h3>
          <FileBarChart size={20} />
          Report Templates
        </h3>
        <p className="report-templates-description">
          Pre-built templates for common reporting needs
        </p>
        
        {isLoading ? (
          <div className="report-templates-loading">
            <LoadingSpinner size="small" />
            <span>Loading templates...</span>
          </div>
        ) : (
          <div className="report-templates-list">
            {systemTemplates.map(template => (
              <TemplateCard 
                key={template.code}
                template={template}
                onSelect={onSelectTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div className="report-templates-group">
          <h3>
            <Layers size={20} />
            Saved Templates
          </h3>
          <p className="report-templates-description">
            Your custom report templates
          </p>
          
          <div className="report-templates-list">
            {customTemplates.map(template => (
              <TemplateCard 
                key={template.id}
                template={template}
                onSelect={onSelectTemplate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// RECENT REPORTS SECTION
// ============================================

function RecentReportsSection({ reports, isLoading }) {
  if (isLoading) {
    return (
      <div className="report-recent-section">
        <h3>
          <Clock size={20} />
          Recent Reports
        </h3>
        <div className="report-recent-loading">
          <LoadingSpinner size="small" />
          <span>Loading recent reports...</span>
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="report-recent-section">
        <h3>
          <Clock size={20} />
          Recent Reports
        </h3>
        <div className="report-recent-empty">
          <FileText size={32} />
          <p>No reports generated yet</p>
          <span>Your generated reports will appear here</span>
        </div>
      </div>
    );
  }

  return (
    <div className="report-recent-section">
      <h3>
        <Clock size={20} />
        Recent Reports
      </h3>
      <div className="report-recent-list">
        {reports.map(report => (
          <div key={report.id} className="report-recent-item">
            <FileText size={16} />
            <div className="report-recent-info">
              <span className="report-recent-name">{report.report_name}</span>
              <span className="report-recent-date">
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN REPORTS PAGE
// ============================================

export default function Reports() {
  const { projectId } = useProject();
  const { profile } = useAuth();

  // State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // ─────────────────────────────────────────
  // Load Templates
  // ─────────────────────────────────────────

  useEffect(() => {
    async function loadTemplates() {
      if (!projectId) return;
      
      setIsLoadingTemplates(true);
      try {
        const projectTemplates = await reportTemplatesService.getTemplatesForProject(projectId, {
          activeOnly: true,
          includeSystem: false
        });
        setTemplates(projectTemplates || []);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, [projectId]);

  // ─────────────────────────────────────────
  // Load Recent Reports
  // ─────────────────────────────────────────

  useEffect(() => {
    async function loadRecentReports() {
      if (!projectId) return;
      
      setIsLoadingReports(true);
      try {
        const reports = await reportTemplatesService.getRecentGenerations(projectId, 5);
        setRecentReports(reports || []);
      } catch (error) {
        console.error('Failed to load recent reports:', error);
      } finally {
        setIsLoadingReports(false);
      }
    }

    loadRecentReports();
  }, [projectId]);

  // ─────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────

  const handleOpenWizard = () => {
    setWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    // Refresh recent reports after closing wizard
    // (in case a report was generated)
  };

  const handleSelectTemplate = (template) => {
    // Open wizard with template pre-selected
    // For now, just open the wizard - template selection happens inside
    setWizardOpen(true);
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="reports-header-content">
            <h2 className="card-title">
              <FileText size={24} />
              Reports
            </h2>
            <p className="reports-header-description">
              Generate project reports, export data, and track project progress
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenWizard}>
            <Plus size={20} />
            New Report
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="reports-content">
        <div className="reports-main">
          {/* Quick Start */}
          <QuickStartSection 
            onOpenWizard={handleOpenWizard}
            onSelectTemplate={handleSelectTemplate}
          />

          {/* Templates */}
          <TemplatesSection
            templates={templates}
            isLoading={isLoadingTemplates}
            onSelectTemplate={handleSelectTemplate}
          />
        </div>

        <div className="reports-sidebar">
          {/* Recent Reports */}
          <RecentReportsSection
            reports={recentReports}
            isLoading={isLoadingReports}
          />
        </div>
      </div>

      {/* Report Builder Wizard */}
      <ReportBuilderWizard 
        isOpen={wizardOpen}
        onClose={handleCloseWizard}
      />
    </div>
  );
}
