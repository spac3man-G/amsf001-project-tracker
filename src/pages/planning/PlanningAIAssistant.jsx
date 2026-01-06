/**
 * Planning AI Assistant Component
 * 
 * Conversational AI panel for the Planning tool.
 * Allows users to describe projects in natural language
 * and generates structured plans with milestones, deliverables, and tasks.
 * 
 * @version 1.1
 * @created 26 December 2025
 * @updated 26 December 2025 - Added document upload support
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
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Upload,
  FileText,
  Image,
  Trash2
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

// Document-specific quick prompts
const DOCUMENT_QUICK_PROMPTS = [
  {
    id: 'analyze',
    label: 'Create plan from document',
    prompt: 'Analyze this document and create a complete project plan structure.'
  },
  {
    id: 'extract',
    label: 'Extract deliverables',
    prompt: 'Extract the key deliverables and milestones from this document.'
  },
  {
    id: 'timeline',
    label: 'Build timeline',
    prompt: 'Create a project timeline based on the requirements in this document.'
  },
  {
    id: 'summarize',
    label: 'Summarize scope',
    prompt: 'Summarize the project scope and suggest a work breakdown structure.'
  }
];

// Document upload constants
// Note: Claude API only supports PDF as document type; Office formats require Analysis Tool
const ALLOWED_FILE_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF' },
  'image/jpeg': { icon: Image, label: 'JPEG' },
  'image/png': { icon: Image, label: 'PNG' },
  'image/webp': { icon: Image, label: 'WebP' },
  'image/gif': { icon: Image, label: 'GIF' }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const ITEM_ICONS = {
  component: Layers,
  milestone: Flag,
  deliverable: Package,
  task: CheckSquare
};

const ITEM_COLORS = {
  component: '#f59e0b',
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
  
  const totalItems = (itemCounts?.components || 0) +
                     (itemCounts?.milestones || 0) + 
                     (itemCounts?.deliverables || 0) + 
                     (itemCounts?.tasks || 0);
  
  return (
    <div className="planning-ai-preview">
      <div className="planning-ai-preview-header">
        <h4>Generated Structure</h4>
        <div className="planning-ai-preview-counts">
          {(itemCounts?.components || 0) > 0 && (
            <span className="count-badge component">
              <Layers size={12} /> {itemCounts?.components || 0}
            </span>
          )}
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

function QuickPrompts({ onSelect, disabled, prompts = QUICK_PROMPTS, label = 'Quick start:' }) {
  return (
    <div className="planning-ai-quick-prompts">
      <div className="planning-ai-quick-prompts-label">
        <Sparkles size={14} />
        {label}
      </div>
      <div className="planning-ai-quick-prompts-list">
        {prompts.map(prompt => (
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
// DOCUMENT UPLOAD COMPONENT (Multiple Files)
// ============================================

function DocumentUpload({ documents = [], onDocumentAdd, onDocumentRemove, disabled, maxFiles = 5 }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return { valid: false, error: 'Unsupported file type. Please upload PDF or images (JPEG, PNG, WebP, GIF). Word, PowerPoint, and Excel are not yet supported.' };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.` };
    }
    
    // Check max files
    if (documents.length >= maxFiles) {
      return { valid: false, error: `Maximum ${maxFiles} documents allowed.` };
    }
    
    return { valid: true };
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Extract base64 data (remove the data:xxx;base64, prefix)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file) => {
    setError(null);
    
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsReading(true);
    try {
      const base64Data = await readFileAsBase64(file);
      onDocumentAdd({
        id: Date.now(), // Unique ID for removal
        filename: file.name,
        mediaType: file.type,
        size: file.size,
        data: base64Data
      });
    } catch (err) {
      setError('Failed to read file. Please try again.');
      console.error('File read error:', err);
    } finally {
      setIsReading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files || []);
    for (const file of files) {
      await handleFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && documents.length < maxFiles) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="document-upload-container">
      {/* Show uploaded documents */}
      {documents.length > 0 && (
        <div className="document-upload-list">
          {documents.map((doc) => {
            const FileIcon = ALLOWED_FILE_TYPES[doc.mediaType]?.icon || FileText;
            return (
              <div key={doc.id} className="document-upload-preview">
                <div className="document-preview-info">
                  <FileIcon size={18} className="document-preview-icon" />
                  <div className="document-preview-details">
                    <span className="document-preview-name">{doc.filename}</span>
                    <span className="document-preview-size">{formatFileSize(doc.size)}</span>
                  </div>
                </div>
                <button 
                  className="document-preview-remove"
                  onClick={() => onDocumentRemove(doc.id)}
                  disabled={disabled}
                  title="Remove document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Upload zone (show if under limit) */}
      {documents.length < maxFiles && (
        <div 
          className={`document-upload-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${documents.length > 0 ? 'compact' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={disabled}
            multiple
          />
        
        {isReading ? (
          <div className="document-upload-reading">
            <Loader2 size={20} className="spinning" />
            <span>Reading...</span>
          </div>
        ) : documents.length > 0 ? (
          <>
            <Plus size={18} className="document-upload-icon" />
            <span className="document-upload-text">Add another document</span>
          </>
        ) : (
          <>
            <Upload size={24} className="document-upload-icon" />
            <span className="document-upload-text">
              Drop documents here or click to upload
            </span>
            <span className="document-upload-hint">
              PDF or images (max 10MB each, up to {maxFiles} files)
            </span>
          </>
        )}
        </div>
      )}
      
      {error && (
        <div className="document-upload-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PlanningAIAssistant({ onClose, onApplyStructure, existingItems = [], onExecuteOperations }) {
  const { projectId, projectName } = useProject();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [currentStructure, setCurrentStructure] = useState(null);
  const [currentItemCounts, setCurrentItemCounts] = useState(null);
  const [clarificationQuestions, setClarificationQuestions] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);
  
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
    const hasContent = content && content.trim();
    const hasDocuments = uploadedDocuments.length > 0;
    
    // Must have content or documents
    if (!hasContent && !hasDocuments) return;
    if (isLoading) return;
    
    // Build user message text
    const messageText = hasContent 
      ? content.trim() 
      : 'Please analyze these documents and create a project plan structure.';
    
    // Add user message (include document indicators if present)
    let displayMessage = content?.trim() || '';
    if (hasDocuments) {
      const docList = uploadedDocuments.map(d => `📎 ${d.filename}`).join('\n');
      displayMessage = docList + (displayMessage ? `\n\n${displayMessage}` : '\n\nAnalyze these documents and create a project plan.');
    }
    
    addMessage('user', displayMessage);
    setInputValue('');
    setIsLoading(true);
    setIsAnalyzingDocument(hasDocuments);
    setClarificationQuestions(null);
    
    // Store documents reference and clear from state
    const documentsToSend = [...uploadedDocuments];
    setUploadedDocuments([]);
    
    try {
      // Build message history
      const messageHistory = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageText }
      ];
      
      // Build request payload
      const requestPayload = {
        messages: messageHistory,
        projectContext: { projectId, projectName },
        currentStructure: currentStructure,
        existingItems: existingItems // Pass current plan items for editing
      };
      
      // Add documents if present (support multiple)
      if (documentsToSend.length > 0) {
        requestPayload.documents = documentsToSend.map(doc => ({
          mediaType: doc.mediaType,
          data: doc.data,
          filename: doc.filename,
          size: doc.size
        }));
      }
      
      // Create an abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000); // 2.5 minute timeout
      
      const response = await fetch('/api/planning-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Planning AI error response:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      // Debug log
      console.log('Planning AI response:', { 
        hasError: !!data.error,
        hasMessage: !!data.message, 
        hasStructure: !!data.structure,
        hasClarification: data.clarificationNeeded,
        hasOperations: !!data.operations,
        stopReason: data.stopReason
      });
      
      // Handle response
      if (data.error) {
        addMessage('assistant', 'Sorry, I encountered an error. Please try again.', data.error);
      } else if (data.clarificationNeeded) {
        addMessage('assistant', data.message);
        setClarificationQuestions(data.questions);
      } else if (data.operations && onExecuteOperations) {
        // Handle edit operations
        addMessage('assistant', data.message);
        try {
          await onExecuteOperations(data.operations);
          addMessage('assistant', '✅ Changes applied successfully.');
        } catch (opError) {
          addMessage('assistant', `❌ Failed to apply changes: ${opError.message}`, opError.message);
        }
      } else if (data.structure) {
        addMessage('assistant', data.message || 'Here\'s the generated project structure:');
        setCurrentStructure(data.structure);
        setCurrentItemCounts(data.itemCounts);
      } else if (data.message) {
        addMessage('assistant', data.message);
      } else {
        // Fallback - no recognizable response
        addMessage('assistant', 'I received your request but couldn\'t generate a structured response. Please try rephrasing your request or provide more details.');
      }
      
    } catch (error) {
      console.error('Planning AI error:', error);
      if (error.name === 'AbortError') {
        addMessage('assistant', 'The request timed out. This might be due to large documents. Try with smaller files or a simpler request.', 'Request timed out after 2.5 minutes');
      } else {
        addMessage('assistant', 'Sorry, I had trouble connecting. Please try again.', error.message);
      }
    } finally {
      setIsLoading(false);
      setIsAnalyzingDocument(false);
    }
  }, [messages, isLoading, addMessage, projectId, projectName, currentStructure, uploadedDocuments, existingItems, onExecuteOperations]);
  
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
              Describe your project or upload a document (project brief, requirements, scope) 
              and I'll create a structured plan with milestones, deliverables, and tasks.
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
            <span>{isAnalyzingDocument ? 'Analyzing documents...' : 'Thinking...'}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Document Upload */}
      <div className="planning-ai-upload-section">
        <DocumentUpload
          documents={uploadedDocuments}
          onDocumentAdd={(doc) => setUploadedDocuments(prev => [...prev, doc])}
          onDocumentRemove={(id) => setUploadedDocuments(prev => prev.filter(d => d.id !== id))}
          disabled={isLoading || isApplying}
          maxFiles={5}
        />
        {uploadedDocuments.length > 0 && !isLoading && (
          <QuickPrompts 
            onSelect={sendMessage} 
            disabled={isLoading} 
            prompts={DOCUMENT_QUICK_PROMPTS}
            label={`With ${uploadedDocuments.length === 1 ? 'this document' : 'these documents'}:`}
          />
        )}
      </div>
      
      {/* Input */}
      <form className="planning-ai-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={uploadedDocuments.length > 0 ? "Describe what to do with these documents..." : "Describe your project..."}
          disabled={isLoading || isApplying}
          className="planning-ai-input"
        />
        <button 
          type="submit" 
          className="planning-ai-send"
          disabled={(!inputValue.trim() && uploadedDocuments.length === 0) || isLoading || isApplying}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
