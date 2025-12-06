/**
 * Help Context
 * 
 * Provides global state management for the help drawer.
 * Allows any component to open/close help and set the current topic.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HelpContext = createContext(null);

/**
 * Map route paths to help content keys
 */
const routeToHelpKey = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/milestones': 'milestones',
  '/deliverables': 'deliverables',
  '/resources': 'resources',
  '/timesheets': 'timesheets',
  '/expenses': 'expenses',
  '/partners': 'partners',
  '/kpis': 'kpis',
  '/quality-standards': 'qualityStandards',
  '/raid-log': 'raidLog',
  '/users': 'users',
  '/settings': 'general',
  '/account': 'general'
};

/**
 * Get help key from a route path
 */
function getHelpKeyFromPath(pathname) {
  // Exact match first
  if (routeToHelpKey[pathname]) {
    return routeToHelpKey[pathname];
  }
  
  // Check for detail pages
  if (pathname.startsWith('/milestones/')) {
    return 'milestoneDetail';
  }
  if (pathname.startsWith('/deliverables/')) {
    return 'deliverableDetail';
  }
  if (pathname.startsWith('/resources/')) {
    return 'resources';
  }
  if (pathname.startsWith('/partners/')) {
    return 'partners';
  }
  if (pathname.startsWith('/kpis/')) {
    return 'kpis';
  }
  if (pathname.startsWith('/quality-standards/')) {
    return 'qualityStandards';
  }
  
  return 'general';
}

export function HelpProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('general');
  const location = useLocation();

  // Update topic when route changes
  useEffect(() => {
    const helpKey = getHelpKeyFromPath(location.pathname);
    setCurrentTopic(helpKey);
  }, [location.pathname]);

  // Keyboard shortcut: ? to toggle help
  useEffect(() => {
    function handleKeyDown(event) {
      // Ignore if typing in an input
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' ||
          event.target.isContentEditable) {
        return;
      }
      
      // ? key (shift + /) or F1
      if ((event.key === '?' || event.key === 'F1')) {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openHelp = useCallback((topic = null) => {
    if (topic) {
      setCurrentTopic(topic);
    }
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const navigateToTopic = useCallback((topic) => {
    setCurrentTopic(topic);
  }, []);

  const value = {
    isOpen,
    currentTopic,
    openHelp,
    closeHelp,
    toggleHelp,
    navigateToTopic
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}

export default HelpContext;
