// src/contexts/ChatContext.jsx
// Provides AI chat state and functionality to the application
// Version 3.3 - Added context pre-fetching for instant responses

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

const ChatContext = createContext(null);

// Storage key for chat history
const CHAT_STORAGE_KEY = 'amsf-chat-history';
const MAX_STORED_MESSAGES = 50;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 1000,
  retryableCodes: [429, 503, 504],
};

// Load chat history from localStorage
function loadChatHistory() {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        messages: data.messages || [],
        tokenUsage: data.tokenUsage || { input: 0, output: 0, requests: 0 },
      };
    }
  } catch (e) {
    console.warn('Failed to load chat history:', e);
  }
  return { messages: [], tokenUsage: { input: 0, output: 0, requests: 0 } };
}

// Save chat history to localStorage
function saveChatHistory(messages, tokenUsage) {
  try {
    // Keep only last N messages
    const trimmedMessages = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
      messages: trimmedMessages,
      tokenUsage,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Failed to save chat history:', e);
  }
}

export function ChatProvider({ children }) {
  const { user, profile, linkedResource, role } = useAuth();
  const { projectId, projectName, projectRef, currentProject } = useProject();
  
  // Load initial state from localStorage
  const initialState = loadChatHistory();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialState.messages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tokenUsage, setTokenUsage] = useState(initialState.tokenUsage);
  const [prefetchedContext, setPrefetchedContext] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const abortControllerRef = useRef(null);
  const contextFetchedForProject = useRef(null);

  // Save to localStorage when messages or token usage change
  useEffect(() => {
    if (messages.length > 0 || tokenUsage.requests > 0) {
      saveChatHistory(messages, tokenUsage);
    }
  }, [messages, tokenUsage]);

  // Pre-fetch context when chat opens (for instant responses)
  useEffect(() => {
    // Only fetch if chat is open, we have a project, and haven't fetched for this project yet
    if (!isOpen || !projectId || contextFetchedForProject.current === projectId) {
      return;
    }

    const fetchContext = async () => {
      setIsLoadingContext(true);
      try {
        const userContext = {
          email: user?.email,
          role: role || profile?.role,
          linkedResourceId: linkedResource?.id,
          partnerId: linkedResource?.partner_id,
        };

        const response = await fetch('/api/chat-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, userContext }),
        });

        if (response.ok) {
          const data = await response.json();
          setPrefetchedContext(data.context);
          contextFetchedForProject.current = projectId;
          console.log(`[Chat] Context pre-fetched in ${data.duration}ms`);
        }
      } catch (err) {
        console.warn('[Chat] Failed to pre-fetch context:', err.message);
        // Non-critical - chat will still work via tool calls
      } finally {
        setIsLoadingContext(false);
      }
    };

    fetchContext();
  }, [isOpen, projectId, user?.email, role, profile?.role, linkedResource?.id, linkedResource?.partner_id]);

  // Build project context for the AI
  const getProjectContext = useCallback(() => {
    if (!currentProject) return null;
    return {
      id: projectId,
      reference: projectRef || currentProject?.reference,
      name: projectName || currentProject?.name,
      description: currentProject?.description || null,
    };
  }, [currentProject, projectId, projectRef, projectName]);

  // Build user context for the AI (includes partner info for scoping)
  const getUserContext = useCallback(() => {
    return {
      name: profile?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email,
      role: role || profile?.role || 'unknown',
      linkedResourceName: linkedResource?.name || null,
      linkedResourceId: linkedResource?.id || null,
      partnerId: linkedResource?.partner_id || null,
      partnerName: linkedResource?.partners?.name || null,
    };
  }, [user, profile, linkedResource, role]);

  // Helper to make API request with retry logic
  const makeRequest = async (body, attempt = 1) => {
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      // Parse response
      const data = await response.json().catch(() => ({}));

      // Handle rate limiting and transient errors with retry
      if (!response.ok) {
        const shouldRetry = RETRY_CONFIG.retryableCodes.includes(response.status) && 
                           attempt <= RETRY_CONFIG.maxRetries &&
                           data.recoverable !== false;
        
        if (shouldRetry) {
          const delay = data.retryAfter 
            ? data.retryAfter * 1000 
            : RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1);
          
          setRetryCount(attempt);
          console.log(`[Chat] Retrying in ${delay}ms (attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(body, attempt + 1);
        }
        
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setRetryCount(0);
      return data;
      
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw err;
    }
  };

  // Send a message to the AI
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Add user message to chat
    const userMessage = { 
      role: 'user', 
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      // Get contexts
      const projectContext = getProjectContext();
      const userContext = getUserContext();

      // Prepare messages for API (last 10 messages for context)
      const recentMessages = [...messages.slice(-9), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Make request with retry logic
      const data = await makeRequest({
        messages: recentMessages,
        projectContext,
        userContext,
        projectId,
        prefetchedContext, // Include pre-fetched data for instant responses
      });

      // Track token usage
      if (data.usage) {
        setTokenUsage(prev => ({
          input: prev.input + (data.usage.input_tokens || 0),
          output: prev.output + (data.usage.output_tokens || 0),
          requests: prev.requests + 1,
        }));
      }

      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        toolsUsed: data.toolsUsed || false,
        cached: data.cached || false,
        timestamp: new Date().toISOString(),
        tokens: data.usage ? {
          input: data.usage.input_tokens,
          output: data.usage.output_tokens,
        } : null,
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      
      // User-friendly error messages
      let errorMessage = err.message;
      if (err.message === 'Request cancelled') {
        errorMessage = null; // Don't show error for cancelled requests
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect. Please check your internet connection.';
      }
      
      if (errorMessage) {
        setError(errorMessage);
        // Remove the user message if we failed
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      setRetryCount(0);
    }
  }, [messages, isLoading, getProjectContext, getUserContext, projectId, prefetchedContext]);

  // Cancel pending request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setRetryCount(0);
    }
  }, []);

  // Clear chat history
  const clearChat = useCallback(() => {
    cancelRequest();
    setMessages([]);
    setError(null);
    // Keep token usage stats (don't reset)
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }, [cancelRequest]);

  // Reset all stats including token usage
  const resetAllStats = useCallback(() => {
    clearChat();
    setTokenUsage({ input: 0, output: 0, requests: 0 });
  }, [clearChat]);

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Dismiss error
  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  // Export chat as markdown
  const exportChat = useCallback(() => {
    if (messages.length === 0) return null;

    const userContext = getUserContext();
    const projectContext = getProjectContext();
    
    let markdown = `# Chat Export\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString('en-GB')}\n`;
    markdown += `**User:** ${userContext.name} (${userContext.role})\n`;
    if (projectContext) {
      markdown += `**Project:** ${projectContext.name} (${projectContext.reference})\n`;
    }
    markdown += `**Messages:** ${messages.length}\n`;
    markdown += `**Token Usage:** ${tokenUsage.input.toLocaleString()} input / ${tokenUsage.output.toLocaleString()} output\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-GB') : '';
      
      markdown += `### ${role}${time ? ` (${time})` : ''}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      if (msg.toolsUsed) {
        markdown += `*📊 Queried project data*\n\n`;
      }
      
      if (index < messages.length - 1) {
        markdown += `---\n\n`;
      }
    });

    return markdown;
  }, [messages, tokenUsage, getUserContext, getProjectContext]);

  // Download chat as file
  const downloadChat = useCallback(() => {
    const markdown = exportChat();
    if (!markdown) return;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportChat]);

  // Copy message to clipboard
  const copyMessage = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    toggleChat,
    messages,
    isLoading,
    isLoadingContext,
    error,
    retryCount,
    tokenUsage,
    sendMessage,
    clearChat,
    resetAllStats,
    cancelRequest,
    dismissError,
    exportChat,
    downloadChat,
    copyMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
