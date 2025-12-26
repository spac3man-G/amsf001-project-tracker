/**
 * Planning AI Assistant Component
 * 
 * Conversational AI panel for the Planning tool.
 * Allows users to describe projects in natural language
 * and generates structured plans with milestones, deliverables, and tasks.
 * 
 * @version 1.0
 * @created 26 December 2025
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Flag,
  Package,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import './PlanningAIAssistant.css';

// ============================================
// CONSTANTS
// ============================================

const QUICK_PROMPTS = [
  {
    id: 'software',
    label: 'Software project',
    prompt: 'Help me plan a software development project with design, development, and launch phases.'
  },
  {
    id: 'marketing',
    label: 'Marketing campaign',
    prompt: 'Help me plan a marketing campaign with research, content creation, and execution phases.'
  },
  {
    id: 'product',
    label: 'Product launch',
    prompt: 'Help me plan a product launch including preparation, launch activities, and post-launch review.'
  },
  {
    id: 'migration',
    label: 'System migration',
    prompt: 'Help me plan a system migration project with assessment, migration, and validation phases.'
  }
];

const ITEM_ICONS = {
  milestone: Flag,
  deliverable: Package,
  task: CheckSquare
};

const ITEM_COLORS = {
  milestone: '#8b5cf6',
  deliverable: '#3b82f6',
  task: '#64748b'
};

// ============================================
// CHAT MESSAGE COMPONENT
// ============================================

function ChatMessage({ message, isLatest }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`planning-ai-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="planning-ai-message-avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="planning-ai-message-content">
        <div className="planning-ai-message-text">
          {message.content}
        </div>
        {message.error && (
          <div className="planning-ai-message-error">
            <AlertCircle size={14} />
            <span>{message.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CLARIFICATION QUESTIONS COMPONENT
// ============================================

function ClarificationQuestions({ questions, onAnswer }) {
  return (
    <div className="planning-ai-clarification">
      <div className="planning-ai-clarification-header">
        <HelpCircle size={16} />
        <span>I need a bit more information:</span>
      </div>
      <ul className="planning-ai-clarification-list">
        {questions.map((question, idx) => (
          <li key={idx}>{question}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// STRUCTURE TREE ITEM COMPONENT
// ============================================

function StructureTreeItem({ item, depth = 0, expanded, onToggle }) {
  const Icon = ITEM_ICONS[item.item_type] || CheckSquare;
  const color = ITEM_COLORS[item.item_type] || '#64748b';
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expanded[item.name] !== false; // Default to expanded
  
  return (
    <div className="structure-tree-item">
      <div 
        className="structure-tree-item-row"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button 
            className="structure-tree-toggle"
            onClick={() => onToggle(item.name)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="structure-tree-spacer" />
        )}
        <Icon size={16} style={{ color, flexShrink: 0 }} />
        <span className="structure-tree-name">{item.name}</span>
        {item.duration_days && (
          <span className="structure-tree-duration">{item.duration_days}d</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="structure-tree-children">
          {item.children.map((child, idx) => (
            <StructureTreeItem 
              key={`${child.name}-${idx}`}
              item={child} 
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// STRUCTURE PREVIEW COMPONENT
// ============================================

function StructurePreview({ structure, itemCounts, onApply, onRefine, isApplying }) {
  const [expanded, setExpanded] = useState({});
  
  const toggleExpand = (name) => {
    setExpanded(prev => ({
      ...prev,
      [name]: prev[name] === false ? true : false
    }));
  };
  
  const totalItems = (itemCounts?.milestones || 0) + 
                     (itemCounts?.deliverables || 0) + 
                     (itemCounts?.tasks || 0);
  
  return (
    <div className="planning-ai-preview">
      <div className="planning-ai-preview-header">
        <h4>Generated Structure</h4>
        <div className="planning-ai-preview-counts">
          <span className="count-badge milestone">
            <Flag size={12} /> {itemCounts?.milestones || 0}
          </span>
          <span className="count-badge deliverable">
            <Package size={12} /> {itemCounts?.deliverables || 0}
          </span>
          <span className="count-badge task">
            <CheckSquare size={12} /> {itemCounts?.tasks || 0}
          </span>
        </div>
      </div>
      
      <div className="planning-ai-preview-tree">
        {structure.map((item, idx) => (
          <StructureTreeItem 
            key={`${item.name}-${idx}`}
            item={item}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        ))}
      </div>
      
      <div className="planning-ai-preview-actions">
        <button 
          className="planning-ai-btn secondary"
          onClick={onRefine}
          disabled={isApplying}
        >
          <RefreshCw size={16} />
          Refine
        </button>
        <button 
          className="planning-ai-btn primary"
          onClick={onApply}
          disabled={isApplying}
        >
          {isApplying ? (
            <>
              <Loader2 size={16} className="spinning" />
              Applying...
            </>
          ) : (
            <>
              <Plus size={16} />
              Apply to Planning ({totalItems} items)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// QUICK PROMPTS COMPONENT
// ============================================

function QuickPrompts({ onSelect, disabled }) {
  return (
    <div className="planning-ai-quick-prompts">
      <div className="planning-ai-quick-prompts-label">
        <Sparkles size={14} />
        Quick start:
      </div>
      <div className="planning-ai-quick-prompts-list">
        {QUICK_PROMPTS.map(prompt => (
          <button
            key={prompt.id}
            className="planning-ai-quick-prompt"
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

export default function PlanningAIAssistant({ onClose, onApplyStructure }) {
  const { projectId, projectName } = useProject();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [currentStructure, setCurrentStructure] = useState(null);
  const [currentItemCounts, setCurrentItemCounts] = useState(null);
  const [clarificationQuestions, setClarificationQuestions] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStructure]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Add message to chat
  const addMessage = useCallback((role, content, error = null) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role,
      content,
      error,
      timestamp: new Date()
    }]);
  }, []);
  
  // Send message to API
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;
    
    // Add user message
    addMessage('user', content.trim());
    setInputValue('');
    setIsLoading(true);
    setClarificationQuestions(null);
    
    try {
      // Build message history
      const messageHistory = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: content.trim() }
      ];
      
      const response = await fetch('/api/planning-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messageHistory,
          projectContext: { projectId, projectName },
          currentStructure: currentStructure
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle response
      if (data.error) {
        addMessage('assistant', 'Sorry, I encountered an error. Please try again.', data.error);
      } else if (data.clarificationNeeded) {
        addMessage('assistant', data.message);
        setClarificationQuestions(data.questions);
      } else if (data.structure) {
        addMessage('assistant', data.message);
        setCurrentStructure(data.structure);
        setCurrentItemCounts(data.itemCounts);
      } else if (data.message) {
        addMessage('assistant', data.message);
      }
      
    } catch (error) {
      console.error('Planning AI error:', error);
      addMessage('assistant', 'Sorry, I had trouble connecting. Please try again.', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, addMessage, projectId, projectName, currentStructure]);
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };
  
  // Handle apply structure
  const handleApply = async () => {
    if (!currentStructure || !onApplyStructure) return;
    
    setIsApplying(true);
    try {
      await onApplyStructure(currentStructure);
      addMessage('assistant', `✅ Successfully added ${currentItemCounts?.milestones || 0} milestones, ${currentItemCounts?.deliverables || 0} deliverables, and ${currentItemCounts?.tasks || 0} tasks to your plan.`);
      setCurrentStructure(null);
      setCurrentItemCounts(null);
    } catch (error) {
      console.error('Apply structure error:', error);
      addMessage('assistant', 'Failed to apply the structure. Please try again.', error.message);
    } finally {
      setIsApplying(false);
    }
  };
  
  // Handle refine
  const handleRefine = () => {
    inputRef.current?.focus();
    setInputValue('Please refine this structure: ');
  };
  
  // Welcome message
  const showWelcome = messages.length === 0;
  
  return (
    <div className="planning-ai-panel">
      {/* Header */}
      <div className="planning-ai-header">
        <div className="planning-ai-header-title">
          <Sparkles size={20} />
          <span>AI Planning Assistant</span>
        </div>
        <button className="planning-ai-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      {/* Messages */}
      <div className="planning-ai-messages">
        {showWelcome && (
          <div className="planning-ai-welcome">
            <Bot size={32} />
            <h3>Let's plan your project</h3>
            <p>
              Describe your project and I'll create a structured plan with 
              milestones, deliverables, and tasks.
            </p>
            <QuickPrompts onSelect={sendMessage} disabled={isLoading} />
          </div>
        )}
        
        {messages.map(message => (
          <ChatMessage 
            key={message.id} 
            message={message}
            isLatest={message.id === messages[messages.length - 1]?.id}
          />
        ))}
        
        {clarificationQuestions && (
          <ClarificationQuestions questions={clarificationQuestions} />
        )}
        
        {currentStructure && (
          <StructurePreview
            structure={currentStructure}
            itemCounts={currentItemCounts}
            onApply={handleApply}
            onRefine={handleRefine}
            isApplying={isApplying}
          />
        )}
        
        {isLoading && (
          <div className="planning-ai-loading">
            <Loader2 size={20} className="spinning" />
            <span>Thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form className="planning-ai-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Describe your project..."
          disabled={isLoading || isApplying}
          className="planning-ai-input"
        />
        <button 
          type="submit" 
          className="planning-ai-send"
          disabled={!inputValue.trim() || isLoading || isApplying}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
