/**
 * AIAssistantPanel Component
 * 
 * A sidebar panel providing quick access to AI-powered features in the Evaluator tool.
 * Integrates gap analysis, market research, requirement improvement, and usage statistics.
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8B - Market Research & AI Assistant (Task 8B.6)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles,
  Search,
  FileText,
  Target,
  Building2,
  Wand2,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  BarChart2,
  Activity,
  DollarSign,
  X,
  Info,
  History,
  RefreshCw
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { aiService, AI_TASK_TYPES, AI_TASK_STATUS_CONFIG } from '../../../services/evaluator/ai.service';
import './AIAssistantPanel.css';

const AI_FEATURES = [
  {
    id: 'gap-analysis',
    title: 'Gap Analysis',
    description: 'Analyze requirements for gaps and get AI suggestions',
    icon: Target,
    taskType: AI_TASK_TYPES.GAP_ANALYSIS,
    color: 'blue'
  },
  {
    id: 'market-research',
    title: 'Market Research',
    description: 'Discover and research potential vendors',
    icon: Search,
    taskType: AI_TASK_TYPES.MARKET_RESEARCH,
    color: 'purple'
  },
  {
    id: 'document-parse',
    title: 'Document Parsing',
    description: 'Extract requirements from uploaded documents',
    icon: FileText,
    taskType: AI_TASK_TYPES.DOCUMENT_PARSE,
    color: 'green'
  },
  {
    id: 'requirement-suggest',
    title: 'Improve Requirements',
    description: 'Get AI suggestions to improve requirement quality',
    icon: Wand2,
    taskType: AI_TASK_TYPES.REQUIREMENT_SUGGEST,
    color: 'orange'
  }
];

function formatDuration(ms) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatCost(cost) {
  if (!cost || cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function FeatureCard({ feature, onActivate, isActive, lastRun }) {
  const IconComponent = feature.icon;
  const statusConfig = lastRun?.status ? AI_TASK_STATUS_CONFIG[lastRun.status] : null;
  
  return (
    <button 
      className={`feature-card ${feature.color} ${isActive ? 'active' : ''}`}
      onClick={() => onActivate(feature.id)}
    >
      <div className="feature-icon">
        <IconComponent size={20} />
      </div>
      <div className="feature-content">
        <h4>{feature.title}</h4>
        <p>{feature.description}</p>
        {lastRun && (
          <div className="feature-last-run">
            <Clock size={12} />
            <span>{formatDate(lastRun.completed_at || lastRun.created_at)}</span>
            {statusConfig && (
              <span className={`status-dot ${statusConfig.color}`}></span>
            )}
          </div>
        )}
      </div>
      <ChevronRight size={16} className="feature-arrow" />
    </button>
  );
}

function TaskHistoryItem({ task }) {
  const statusConfig = AI_TASK_STATUS_CONFIG[task.status] || {};
  const StatusIcon = task.status === 'complete' ? CheckCircle 
    : task.status === 'failed' ? XCircle 
    : task.status === 'processing' ? Loader 
    : Clock;
  
  const taskTypeLabel = {
    [AI_TASK_TYPES.GAP_ANALYSIS]: 'Gap Analysis',
    [AI_TASK_TYPES.MARKET_RESEARCH]: 'Market Research',
    [AI_TASK_TYPES.DOCUMENT_PARSE]: 'Document Parse',
    [AI_TASK_TYPES.REQUIREMENT_SUGGEST]: 'Requirement Improve'
  }[task.task_type] || task.task_type;
  
  return (
    <div className={`task-item ${statusConfig.color}`}>
      <StatusIcon 
        size={16} 
        className={`task-icon ${task.status === 'processing' ? 'spinning' : ''}`} 
      />
      <div className="task-content">
        <span className="task-type">{taskTypeLabel}</span>
        <span className="task-time">{formatDate(task.completed_at || task.created_at)}</span>
      </div>
      <div className="task-meta">
        {task.duration_ms && (
          <span className="task-duration">{formatDuration(task.duration_ms)}</span>
        )}
      </div>
    </div>
  );
}

function AIAssistantPanel({ isOpen, onClose, onFeatureSelect }) {
  const { evaluationId, currentEvaluation } = useEvaluation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('features');
  const [usageStats, setUsageStats] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [lastRunByType, setLastRunByType] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load usage stats and task history
  const loadData = useCallback(async () => {
    if (!evaluationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [stats, history] = await Promise.all([
        aiService.getUsageStats(evaluationId),
        aiService.getTaskHistory(evaluationId, { limit: 20 })
      ]);
      
      setUsageStats(stats);
      setTaskHistory(history);
      
      // Build last run by type map
      const lastRuns = {};
      AI_FEATURES.forEach(feature => {
        const lastTask = history.find(t => t.task_type === feature.taskType);
        if (lastTask) {
          lastRuns[feature.taskType] = lastTask;
        }
      });
      setLastRunByType(lastRuns);
    } catch (err) {
      console.error('Failed to load AI data:', err);
      setError('Failed to load AI assistant data');
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);
  
  useEffect(() => {
    if (isOpen && evaluationId) {
      loadData();
    }
  }, [isOpen, evaluationId, loadData]);
  
  const handleFeatureActivate = (featureId) => {
    onFeatureSelect?.(featureId);
  };
  
  const handleRefresh = () => {
    loadData();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-panel">
        <div className="panel-header">
          <div className="header-title">
            <Sparkles className="ai-icon" />
            <div>
              <h2>AI Assistant</h2>
              <p className="subtitle">{currentEvaluation?.name || 'Evaluator'}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="panel-tabs">
          <button 
            className={`tab ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <Sparkles size={16} />
            Features
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            History
          </button>
          <button 
            className={`tab ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            <BarChart2 size={16} />
            Usage
          </button>
        </div>
        
        <div className="panel-content">
          {loading && (
            <div className="loading-state">
              <Loader className="spinning" size={24} />
              <span>Loading...</span>
            </div>
          )}
          
          {error && (
            <div className="error-state">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={handleRefresh}>Retry</button>
            </div>
          )}
          
          {!loading && !error && activeTab === 'features' && (
            <div className="features-content">
              <div className="features-intro">
                <Info size={16} />
                <p>Use AI to accelerate your evaluation. Select a feature to get started.</p>
              </div>
              
              <div className="features-list">
                {AI_FEATURES.map(feature => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onActivate={handleFeatureActivate}
                    lastRun={lastRunByType[feature.taskType]}
                  />
                ))}
              </div>
              
              <div className="features-tips">
                <h4>Tips for best results:</h4>
                <ul>
                  <li>Add requirements before running gap analysis</li>
                  <li>Upload relevant documents for parsing</li>
                  <li>Review AI suggestions before importing</li>
                </ul>
              </div>
            </div>
          )}
          
          {!loading && !error && activeTab === 'history' && (
            <div className="history-content">
              <div className="history-header">
                <h3>Recent AI Tasks</h3>
                <button className="btn-icon" onClick={handleRefresh}>
                  <RefreshCw size={16} />
                </button>
              </div>
              
              {taskHistory.length === 0 ? (
                <div className="empty-history">
                  <Clock size={32} />
                  <p>No AI tasks yet</p>
                  <span>Run an AI feature to see history here</span>
                </div>
              ) : (
                <div className="history-list">
                  {taskHistory.map(task => (
                    <TaskHistoryItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!loading && !error && activeTab === 'usage' && (
            <div className="usage-content">
              <div className="usage-header">
                <h3>AI Usage Statistics</h3>
                <button className="btn-icon" onClick={handleRefresh}>
                  <RefreshCw size={16} />
                </button>
              </div>
              
              {!usageStats || usageStats.total_tasks === 0 ? (
                <div className="empty-usage">
                  <Activity size={32} />
                  <p>No usage data yet</p>
                  <span>Statistics will appear after using AI features</span>
                </div>
              ) : (
                <>
                  <div className="usage-stats-grid">
                    <div className="usage-stat">
                      <span className="stat-value">{usageStats.total_tasks}</span>
                      <span className="stat-label">Total Tasks</span>
                    </div>
                    <div className="usage-stat">
                      <span className="stat-value">{usageStats.by_status?.complete || 0}</span>
                      <span className="stat-label">Completed</span>
                    </div>
                    <div className="usage-stat cost">
                      <span className="stat-value">{formatCost(usageStats.estimated_cost_usd)}</span>
                      <span className="stat-label">Est. Cost</span>
                    </div>
                    <div className="usage-stat">
                      <span className="stat-value">{formatDuration(usageStats.total_duration_ms)}</span>
                      <span className="stat-label">Total Time</span>
                    </div>
                  </div>
                  
                  <div className="usage-breakdown">
                    <h4>Tasks by Type</h4>
                    <div className="breakdown-list">
                      {Object.entries(usageStats.by_type || {}).map(([type, count]) => {
                        const feature = AI_FEATURES.find(f => f.taskType === type);
                        const IconComponent = feature?.icon || Sparkles;
                        return (
                          <div key={type} className="breakdown-item">
                            <IconComponent size={16} />
                            <span className="breakdown-label">
                              {feature?.title || type}
                            </span>
                            <span className="breakdown-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="token-usage">
                    <h4>Token Usage</h4>
                    <div className="token-bars">
                      <div className="token-bar">
                        <span className="token-label">Input</span>
                        <span className="token-value">
                          {(usageStats.total_input_tokens / 1000).toFixed(1)}K
                        </span>
                      </div>
                      <div className="token-bar">
                        <span className="token-label">Output</span>
                        <span className="token-value">
                          {(usageStats.total_output_tokens / 1000).toFixed(1)}K
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AIAssistantPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFeatureSelect: PropTypes.func
};

export default AIAssistantPanel;
