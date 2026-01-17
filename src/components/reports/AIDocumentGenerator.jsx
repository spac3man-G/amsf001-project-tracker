/**
 * AI Document Generator
 *
 * Allows users to generate AI-powered project documents:
 * - Status Reports
 * - Project Summaries
 * - Milestone Reports
 * - RAID Summaries
 * - Handover Documents
 *
 * This is an advisory-only component - generates content for review.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Intelligent Assistance
 */

import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  FileText,
  FileBarChart,
  Shield,
  Flag,
  Package,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import './AIDocumentGenerator.css';

const DOCUMENT_TYPES = [
  {
    id: 'status_report',
    name: 'Status Report',
    description: 'Weekly or monthly project status update',
    icon: FileBarChart
  },
  {
    id: 'project_summary',
    name: 'Project Summary',
    description: 'Executive overview of project health',
    icon: FileText
  },
  {
    id: 'milestone_report',
    name: 'Milestone Report',
    description: 'Detailed milestone status report',
    icon: Flag
  },
  {
    id: 'raid_summary',
    name: 'RAID Summary',
    description: 'Risks, assumptions, issues, decisions',
    icon: Shield
  },
  {
    id: 'handover_document',
    name: 'Handover Document',
    description: 'Project transition and handover pack',
    icon: Package
  }
];

const STATUS_COLORS = {
  green: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'On Track' },
  amber: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'At Risk' },
  red: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Critical' }
};

