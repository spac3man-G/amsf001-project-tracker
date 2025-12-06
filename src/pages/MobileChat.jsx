// src/pages/MobileChat.jsx
// Full-screen mobile AI Project Assistant
// Version 1.0
//
// Dedicated mobile experience for the AI chat assistant with:
// - Full-screen layout optimized for mobile
// - Quick action buttons for common queries
// - Back navigation
// - Touch-optimized interface

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Send, Bot, User, Loader2, Trash2,
  Database, Zap, XCircle, Copy, Check, Download, RefreshCw,
  BarChart3, Clock, FileText, Target, DollarSign, CheckCircle,
  AlertTriangle, HelpCircle
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import './MobileChat.css';

// Quick action buttons with icons
const QUICK_ACTIONS = [
  { 
    id: 'status', 
    label: 'Project Status', 
    icon: BarChart3,
    query: "What's the current project status?" 
  },
  { 
    id: 'pending', 
    label: 'My Actions', 
    icon: CheckCircle,
    query: "What do I need to do?" 
  },
  { 
    id: 'timesheets', 
    label: 'My Hours', 
    icon: Clock,
    query: "Show my timesheets this week" 
  },
  { 
    id: 'budget', 
    label: 'Budget', 
    icon: DollarSign,
    query: "What's the budget status?" 
  },
  { 
    id: 'milestones', 
    label: 'Milestones', 
    icon: Target,
    query: "What milestones are due soon?" 
  },
  { 
    id: 'atrisk', 
    label: 'At Risk', 
    icon: AlertTriangle,
    query: "What's at risk in the project?" 
  },
  { 
    id: 'deliverables', 
    label: 'Deliverables', 
    icon: FileText,
    query: "Show deliverables awaiting review" 
  },
  { 
    id: 'help', 
    label: 'What Can I Do?', 
    icon: HelpCircle,
    query: "What can my role do in this project?" 
  },
];

export default function MobileChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { projectName, projectRef } = useProject();
  
  const {
    messages,
    isLoading,
    isLoadingContext,
    error,
    retryCount,
    sendMessage,
    clearChat,
    cancelRequest,
    dismissError,
    downloadChat,
    copyMessage,
  } = useChat();

  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => setCopiedIndex(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);

  // Hide quick actions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickActions(false);
    }
  }, [messages.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleQuickAction = (query) => {
    if (!isLoading) {
      sendMessage(query);
      setShowQuickActions(false);
    }
  };

  const handleCopy = async (content, index) => {
    const success = await copyMessage(content);
    if (success) {
      setCopiedIndex(index);
    }
  };

  const handleBack = () => {
    // Navigate back or to dashboard
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate('/dashboard');
    }
  };

  // Welcome message for empty chat
  const welcomeMessage = {
    role: 'assistant',
    content: `Hi${profile?.full_name ? ` ${profile.full_name.split(' ')[0]}` : ''}! 👋

I'm your Project Assistant. Ask me anything about **${projectName || 'your project'}**.

Tap a quick action below or type your question!`,
  };

  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  return (
    <div className="mobile-chat">
      {/* Header */}
      <header className="mobile-chat-header">
        <button 
          className="mobile-chat-back"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="mobile-chat-title">
          <div className="mobile-chat-title-main">
            <Bot size={20} />
            <span>Project Assistant</span>
          </div>
          {projectRef && (
            <span className="mobile-chat-project">{projectRef}</span>
          )}
        </div>
        
        <div className="mobile-chat-actions">
          {messages.length > 0 && (
            <>
              <button
                className="mobile-chat-action"
                onClick={downloadChat}
                title="Export chat"
              >
                <Download size={20} />
              </button>
              <button
                className="mobile-chat-action"
                onClick={clearChat}
                title="Clear chat"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Context loading indicator */}
      {isLoadingContext && (
        <div className="mobile-chat-context-loading">
          <Loader2 size={14} className="spinning" />
          <span>Loading project data...</span>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && messages.length === 0 && (
        <div className="mobile-chat-quick-actions">
          <div className="mobile-chat-quick-grid">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className="mobile-chat-quick-btn"
                  onClick={() => handleQuickAction(action.query)}
                  disabled={isLoading}
                >
                  <Icon size={20} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="mobile-chat-messages">
        {displayMessages.map((msg, index) => (
          <div
            key={index}
            className={`mobile-chat-message ${
              msg.role === 'user' ? 'mobile-chat-message-user' : 'mobile-chat-message-assistant'
            } ${msg.streaming ? 'mobile-chat-message-streaming' : ''}`}
          >
            <div className="mobile-chat-message-avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="mobile-chat-message-content">
              <MessageContent content={msg.content} />
              
              <div className="mobile-chat-message-meta">
                {msg.local && (
                  <span className="mobile-chat-indicator" title="Instant response">
                    <Zap size={12} />
                  </span>
                )}
                {msg.toolsUsed && (
                  <span className="mobile-chat-indicator" title="Queried data">
                    <Database size={12} />
                  </span>
                )}
                <button
                  className="mobile-chat-copy-btn"
                  onClick={() => handleCopy(msg.content, index)}
                >
                  {copiedIndex === index ? (
                    <Check size={14} className="copied" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mobile-chat-message mobile-chat-message-assistant">
            <div className="mobile-chat-message-avatar">
              <Bot size={16} />
            </div>
            <div className="mobile-chat-message-content mobile-chat-typing">
              {retryCount > 0 ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  <span>Retrying ({retryCount}/2)...</span>
                </>
              ) : (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Thinking...</span>
                </>
              )}
              <button 
                className="mobile-chat-cancel"
                onClick={cancelRequest}
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mobile-chat-error">
            <span>{error}</span>
            <button onClick={dismissError}>
              <XCircle size={16} />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Show quick actions toggle when messages exist */}
      {messages.length > 0 && !showQuickActions && (
        <button 
          className="mobile-chat-show-actions"
          onClick={() => setShowQuickActions(true)}
        >
          Quick Actions
        </button>
      )}

      {/* Collapsed quick actions */}
      {showQuickActions && messages.length > 0 && (
        <div className="mobile-chat-quick-collapsed">
          <div className="mobile-chat-quick-scroll">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className="mobile-chat-quick-chip"
                  onClick={() => handleQuickAction(action.query)}
                  disabled={isLoading}
                >
                  <Icon size={14} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <form className="mobile-chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="mobile-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your project..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="mobile-chat-send"
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </form>

      {/* Footer */}
      <div className="mobile-chat-footer">
        <Zap size={12} />
        <span>Powered by Claude AI</span>
      </div>
    </div>
  );
}

// Message content with simple markdown formatting
function MessageContent({ content }) {
  const lines = content.split('\n');
  
  return (
    <div className="mobile-chat-text">
      {lines.map((line, i) => {
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="mobile-chat-bullet">
              <span className="bullet">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatText(line.substring(2)) }} />
            </div>
          );
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <div key={i} className="mobile-chat-break" />;
        }
        
        // Regular text
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatText(line) }} />
        );
      })}
    </div>
  );
}

// Format **bold** text
function formatText(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
