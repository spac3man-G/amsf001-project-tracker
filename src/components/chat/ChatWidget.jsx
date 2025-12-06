// src/components/chat/ChatWidget.jsx
// Floating AI chat widget with expandable panel
// Version 4.1 - Hide on mobile chat route

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageCircle, X, Send, Trash2, Bot, User, Loader2, Sparkles, 
  Database, RefreshCw, XCircle, Copy, Check, Download, BarChart3, Zap,
  Calendar, ChevronDown, Lightbulb
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { getSuggestedQuestions, containsDateQuery } from '../../lib/chatSuggestions';
import { parseNaturalDate, formatDateRange, getDateSuggestions } from '../../lib/naturalDateParser';
import './ChatWidget.css';

export default function ChatWidget() {
  const location = useLocation();
  const { role } = useAuth();

  // Hide widget on mobile chat route
  if (location.pathname === '/chat') {
    return null;
  }
  
  const {
    isOpen,
    toggleChat,
    messages,
    isLoading,
    isLoadingContext,
    error,
    retryCount,
    tokenUsage,
    sendMessage,
    clearChat,
    cancelRequest,
    dismissError,
    downloadChat,
    copyMessage,
  } = useChat();

  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const datePickerRef = useRef(null);

  // Get suggested questions based on current page
  const suggestedQuestions = useMemo(() => {
    return getSuggestedQuestions(location.pathname, role);
  }, [location.pathname, role]);

  // Check if input might benefit from date picker
  const showDateHint = useMemo(() => {
    return input.length > 5 && containsDateQuery(input);
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => setCopiedIndex(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // Check for natural language date in the query
      const dateResult = parseNaturalDate(input.trim());
      let finalInput = input;
      
      // If a date range was selected from picker, append it
      if (dateRange.start && dateRange.end) {
        finalInput = `${input} (from ${dateRange.start} to ${dateRange.end})`;
        setDateRange({ start: '', end: '' });
      }
      
      sendMessage(finalInput);
      setInput('');
      setShowDatePicker(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = async (content, index) => {
    const success = await copyMessage(content);
    if (success) {
      setCopiedIndex(index);
    }
  };

  const handleSuggestionClick = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleQuickDateSelect = (dateText) => {
    const result = parseNaturalDate(dateText);
    if (result) {
      setDateRange({
        start: result.start.toISOString().split('T')[0],
        end: result.end.toISOString().split('T')[0]
      });
      // If there's existing input, append the date context
      if (input.trim()) {
        setInput(`${input.trim()} ${dateText}`);
      }
      setShowDatePicker(false);
    }
  };

  // Welcome message for empty chat
  const welcomeMessage = {
    role: 'assistant',
    content: `Hello! I'm your Project Assistant. I can query your project data and help you understand what's happening. Try asking:

• **"What do I need to do?"** - See your pending actions
• **"Show my timesheets this month"** - Query your time entries
• **"What milestones are at risk?"** - Check project progress
• **"What's the budget status?"** - View spend vs forecast

💡 **Tip:** I understand natural dates like "last month", "Q3", or "past 2 weeks"

All data is scoped to your role, so just ask naturally!`,
  };

  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  // Calculate estimated cost (Haiku pricing)
  const estimatedCost = (
    (tokenUsage.input * 0.25 / 1000000) + 
    (tokenUsage.output * 1.25 / 1000000)
  ).toFixed(4);

  const dateSuggestions = getDateSuggestions();

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className={`chat-toggle-btn ${isOpen ? 'chat-open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <MessageCircle size={24} />
            <Sparkles className="chat-sparkle" size={12} />
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`chat-panel ${isOpen ? 'chat-panel-open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <Bot size={20} />
            <span>Project Assistant</span>
          </div>
          <div className="chat-header-actions">
            {messages.length > 0 && (
              <>
                <button
                  className="chat-action-btn"
                  onClick={downloadChat}
                  title="Export chat as Markdown"
                >
                  <Download size={16} />
                </button>
                <button
                  className="chat-action-btn"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              className="chat-close-btn"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Suggested Questions - shown when chat is empty or on new page */}
        {(messages.length === 0 || showSuggestions) && suggestedQuestions.length > 0 && (
          <div className="chat-suggestions">
            <div className="chat-suggestions-header">
              <Lightbulb size={14} />
              <span>Try asking:</span>
            </div>
            <div className="chat-suggestions-list">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="chat-suggestion-btn"
                  onClick={() => handleSuggestionClick(q.text)}
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {displayMessages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'} ${msg.streaming ? 'chat-message-streaming' : ''}`}
            >
              <div className="chat-message-avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-message-content">
                <MessageContent content={msg.content} />
                <div className="chat-message-actions">
                  {msg.local && (
                    <span className="chat-local-indicator" title="Instant response from cached data">
                      <Zap size={12} />
                    </span>
                  )}
                  {msg.toolsUsed && (
                    <span className="chat-tools-indicator" title="Queried project data">
                      <Database size={12} />
                    </span>
                  )}
                  <button
                    className="chat-copy-btn"
                    onClick={() => handleCopy(msg.content, index)}
                    title={copiedIndex === index ? 'Copied!' : 'Copy message'}
                  >
                    {copiedIndex === index ? (
                      <Check size={12} className="chat-copy-success" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="chat-message chat-message-assistant">
              <div className="chat-message-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-message-content chat-typing">
                {retryCount > 0 ? (
                  <>
                    <RefreshCw className="chat-typing-icon" size={16} />
                    <span>Retrying ({retryCount}/2)...</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="chat-typing-icon" size={16} />
                    <span>Querying data...</span>
                  </>
                )}
                <button 
                  className="chat-cancel-btn"
                  onClick={cancelRequest}
                  title="Cancel request"
                >
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="chat-error">
              <span>{error}</span>
              <button 
                className="chat-error-dismiss"
                onClick={dismissError}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Date Picker Panel */}
        {showDatePicker && (
          <div className="chat-date-picker" ref={datePickerRef}>
            <div className="chat-date-picker-header">
              <Calendar size={14} />
              <span>Select Date Range</span>
              <button onClick={() => setShowDatePicker(false)}>
                <X size={14} />
              </button>
            </div>
            
            <div className="chat-date-quick">
              {dateSuggestions.slice(0, 8).map((ds, i) => (
                <button
                  key={i}
                  className="chat-date-quick-btn"
                  onClick={() => handleQuickDateSelect(ds.text)}
                >
                  {ds.text}
                </button>
              ))}
            </div>
            
            <div className="chat-date-custom">
              <div className="chat-date-field">
                <label>From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="chat-date-field">
                <label>To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            
            {dateRange.start && dateRange.end && (
              <div className="chat-date-preview">
                Selected: {formatDateRange(new Date(dateRange.start), new Date(dateRange.end))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          {/* Date hint */}
          {showDateHint && !showDatePicker && (
            <div className="chat-date-hint" onClick={() => setShowDatePicker(true)}>
              <Calendar size={12} />
              <span>Add date range</span>
            </div>
          )}
          
          <div className="chat-input-wrapper">
            <button
              type="button"
              className={`chat-date-toggle ${showDatePicker ? 'active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Select date range"
            >
              <Calendar size={16} />
            </button>
            
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your project..."
              rows={1}
              disabled={isLoading}
            />
            
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>

        {/* Footer with stats */}
        <div className="chat-footer">
          <button 
            className="chat-stats-toggle"
            onClick={() => setShowStats(!showStats)}
            title="Toggle usage stats"
          >
            <BarChart3 size={12} />
          </button>
          
          {showStats ? (
            <div className="chat-stats">
              <span title="Total requests">{tokenUsage.requests} req</span>
              <span className="chat-stats-divider">•</span>
              <span title="Input tokens">{tokenUsage.input.toLocaleString()} in</span>
              <span className="chat-stats-divider">•</span>
              <span title="Output tokens">{tokenUsage.output.toLocaleString()} out</span>
              <span className="chat-stats-divider">•</span>
              <span title="Estimated cost">${estimatedCost}</span>
            </div>
          ) : isLoadingContext ? (
            <span className="chat-context-loading">
              <Loader2 size={12} className="chat-context-spinner" />
              Loading context...
            </span>
          ) : (
            <span className="chat-context-ready" title="Project data pre-loaded for faster responses">
              <Zap size={12} />
              Powered by Claude AI
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// Component to render message content with markdown-like formatting
function MessageContent({ content }) {
  // Simple markdown-like parsing for bold and bullet points
  const lines = content.split('\n');
  
  return (
    <div className="chat-message-text">
      {lines.map((line, i) => {
        // Handle bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          const text = line.substring(2);
          return (
            <div key={i} className="chat-bullet">
              <span className="chat-bullet-dot">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(text) }} />
            </div>
          );
        }
        
        // Handle empty lines
        if (line.trim() === '') {
          return <div key={i} className="chat-line-break" />;
        }
        
        // Regular text with bold formatting
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
        );
      })}
    </div>
  );
}

// Format **bold** text
function formatBold(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
