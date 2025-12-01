// src/contexts/ChatContext.jsx
// Provides AI chat state and functionality to the application
// Version 3.1 - Enhanced error handling and retry logic

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

const ChatContext = createContext(null);

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 1000,
  retryableCodes: [429, 503, 504],
};

export function ChatProvider({ children }) {
  const { user, profile, linkedResource, role } = useAuth();
  const { projectId, projectName, projectRef, currentProject } = useProject();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

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
    const userMessage = { role: 'user', content: content.trim() };
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
      });

      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        toolsUsed: data.toolsUsed || false,
        cached: data.cached || false,
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
  }, [messages, isLoading, getProjectContext, getUserContext, projectId]);

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
  }, [cancelRequest]);

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Dismiss error
  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    toggleChat,
    messages,
    isLoading,
    error,
    retryCount,
    sendMessage,
    clearChat,
    cancelRequest,
    dismissError,
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
