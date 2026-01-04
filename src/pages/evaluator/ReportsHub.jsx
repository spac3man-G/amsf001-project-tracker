/**
 * ReportsHub Page
 * 
 * Central hub for generating and downloading evaluation reports.
 * Provides PDF and CSV export options for authenticated consultants.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7B - Client Dashboard & Reports (Task 7B.7)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  BarChart3,
  Table,
  FileSpreadsheet,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader,
  ArrowLeft,
  Calendar,
  Clock
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { traceabilityService } from '../../services/evaluator';
import './ReportsHub.css';

/**
 * Report types available
 */
const REPORT_TYPES = {
  SUMMARY: {
    id: 'summary',
    name: 'Executive Summary',
    description: 'High-level overview of evaluation progress, vendor rankings, and key findings.',
    icon: FileText,
    formats: ['pdf'],
    color: '#dc2626'
  },
  TRACEABILITY: {
    id: 'traceability',
    name: 'Traceability Matrix',
    description: 'Complete requirements-to-vendor mapping with scores and evidence links.',
    icon: Table,
    formats: ['pdf', 'csv'],
    color: '#2563eb'
  },
  REQUIREMENTS: {
    id: 'requirements',
    name: 'Requirements Export',
    description: 'All requirements with status, priority, categorization, and stakeholder attribution.',
    icon: Target,
    formats: ['csv'],
    color: '#10b981'
  },
  VENDOR_SCORES: {
    id: 'scores',
    name: 'Vendor Scores',
    description: 'Detailed scoring data for all vendors by category and criteria.',
    icon: BarChart3,
    formats: ['csv'],
    color: '#f59e0b'
  },
  VENDOR_COMPARISON: {
    id: 'comparison',
    name: 'Vendor Comparison',
    description: 'Side-by-side vendor comparison with weighted rankings.',
    icon: Users,
    formats: ['pdf', 'csv'],
    color: '#8b5cf6'
  },
  EVIDENCE: {
    id: 'evidence',
    name: 'Evidence Register',
    description: 'All evidence collected during evaluation with linked requirements.',
    icon: FileSpreadsheet,
    formats: ['csv'],
    color: '#0891b2'
  }
};

function ReportsHub() {
  const navigate = useNavigate();
  const { currentEvaluation } = useEvaluation();
  
  const [generatingReport, setGeneratingReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const evaluationProjectId = currentEvaluation?.id;

  // Fetch stats for reports
  useEffect(() => {
    if (evaluationProjectId) {
      fetchStats();
    }
  }, [evaluationProjectId]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await traceabilityService.getCoverageReport(evaluationProjectId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  /**
   * Generate and download a report
   */
  const handleGenerateReport = async (reportType, format) => {
    if (!evaluationProjectId) return;

    try {
      setGeneratingReport(`${reportType.id}-${format}`);
      setReportError(null);
      setReportSuccess(null);

      const response = await fetch('/api/evaluator/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationProjectId,
          reportType: reportType.id,
          format
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      // Get the filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${currentEvaluation.name}-${reportType.id}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setReportSuccess(`${reportType.name} downloaded successfully!`);
      setTimeout(() => setReportSuccess(null), 3000);
    } catch (err) {
      console.error('Report generation failed:', err);
      setReportError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(null);
    }
  };

  if (!currentEvaluation) {
    return (
      <div className="reports-hub-empty">
        <FileText size={48} />
        <h2>No Evaluation Selected</h2>
        <p>Please select an evaluation project to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="reports-hub">
      {/* Header */}
      <div className="reports-hub-header">
        <button 
          className="reports-back-btn"
          onClick={() => navigate('/evaluator')}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <div className="reports-header-info">
          <h1>
            <FileText size={28} />
            Reports & Exports
          </h1>
          <p>{currentEvaluation.name}</p>
        </div>
      </div>

      {/* Status Messages */}
      {reportError && (
        <div className="report-message error">
          <AlertTriangle size={18} />
          {reportError}
        </div>
      )}
      {reportSuccess && (
        <div className="report-message success">
          <CheckCircle size={18} />
          {reportSuccess}
        </div>
      )}

      {/* Stats Summary */}
      {!loadingStats && stats && (
        <div className="reports-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.requirements?.total || 0}</span>
            <span className="stat-label">Requirements</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.vendors?.length || 0}</span>
            <span className="stat-label">Vendors</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.coverage?.overallPercent || 0}%</span>
            <span className="stat-label">Coverage</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.scores?.total || 0}</span>
            <span className="stat-label">Scores</span>
          </div>
        </div>
      )}

      {/* Report Cards */}
      <div className="reports-grid">
        {Object.values(REPORT_TYPES).map(reportType => {
          const Icon = reportType.icon;
          
          return (
            <div key={reportType.id} className="report-card">
              <div 
                className="report-card-icon"
                style={{ backgroundColor: `${reportType.color}15`, color: reportType.color }}
              >
                <Icon size={28} />
              </div>
              
              <div className="report-card-content">
                <h3>{reportType.name}</h3>
                <p>{reportType.description}</p>
              </div>

              <div className="report-card-actions">
                {reportType.formats.map(format => {
                  const isGenerating = generatingReport === `${reportType.id}-${format}`;
                  
                  return (
                    <button
                      key={format}
                      className={`report-btn ${format}`}
                      onClick={() => handleGenerateReport(reportType, format)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader size={16} className="spinning" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          {format.toUpperCase()}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="reports-info">
        <h3>About Reports</h3>
        <div className="reports-info-grid">
          <div className="info-item">
            <FileText size={20} />
            <div>
              <strong>PDF Reports</strong>
              <p>Professional formatted documents suitable for stakeholder presentations.</p>
            </div>
          </div>
          <div className="info-item">
            <FileSpreadsheet size={20} />
            <div>
              <strong>CSV Exports</strong>
              <p>Raw data exports for analysis in Excel, Google Sheets, or other tools.</p>
            </div>
          </div>
          <div className="info-item">
            <Clock size={20} />
            <div>
              <strong>Real-time Data</strong>
              <p>Reports reflect the current state of your evaluation at time of generation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsHub;
