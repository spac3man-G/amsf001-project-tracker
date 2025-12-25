/**
 * Reports Content - Tab content for DashboardHub
 * 
 * Main reports page that provides access to the Report Builder Wizard.
 * Users can generate custom reports, use templates, and view report history.
 * 
 * @version 1.0
 * @created 25 December 2025 - Extracted from Reports.jsx
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
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { ReportBuilderWizard } from '../../components/reports';
import { reportTemplatesService } from '../../services/reportTemplates.service';
import { DEFAULT_REPORT_TEMPLATES } from '../../lib/defaultReportTemplates';
import { LoadingSpinner } from '../../components/common';
import '../Reports.css';

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================

function TemplateCard({ template, onSelect }) {
  const sectionCount = template.template_definition?.sections?.length || 0;
  
  return (
    <div className="report-template-card" onClick={() => onSelect(template)} data-testid={`report-template-${template.code || template.id}`}>
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
            <span className="template-badge">
              <Sparkles size={12} />
              Default
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={20} className="report-template-card-arrow" />
    </div>
  );
}

// ============================================
// MAIN REPORTS CONTENT COMPONENT
// ============================================

export default function ReportsContent() {
  const { projectId, projectName } = useProject();
  const { user } = useAuth();
  
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load templates from database
      const dbTemplates = await reportTemplatesService.getAll(projectId);
      
      // Merge with default templates (ensure defaults exist)
      const allTemplates = [...DEFAULT_REPORT_TEMPLATES];
      
      // Add any custom templates from DB
      dbTemplates.forEach(dbTemplate => {
        const existingIndex = allTemplates.findIndex(t => t.code === dbTemplate.code);
        if (existingIndex === -1) {
          allTemplates.push(dbTemplate);
        }
      });
      
      setTemplates(allTemplates);
      
      // TODO: Load recent reports from report_history table when implemented
      setRecentReports([]);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowWizard(true);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setShowWizard(true);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setSelectedTemplate(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  return (
    <div className="reports-page" data-testid="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-header-content">
          <div>
            <h1>Reports</h1>
            <p>Generate comprehensive project reports</p>
          </div>
          <button 
            className="btn-primary"
            onClick={handleCreateNew}
            data-testid="create-report-button"
          >
            <Plus size={18} />
            Create Report
          </button>
        </div>
      </div>

      <div className="reports-content">
        {/* Quick Start Templates */}
        <section className="reports-section">
          <div className="reports-section-header">
            <h2>
              <FileBarChart size={20} />
              Report Templates
            </h2>
            <p>Select a template to get started quickly</p>
          </div>
          
          <div className="report-templates-grid" data-testid="report-templates-grid">
            {templates.map((template) => (
              <TemplateCard
                key={template.code || template.id}
                template={template}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>
        </section>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <section className="reports-section">
            <div className="reports-section-header">
              <h2>
                <Clock size={20} />
                Recent Reports
              </h2>
              <p>Your recently generated reports</p>
            </div>
            
            <div className="recent-reports-list" data-testid="recent-reports-list">
              {recentReports.map((report) => (
                <div key={report.id} className="recent-report-item">
                  <FileText size={20} />
                  <div className="recent-report-info">
                    <h4>{report.name}</h4>
                    <p>
                      <Calendar size={12} />
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="btn-secondary btn-sm">View</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Report Builder Wizard Modal */}
      {showWizard && (
        <ReportBuilderWizard
          template={selectedTemplate}
          projectId={projectId}
          projectName={projectName}
          onClose={handleWizardClose}
        />
      )}
    </div>
  );
}
