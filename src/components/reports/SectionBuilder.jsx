/**
 * Section Builder
 * 
 * Step 3 of the Report Builder Wizard.
 * Two-column layout allowing users to add sections from the library
 * and manage/reorder sections in their report.
 * 
 * Features:
 * - Section library grouped by category (left panel)
 * - Current sections list with drag-and-drop (right panel)
 * - Click to add sections from library
 * - Remove and reorder sections
 * - Click section to configure (opens SectionConfigModal)
 * - Section count and validation feedback
 * - AI suggestion prompt
 * 
 * @version 1.2
 * @created 11 December 2025
 * @updated 11 December 2025 - AI Assistant integration (Segment 10)
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 8, 9, 10
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  FileStack,
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useReportBuilder } from '../../contexts/ReportBuilderContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSectionTypesByCategoryForRole,
  SECTION_CATEGORY_CONFIG
} from '../../lib/reportSectionTypes';
import SectionLibrary from './SectionLibrary';
import SectionList from './SectionList';
import SectionConfigModal from './SectionConfigModal';

// ============================================
// HEADER COMPONENT
// ============================================

function SectionBuilderHeader({ sectionCount, reportName }) {
  const hasMinSections = sectionCount > 0;
  
  return (
    <div className="section-builder-header">
      <div className="section-builder-header-main">
        <h3>Build Your Report</h3>
        <p>Add and arrange sections for "{reportName}"</p>
      </div>
      
      <div className={`section-builder-status ${hasMinSections ? 'valid' : 'warning'}`}>
        {hasMinSections ? (
          <>
            <CheckCircle2 size={16} />
            <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''} added</span>
          </>
        ) : (
          <>
            <AlertCircle size={16} />
            <span>Add at least one section</span>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// AI SUGGESTION BAR
// ============================================

function AISuggestionBar({ onOpenAI }) {
  return (
    <div className="section-builder-ai-bar" onClick={onOpenAI}>
      <Sparkles size={18} />
      <div className="section-builder-ai-content">
        <span className="section-builder-ai-title">Need help choosing sections?</span>
        <span className="section-builder-ai-subtitle">
          Ask the AI assistant to suggest sections based on your needs
        </span>
      </div>
      <button type="button" className="section-builder-ai-btn">
        Get Suggestions
      </button>
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

function EmptyState({ onOpenLibrary }) {
  return (
    <div className="section-builder-empty">
      <div className="section-builder-empty-icon">
        <FileStack size={40} strokeWidth={1.5} />
      </div>
      <h4>No sections yet</h4>
      <p>Start building your report by adding sections from the library.</p>
      <div className="section-builder-empty-actions">
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={onOpenLibrary}
        >
          Browse Section Library
        </button>
      </div>
    </div>
  );
}

// ============================================
// INSTRUCTIONS PANEL
// ============================================

function InstructionsPanel() {
  return (
    <div className="section-builder-instructions">
      <Info size={14} />
      <div>
        <strong>How to build your report:</strong>
        <ul>
          <li>Click sections in the library to add them</li>
          <li>Drag sections to reorder them</li>
          <li>Click the gear icon to configure a section</li>
          <li>Click the X to remove a section</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SectionBuilder() {
  const {
    sections,
    reportName,
    addSection,
    removeSection,
    reorderSections,
    updateSectionConfig,
    duplicateSection,
    setAIPanelOpen
  } = useReportBuilder();
  
  const { role, profile } = useAuth();
  const userRole = role || profile?.role || 'viewer';
  
  // State for section configuration modal
  const [configuringSection, setConfiguringSection] = useState(null);
  const [highlightedSection, setHighlightedSection] = useState(null);
  
  // Get available section types for user's role
  const sectionTypesByCategory = useMemo(() => {
    return getSectionTypesByCategoryForRole(userRole);
  }, [userRole]);
  
  // Get ordered categories
  const orderedCategories = useMemo(() => {
    return Object.entries(SECTION_CATEGORY_CONFIG)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key]) => key);
  }, []);
  
  // Handle adding a section from the library
  const handleAddSection = useCallback((sectionType) => {
    const newSection = addSection(sectionType);
    if (newSection) {
      // Briefly highlight the newly added section
      setHighlightedSection(newSection.id);
      setTimeout(() => setHighlightedSection(null), 1500);
    }
  }, [addSection]);
  
  // Handle removing a section
  const handleRemoveSection = useCallback((sectionId) => {
    removeSection(sectionId);
  }, [removeSection]);
  
  // Handle reordering via drag and drop
  const handleReorder = useCallback((fromIndex, toIndex) => {
    reorderSections(fromIndex, toIndex);
  }, [reorderSections]);
  
  // Handle clicking a section to configure
  const handleConfigureSection = useCallback((section) => {
    setConfiguringSection(section);
  }, []);
  
  // Handle saving section configuration
  const handleSaveConfig = useCallback((sectionId, newConfig) => {
    updateSectionConfig(sectionId, newConfig);
  }, [updateSectionConfig]);
  
  // Handle closing config modal
  const handleCloseConfig = useCallback(() => {
    setConfiguringSection(null);
  }, []);
  
  // Handle AI assist for text fields in config modal
  const handleAIAssist = useCallback((fieldId, currentValue, section) => {
    // Open AI panel and send a context-aware message
    setAIPanelOpen(true);
    
    // The AI will receive context about the current section through the ReportBuilderContext
    // Additional context can be passed via the AI messages
    console.log('AI Assist requested:', { fieldId, currentValue, sectionType: section?.type });
  }, [setAIPanelOpen]);
  
  // Handle duplicating a section
  const handleDuplicateSection = useCallback((sectionId) => {
    const newSection = duplicateSection(sectionId);
    if (newSection) {
      setHighlightedSection(newSection.id);
      setTimeout(() => setHighlightedSection(null), 1500);
    }
  }, [duplicateSection]);
  
  // Handle opening AI panel
  const handleOpenAI = useCallback(() => {
    setAIPanelOpen(true);
  }, [setAIPanelOpen]);
  
  // Check if a section type is already added
  const isSectionTypeAdded = useCallback((sectionType) => {
    return sections.some(s => s.type === sectionType);
  }, [sections]);
  
  return (
    <div className="section-builder">
      {/* Header */}
      <SectionBuilderHeader 
        sectionCount={sections.length}
        reportName={reportName}
      />
      
      {/* AI Suggestion Bar */}
      <AISuggestionBar onOpenAI={handleOpenAI} />
      
      {/* Main Content - Two Column Layout */}
      <div className="section-builder-layout">
        {/* Left Panel - Section Library */}
        <div className="section-builder-library-panel">
          <div className="section-builder-panel-header">
            <FileStack size={18} />
            <h4>Section Library</h4>
          </div>
          <SectionLibrary
            sectionTypesByCategory={sectionTypesByCategory}
            orderedCategories={orderedCategories}
            onAddSection={handleAddSection}
            isSectionTypeAdded={isSectionTypeAdded}
          />
        </div>
        
        {/* Right Panel - Current Sections */}
        <div className="section-builder-list-panel">
          <div className="section-builder-panel-header">
            <Settings size={18} />
            <h4>Report Sections ({sections.length})</h4>
          </div>
          
          {sections.length === 0 ? (
            <EmptyState onOpenLibrary={() => {}} />
          ) : (
            <>
              <InstructionsPanel />
              <SectionList
                sections={sections}
                onRemove={handleRemoveSection}
                onReorder={handleReorder}
                onConfigure={handleConfigureSection}
                onDuplicate={handleDuplicateSection}
                highlightedSection={highlightedSection}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Section Config Modal */}
      {configuringSection && (
        <SectionConfigModal
          section={configuringSection}
          onSave={handleSaveConfig}
          onClose={handleCloseConfig}
          onAIAssist={handleAIAssist}
        />
      )}
    </div>
  );
}