export default function AIDocumentGenerator() {
  const { projectId, projectName, projectRef } = useProject();

  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [document, setDocument] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const generateDocument = useCallback(async (documentType) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    setSelectedType(documentType);

    try {
      const response = await fetch('/api/ai-document-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          documentType,
          options: {
            tone: 'professional',
            audienceLevel: 'executive',
            includeFinancials: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      if (data.success) {
        setDocument(data.document);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Document generation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const copyToClipboard = useCallback(async () => {
    if (!document) return;

    // Build markdown content
    let content = `# ${document.title}\n`;
    if (document.subtitle) content += `*${document.subtitle}*\n\n`;
    if (document.executiveSummary) content += `## Executive Summary\n${document.executiveSummary}\n\n`;

    if (document.keyHighlights?.length > 0) {
      content += `## Key Highlights\n`;
      document.keyHighlights.forEach(h => content += `- ${h}\n`);
      content += '\n';
    }

    document.sections?.forEach(section => {
      content += `## ${section.heading}\n${section.content}\n\n`;
    });

    if (document.concerns?.length > 0) {
      content += `## Concerns\n`;
      document.concerns.forEach(c => {
        content += `- **${c.severity.toUpperCase()}**: ${c.issue}\n  - Recommendation: ${c.recommendation}\n`;
      });
      content += '\n';
    }

    if (document.nextSteps?.length > 0) {
      content += `## Next Steps\n`;
      document.nextSteps.forEach(s => {
        content += `- ${s.action}${s.owner ? ` (Owner: ${s.owner})` : ''}${s.dueDate ? ` - Due: ${s.dueDate}` : ''}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [document]);

  const downloadAsMarkdown = useCallback(() => {
    if (!document) return;

    let content = `# ${document.title}\n`;
    if (document.subtitle) content += `*${document.subtitle}*\n\n`;
    if (document.executiveSummary) content += `## Executive Summary\n${document.executiveSummary}\n\n`;

    if (document.keyHighlights?.length > 0) {
      content += `## Key Highlights\n`;
      document.keyHighlights.forEach(h => content += `- ${h}\n`);
      content += '\n';
    }

    document.sections?.forEach(section => {
      content += `## ${section.heading}\n${section.content}\n\n`;
    });

    if (document.concerns?.length > 0) {
      content += `## Concerns\n`;
      document.concerns.forEach(c => {
        content += `- **${c.severity.toUpperCase()}**: ${c.issue}\n  - Recommendation: ${c.recommendation}\n`;
      });
      content += '\n';
    }

    if (document.nextSteps?.length > 0) {
      content += `## Next Steps\n`;
      document.nextSteps.forEach(s => {
        content += `- ${s.action}${s.owner ? ` (Owner: ${s.owner})` : ''}${s.dueDate ? ` - Due: ${s.dueDate}` : ''}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${projectRef}-${selectedType}-${new Date().toISOString().split('T')[0]}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [document, projectRef, selectedType]);

  const clearDocument = () => {
    setDocument(null);
    setSelectedType(null);
    setError(null);
  };

  const getStatusIcon = (status) => {
    if (status === 'green') return <CheckCircle size={16} />;
    if (status === 'amber') return <AlertTriangle size={16} />;
    return <AlertCircle size={16} />;
  };

  return (
    <div className="ai-doc-gen">
      {/* Header */}
      <div
        className="ai-doc-gen-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="ai-doc-gen-header-left">
          <Sparkles size={20} className="ai-doc-gen-icon" />
          <div>
            <h3>AI Document Generator</h3>
            <p>Generate professional project documents instantly</p>
          </div>
        </div>
        <div className="ai-doc-gen-header-right">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="ai-doc-gen-content">
          {/* Document Type Selection */}
          {!document && !loading && (
            <div className="ai-doc-gen-types">
              {DOCUMENT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    className={`ai-doc-gen-type-btn ${selectedType === type.id ? 'selected' : ''}`}
                    onClick={() => generateDocument(type.id)}
                    disabled={loading}
                  >
                    <Icon size={20} />
                    <div className="ai-doc-gen-type-content">
                      <span className="ai-doc-gen-type-name">{type.name}</span>
                      <span className="ai-doc-gen-type-desc">{type.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="ai-doc-gen-loading">
              <Sparkles size={24} className="spin" />
              <p>Generating {DOCUMENT_TYPES.find(t => t.id === selectedType)?.name}...</p>
              <span>Analyzing project data and creating document</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="ai-doc-gen-error">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={() => generateDocument(selectedType)}>Retry</button>
            </div>
          )}

          {/* Generated Document */}
          {document && !loading && (
            <div className="ai-doc-gen-result">
              {/* Document Header */}
              <div className="ai-doc-gen-result-header">
                <div className="ai-doc-gen-result-title">
                  <h4>{document.title}</h4>
                  {document.subtitle && <p>{document.subtitle}</p>}
                </div>
                <div className="ai-doc-gen-result-actions">
                  <button
                    className="ai-doc-gen-action-btn"
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    className="ai-doc-gen-action-btn"
                    onClick={downloadAsMarkdown}
                    title="Download as Markdown"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    className="ai-doc-gen-action-btn secondary"
                    onClick={clearDocument}
                    title="Generate new document"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              {document.overallStatus && (
                <div
                  className="ai-doc-gen-status"
                  style={{
                    backgroundColor: STATUS_COLORS[document.overallStatus]?.bg,
                    color: STATUS_COLORS[document.overallStatus]?.color
                  }}
                >
                  {getStatusIcon(document.overallStatus)}
                  <span>Overall Status: {STATUS_COLORS[document.overallStatus]?.label}</span>
                </div>
              )}

              {/* Executive Summary */}
              {document.executiveSummary && (
                <div className="ai-doc-gen-summary">
                  <h5>Executive Summary</h5>
                  <p>{document.executiveSummary}</p>
                </div>
              )}

              {/* Key Highlights */}
              {document.keyHighlights?.length > 0 && (
                <div className="ai-doc-gen-highlights">
                  <h5>Key Highlights</h5>
                  <ul>
                    {document.keyHighlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections Preview */}
              <div className="ai-doc-gen-sections">
                <h5>Document Sections ({document.sections?.length || 0})</h5>
                <div className="ai-doc-gen-sections-list">
                  {document.sections?.slice(0, 5).map((section, idx) => (
                    <div key={idx} className="ai-doc-gen-section-preview">
                      <span className="section-number">{idx + 1}</span>
                      <span className="section-heading">{section.heading}</span>
                      <span className="section-type">{section.type}</span>
                    </div>
                  ))}
                  {document.sections?.length > 5 && (
                    <div className="ai-doc-gen-section-more">
                      +{document.sections.length - 5} more sections
                    </div>
                  )}
                </div>
              </div>

              {/* Concerns */}
              {document.concerns?.length > 0 && (
                <div className="ai-doc-gen-concerns">
                  <h5>Areas of Concern</h5>
                  {document.concerns.map((concern, idx) => (
                    <div key={idx} className={`ai-doc-gen-concern ${concern.severity}`}>
                      <div className="concern-header">
                        <span className="concern-severity">{concern.severity}</span>
                        <span className="concern-issue">{concern.issue}</span>
                      </div>
                      <p className="concern-rec">{concern.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Next Steps */}
              {document.nextSteps?.length > 0 && (
                <div className="ai-doc-gen-next-steps">
                  <h5>Recommended Next Steps</h5>
                  {document.nextSteps.slice(0, 5).map((step, idx) => (
                    <div key={idx} className="ai-doc-gen-step">
                      <span className="step-number">{idx + 1}</span>
                      <div className="step-content">
                        <span className="step-action">{step.action}</span>
                        {(step.owner || step.dueDate) && (
                          <span className="step-meta">
                            {step.owner && `Owner: ${step.owner}`}
                            {step.owner && step.dueDate && ' | '}
                            {step.dueDate && `Due: ${step.dueDate}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="ai-doc-gen-footer">
                <Sparkles size={12} />
                <span>AI-generated document - review before sharing</span>
                <button
                  className="ai-doc-gen-regenerate"
                  onClick={() => generateDocument(selectedType)}
                >
                  <RefreshCw size={12} />
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
