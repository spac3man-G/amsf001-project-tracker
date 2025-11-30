// src/contexts/ChatContext.jsx
// Provides AI chat state and functionality to the application

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { supabase } from '../lib/supabase';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user, profile, linkedResource, role } = useAuth();
  const { projectId, projectName, projectRef, currentProject } = useProject();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build project context for the AI (multi-tenant support)
  const getProjectContext = useCallback(() => {
    if (!currentProject) return null;
    return {
      reference: projectRef || currentProject?.reference,
      name: projectName || currentProject?.name,
      description: currentProject?.description || null,
    };
  }, [currentProject, projectRef, projectName]);

  // Build user context for the AI
  const getUserContext = useCallback(() => {
    return {
      name: profile?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email,
      role: role || profile?.role || 'unknown',
      linkedResourceName: linkedResource?.name || null,
      linkedResourceId: linkedResource?.id || null,
    };
  }, [user, profile, linkedResource, role]);

  // Fetch relevant data context based on user's permissions and recent activity
  const getDataContext = useCallback(async () => {
    if (!projectId) return null;

    const contextParts = [];

    try {
      // Get project summary
      const { data: project } = await supabase
        .from('projects')
        .select('name, code, total_budget, start_date, end_date')
        .eq('id', projectId)
        .single();

      if (project) {
        contextParts.push(`Project: ${project.name} (${project.code})
Budget: £${project.total_budget?.toLocaleString() || 0}
Timeline: ${project.start_date} to ${project.end_date}`);
      }

      // Get milestone summary
      const { data: milestones } = await supabase
        .from('milestones')
        .select('id, name, status, progress_percent, planned_end_date')
        .eq('project_id', projectId)
        .order('planned_end_date', { ascending: true });

      if (milestones?.length > 0) {
        const completed = milestones.filter(m => m.status === 'Completed').length;
        const inProgress = milestones.filter(m => m.status === 'In Progress').length;
        const avgProgress = Math.round(milestones.reduce((sum, m) => sum + (m.progress_percent || 0), 0) / milestones.length);
        
        contextParts.push(`Milestones: ${milestones.length} total (${completed} completed, ${inProgress} in progress)
Average Progress: ${avgProgress}%`);

        // List upcoming/overdue milestones
        const today = new Date().toISOString().split('T')[0];
        const overdue = milestones.filter(m => m.planned_end_date < today && m.status !== 'Completed');
        if (overdue.length > 0) {
          contextParts.push(`Overdue Milestones: ${overdue.map(m => m.name).join(', ')}`);
        }
      }

      // Get deliverable summary
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select('id, status')
        .eq('project_id', projectId);

      if (deliverables?.length > 0) {
        const byStatus = {};
        deliverables.forEach(d => {
          byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        });
        contextParts.push(`Deliverables: ${deliverables.length} total
Status breakdown: ${Object.entries(byStatus).map(([s, c]) => `${s}: ${c}`).join(', ')}`);
      }

      // Get timesheet summary (role-dependent)
      if (role === 'admin' || role === 'supplier_pm') {
        const { data: timesheets } = await supabase
          .from('timesheets')
          .select('hours_worked, status')
          .eq('project_id', projectId);

        if (timesheets?.length > 0) {
          const totalHours = timesheets.reduce((sum, t) => sum + (t.hours_worked || 0), 0);
          const pending = timesheets.filter(t => t.status === 'Submitted').length;
          contextParts.push(`Timesheets: ${totalHours.toFixed(1)} total hours logged
Pending approval: ${pending} entries`);
        }
      } else if (linkedResource?.id) {
        // Contributors see only their own
        const { data: myTimesheets } = await supabase
          .from('timesheets')
          .select('hours_worked, status')
          .eq('resource_id', linkedResource.id);

        if (myTimesheets?.length > 0) {
          const myHours = myTimesheets.reduce((sum, t) => sum + (t.hours_worked || 0), 0);
          contextParts.push(`Your Timesheets: ${myHours.toFixed(1)} hours logged`);
        }
      }

      // Get expense summary (role-dependent)
      if (role === 'admin' || role === 'supplier_pm') {
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, status, is_chargeable')
          .eq('project_id', projectId);

        if (expenses?.length > 0) {
          const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const pending = expenses.filter(e => e.status === 'Submitted').length;
          contextParts.push(`Expenses: £${total.toLocaleString()} total claimed
Pending validation: ${pending} entries`);
        }
      }

      // Get resource summary (if visible)
      if (role === 'admin' || role === 'supplier_pm' || role === 'customer_pm') {
        const { data: resources } = await supabase
          .from('resources')
          .select('id, name, days_allocated, days_used')
          .eq('project_id', projectId);

        if (resources?.length > 0) {
          const totalAllocated = resources.reduce((sum, r) => sum + (r.days_allocated || 0), 0);
          contextParts.push(`Resources: ${resources.length} team members
Total days allocated: ${totalAllocated}`);
        }
      }

      return contextParts.join('\n\n');

    } catch (err) {
      console.error('Error fetching data context:', err);
      return null;
    }
  }, [projectId, role, linkedResource]);

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
      const dataContext = await getDataContext();

      // Prepare messages for API (last 10 messages for context)
      const recentMessages = [...messages.slice(-9), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          projectContext,
          userContext,
          dataContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
      // Remove the user message if we failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, getProjectContext, getUserContext, getDataContext]);

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
