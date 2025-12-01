// src/contexts/ChatContext.jsx
// Provides AI chat state and functionality to the application
// Version 3.0 - Simplified for tool-enabled backend

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user, profile, linkedResource, role } = useAuth();
  const { projectId, projectName, projectRef, currentProject } = useProject();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Send a message to the AI
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get contexts
      const projectContext = getProjectContext();
      const userContext = getUserContext();

      // Prepare messages for API (last 10 messages for context)
      const recentMessages = [...messages.slice(-9), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call the API - backend now handles all data fetching via tools
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          projectContext,
          userContext,
          projectId, // Pass projectId directly for tool queries
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        toolsUsed: data.toolsUsed || false,
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      // Remove the user message if we failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, getProjectContext, getUserContext, projectId]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    toggleChat,
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
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
