/**
 * Report AI Assistant Component
 * 
 * AI-powered sidebar assistant for the Report Builder Wizard.
 * Provides natural language interaction for:
 * - Section discovery and suggestions
 * - Configuration help
 * - Content generation
 * - Report building guidance
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 10
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Plus,
  FileText,
  Settings,
  Lightbulb,
  AlertCircle,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useReportBuilder, useReportBuilderAI } from '../../contexts/ReportBuilderContext';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { SECTION_TYPE, getSectionTypeConfig } from '../../lib/reportSectionTypes';

// ============================================
// CONSTANTS
// ============================================

const QUICK_PROMPTS = [
  {
    id: 'suggest-monthly',
    label: 'Suggest sections for monthly report',
    prompt: 'I need to create a monthly retrospective report. What sections should I include?'
  },
  {
    id: 'suggest-status',
    label: 'Suggest sections for status update',
    prompt: 'Help me build a project status update report.'
  },
  {
    id: 'explain-sections',
    label: 'Explain available sections',
    prompt: 'What sections are available and what do they show?'
  },
  {
    id: 'generate-summary',
    label: 'Generate executive summary',
    prompt: 'Generate an executive summary for my report.'
  }
];

// ============================================
// MESSAGE COMPONENT
// ============================================

function ChatMessage({ message, onActionClick, isLatest }) {
  const [actionsExpanded, setActionsExpanded] = useState(true);
  
  const isUser = message.role === 'user';
  const hasActions = message.actions && message.actions.length > 0;
  
  return (
    <div className={`ai-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="ai-message-avatar">
        {isUser ? (
          <User size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>
      
      <div className="ai-message-content">
        <div className="ai-message-text">
          {message.content}
        </div>
        
        {hasActions && (
          <div className="ai-message-actions">
            <button 
              className="ai-actions-toggle"
              onClick={() => setActionsExpanded(!actionsExpanded)}
            >
              <span>Suggested Actions ({message.actions.length})</span>
              {actionsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {actionsExpanded && (
              <div className="ai-actions-list">
                {message.actions.map((action, idx) => (
                  <ActionCard 
                    key={idx} 
                    action={action} 
                    onClick={() => onActionClick(action)}
                    disabled={!isLatest}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {message.error && (
          <div className="ai-message-error">
            <AlertCircle size={14} />
            <span>{message.error}</span>
          </div>
        )}
        
        <div className="ai-message-time">
          {new Date(message.timestamp).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACTION CARD COMPONENT
// ============================================

function ActionCard({ action, onClick, disabled }) {
  const getActionIcon = () => {
    switch (action.type) {
      case 'ADD_SECTION':
        return <Plus size={16} />;
      case 'UPDATE_SECTION_CONFIG':
        return <Settings size={16} />;
      case 'GENERATED_CONTENT':
        return <FileText size={16} />;
      default:
        return <Lightbulb size={16} />;
    }
  };
  
  const getActionTitle = () => {
    switch (action.type) {
      case 'ADD_SECTION':
        return `Add "${action.sectionName}"`;
      case 'UPDATE_SECTION_CONFIG':
        return 'Update Configuration';
      case 'GENERATED_CONTENT':
        return `Generated ${action.contentType?.replace('_', ' ')}`;
      default:
        return 'Action';
    }
  };
  
  return (
    <button 
      className={`ai-action-card ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="ai-action-icon">
        {getActionIcon()}
      </div>
      <div className="ai-action-info">
        <span className="ai-action-title">{getActionTitle()}</span>
        <span className="ai-action-description">{action.message}</span>
      </div>
      {!disabled && (
        <div className="ai-action-apply">
          <Check size={14} />
          <span>Apply</span>
        </div>
      )}
    </button>
  );
}

// ============================================
// SUGGESTION CHIPS
// ============================================

function SuggestionChips({ suggestions, onSelect, disabled }) {
  if (!suggestions || suggestions.length === 0) return null;
  
  return (
    <div className="ai-suggestions">
      <div className="ai-suggestions-label">
        <Lightbulb size={12} />
        <span>Suggested sections to add:</span>
      </div>
      <div className="ai-suggestions-chips">
        {suggestions.slice(0, 5).map((suggestion, idx) => (
          <button
            key={idx}
            className="ai-suggestion-chip"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
          >
            <Plus size={12} />
            {suggestion.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// QUICK PROMPTS
// ============================================

function QuickPrompts({ onSelect, disabled }) {
  return (
    <div className="ai-quick-prompts">
      <div className="ai-quick-prompts-label">Quick actions:</div>
      <div className="ai-quick-prompts-list">
        {QUICK_PROMPTS.map(prompt => (
          <button
            key={prompt.id}
            className="ai-quick-prompt"
            onClick={() => onSelect(prompt.prompt)}
            disabled={disabled}
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportAIAssistant({ onClose }) {
  const {
    sections,
    reportName,
    selectedTemplate,
    parameters,
    currentStep,
    addSection,
    updateSectionConfig
  } = useReportBuilder();
  
  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    clearMessages
  } = useReportBuilderAI();
  
  const { projectId, projectName, projectRef } = useProject();
  const { user, profile } = useAuth();
  
  const [inputValue, setInputValue] = useState('');
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [pendingContent, setPendingContent] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Build context for API
  const buildContext = useCallback(() => {
    return {
      reportContext: {
        reportName,
        templateName: selectedTemplate?.name || 'Custom',
        currentStep,
        sections: sections.map(s => ({
          id: s.id,
          type: s.type,
          name: s.name,
          config: s.config
        })),
        parameters
      },
      projectContext: {
        projectId,
        projectName,
        projectRef
      },
      userContext: {
        email: user?.email,
        name: profile?.full_name,
        role: profile?.role
      }
    };
  }, [
    reportName, selectedTemplate, currentStep, sections, parameters,
    projectId, projectName, projectRef, user, profile
  ]);
  
  // Send message to AI
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;
    
    // Add user message
    addMessage({
      role: 'user',
      content: content.trim()
    });
    
    setInputValue('');
    setLoading(true);
    setPendingSuggestions([]);
    
    try {
      const context = buildContext();
      
      // Build message history for API
      const messageHistory = [
        ...messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: content.trim() }
      ];
      
      const response = await fetch('/api/report-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messageHistory,
          ...context
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message
      addMessage({
        role: 'assistant',
        content: data.message,
        actions: data.actions || []
      });
      
      // Extract suggestions from actions
      const sectionSuggestions = (data.actions || [])
        .filter(a => a.type === 'ADD_SECTION')
        .map(a => ({
          type: a.sectionType,
          name: a.sectionName
        }));
      
      if (sectionSuggestions.length > 0) {
        setPendingSuggestions(sectionSuggestions);
      }
      
      // Check for generated content
      const contentAction = (data.actions || []).find(a => a.type === 'GENERATED_CONTENT');
      if (contentAction) {
        setPendingContent(contentAction);
      }
      
    } catch (error) {
      console.error('AI Assistant error:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [isLoading, messages, addMessage, setLoading, buildContext]);
  
  // Handle form submit
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);
  
  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt) => {
    sendMessage(prompt);
  }, [sendMessage]);
  
  // Handle action click (apply action)
  const handleActionClick = useCallback((action) => {
    switch (action.type) {
      case 'ADD_SECTION':
        const newSection = addSection(action.sectionType, action.customConfig || {});
        if (newSection) {
          addMessage({
            role: 'assistant',
            content: `✓ Added "${action.sectionName}" section to your report.`
          });
          // Remove from pending suggestions
          setPendingSuggestions(prev => 
            prev.filter(s => s.type !== action.sectionType)
          );
        }
        break;
        
      case 'UPDATE_SECTION_CONFIG':
        updateSectionConfig(action.sectionId, action.configUpdates);
        addMessage({
          role: 'assistant',
          content: `✓ Updated section configuration.`
        });
        break;
        
      case 'GENERATED_CONTENT':
        // Copy content to clipboard and notify user
        navigator.clipboard?.writeText(action.content);
        addMessage({
          role: 'assistant',
          content: `✓ Content copied to clipboard. You can paste it in the section configuration.`
        });
        setPendingContent(null);
        break;
        
      default:
        console.log('Unknown action type:', action.type);
    }
  }, [addSection, updateSectionConfig, addMessage]);
  
  // Handle suggestion chip click
  const handleSuggestionSelect = useCallback((suggestion) => {
    const newSection = addSection(suggestion.type, {});
    if (newSection) {
      addMessage({
        role: 'assistant',
        content: `✓ Added "${suggestion.name}" section to your report.`
      });
      setPendingSuggestions(prev => 
        prev.filter(s => s.type !== suggestion.type)
      );
    }
  }, [addSection, addMessage]);
  
  // Handle clear chat
  const handleClearChat = useCallback(() => {
    clearMessages();
    setPendingSuggestions([]);
    setPendingContent(null);
  }, [clearMessages]);
  
  // Check if there are messages
  const hasMessages = messages.length > 0;
  
  return (
    <div className="report-ai-assistant">
      {/* Header */}
      <div className="ai-assistant-header">
        <div className="ai-assistant-title">
          <Sparkles size={18} />
          <span>AI Assistant</span>
        </div>
        <div className="ai-assistant-actions">
          {hasMessages && (
            <button 
              className="ai-header-btn"
              onClick={handleClearChat}
              title="Clear conversation"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button 
            className="ai-header-btn"
            onClick={onClose}
            title="Close assistant"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="ai-assistant-messages">
        {!hasMessages ? (
          <div className="ai-assistant-welcome">
            <div className="ai-welcome-icon">
              <Bot size={32} />
            </div>
            <h4>How can I help you?</h4>
            <p>
              I can suggest sections for your report, explain what each section shows, 
              generate content, and help configure your report.
            </p>
            <QuickPrompts onSelect={handleQuickPrompt} disabled={isLoading} />
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <ChatMessage
                key={message.id || idx}
                message={message}
                onActionClick={handleActionClick}
                isLatest={idx === messages.length - 1}
              />
            ))}
            
            {/* Pending suggestions */}
            <SuggestionChips
              suggestions={pendingSuggestions}
              onSelect={handleSuggestionSelect}
              disabled={isLoading}
            />
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="ai-message assistant loading">
                <div className="ai-message-avatar">
                  <Bot size={16} />
                </div>
                <div className="ai-message-content">
                  <div className="ai-loading-indicator">
                    <Loader2 size={16} className="ai-spinner" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input Area */}
      <form className="ai-assistant-input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me about report sections..."
          disabled={isLoading}
          className="ai-input-field"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="ai-send-btn"
        >
          {isLoading ? (
            <Loader2 size={18} className="ai-spinner" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
}
