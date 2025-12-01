// src/components/chat/ChatWidget.jsx
// Floating AI chat widget with expandable panel
// Version 3.2 - Added copy, export, and token stats

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Trash2, Bot, User, Loader2, Sparkles, 
  Database, RefreshCw, XCircle, Copy, Check, Download, BarChart3 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import './ChatWidget.css';

export default function ChatWidget() {
  const {
    isOpen,
    toggleChat,
    messages,
    isLoading,
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
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

  // Welcome message for empty chat
  const welcomeMessage = {
    role: 'assistant',
    content: `Hello! I'm your Project Assistant. I can query your project data and help you understand what's happening. Try asking:

• **"What do I need to do?"** - See your pending actions
• **"Show my timesheets this month"** - Query your time entries
• **"What milestones are at risk?"** - Check project progress
• **"What's the budget status?"** - View spend vs forecast
• **"What can my role do?"** - Understand your permissions

All data is scoped to your role, so just ask naturally!`,
  };

  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  // Calculate estimated cost (Haiku pricing)
  const estimatedCost = (
    (tokenUsage.input * 0.25 / 1000000) + 
    (tokenUsage.output * 1.25 / 1000000)
  ).toFixed(4);

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

        {/* Messages */}
        <div className="chat-messages">
          {displayMessages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
            >
              <div className="chat-message-avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-message-content">
                <MessageContent content={msg.content} />
                <div className="chat-message-actions">
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

        {/* Input */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about the project..."
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
          ) : (
            <span>Powered by Claude AI</span>
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
