/**
 * Section Library
 * 
 * Left panel component for the Section Builder.
 * Displays available section types grouped by category.
 * 
 * Features:
 * - Sections grouped by category (Backward, Forward, Content)
 * - Collapsible category groups
 * - Visual indicator when section is already added
 * - Click to add section
 * - Search/filter sections
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 8
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  Search,
  X,
  Lock
} from 'lucide-react';
import { 
  SECTION_CATEGORY_CONFIG,
  getSectionTypeConfig 
} from '../../lib/reportSectionTypes';

// ============================================
// SECTION TYPE ITEM COMPONENT
// ============================================

function SectionTypeItem({ 
  sectionType, 
  isAdded, 
  onAdd,
  isRestricted 
}) {
  const Icon = sectionType.icon;
  
  const handleClick = useCallback(() => {
    if (!isRestricted) {
      onAdd(sectionType.type);
    }
  }, [onAdd, sectionType.type, isRestricted]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);
  
  return (
    <div 
      className={`section-library-item ${isAdded ? 'added' : ''} ${isRestricted ? 'restricted' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isRestricted ? -1 : 0}
      title={isRestricted ? 'Not available for your role' : (isAdded ? 'Already added - click to add another' : `Add ${sectionType.name}`)}
    >
      <div className="section-library-item-icon">
        {Icon && <Icon size={18} />}
      </div>
      
      <div className="section-library-item-content">
        <span className="section-library-item-name">{sectionType.name}</span>
        <span className="section-library-item-description">
          {sectionType.description}
        </span>
      </div>
      
      <div className="section-library-item-action">
        {isRestricted ? (
          <Lock size={14} />
        ) : isAdded ? (
          <div className="section-library-item-badge added">
            <Check size={12} />
          </div>
        ) : (
          <Plus size={16} />
        )}
      </div>
    </div>
  );
}

// ============================================
// CATEGORY GROUP COMPONENT
// ============================================

function CategoryGroup({ 
  category, 
  sections, 
  isExpanded, 
  onToggle, 
  onAddSection,
  isSectionTypeAdded
}) {
  const categoryConfig = SECTION_CATEGORY_CONFIG[category];
  const CategoryIcon = categoryConfig?.icon;
  
  const addedCount = useMemo(() => {
    return sections.filter(s => isSectionTypeAdded(s.type)).length;
  }, [sections, isSectionTypeAdded]);
  
  return (
    <div className={`section-library-category ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        type="button"
        className="section-library-category-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="section-library-category-toggle">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        
        {CategoryIcon && (
          <span className="section-library-category-icon">
            <CategoryIcon size={16} />
          </span>
        )}
        
        <span className="section-library-category-name">
          {categoryConfig?.label || category}
        </span>
        
        <span className="section-library-category-count">
          {sections.length} type{sections.length !== 1 ? 's' : ''}
          {addedCount > 0 && (
            <span className="section-library-category-added">
              ({addedCount} added)
            </span>
          )}
        </span>
      </button>
      
      {isExpanded && (
        <div className="section-library-category-content">
          <p className="section-library-category-description">
            {categoryConfig?.description}
          </p>
          <div className="section-library-category-items">
            {sections.map(sectionType => (
              <SectionTypeItem
                key={sectionType.type}
                sectionType={sectionType}
                isAdded={isSectionTypeAdded(sectionType.type)}
                isRestricted={false}
                onAdd={onAddSection}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SEARCH BAR COMPONENT
// ============================================

function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="section-library-search">
      <Search size={16} className="section-library-search-icon" />
      <input
        type="text"
        className="section-library-search-input"
        placeholder="Search sections..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button 
          type="button"
          className="section-library-search-clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SectionLibrary({
  sectionTypesByCategory,
  orderedCategories,
  onAddSection,
  isSectionTypeAdded
}) {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState(() => {
    // Start with all categories expanded
    return orderedCategories.reduce((acc, cat) => {
      acc[cat] = true;
      return acc;
    }, {});
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toggle category expansion
  const handleToggleCategory = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);
  
  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  // Filter sections by search query
  const filteredSectionsByCategory = useMemo(() => {
    if (!searchQuery.trim()) {
      return sectionTypesByCategory;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = {};
    
    Object.entries(sectionTypesByCategory).forEach(([category, sections]) => {
      const matchingSections = sections.filter(section => 
        section.name.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query)
      );
      if (matchingSections.length > 0) {
        filtered[category] = matchingSections;
      }
    });
    
    return filtered;
  }, [sectionTypesByCategory, searchQuery]);
  
  // Count total available sections
  const totalSections = useMemo(() => {
    return Object.values(sectionTypesByCategory).reduce(
      (total, sections) => total + sections.length, 
      0
    );
  }, [sectionTypesByCategory]);
  
  // Count filtered sections
  const filteredCount = useMemo(() => {
    return Object.values(filteredSectionsByCategory).reduce(
      (total, sections) => total + sections.length, 
      0
    );
  }, [filteredSectionsByCategory]);
  
  return (
    <div className="section-library">
      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={handleClearSearch}
      />
      
      {/* Section Count */}
      <div className="section-library-summary">
        {searchQuery ? (
          <span>{filteredCount} of {totalSections} sections match</span>
        ) : (
          <span>{totalSections} section types available</span>
        )}
      </div>
      
      {/* Category Groups */}
      <div className="section-library-categories">
        {orderedCategories.map(category => {
          const sections = filteredSectionsByCategory[category];
          
          // Skip empty categories (when filtering)
          if (!sections || sections.length === 0) {
            return null;
          }
          
          return (
            <CategoryGroup
              key={category}
              category={category}
              sections={sections}
              isExpanded={expandedCategories[category]}
              onToggle={() => handleToggleCategory(category)}
              onAddSection={onAddSection}
              isSectionTypeAdded={isSectionTypeAdded}
            />
          );
        })}
        
        {/* No results message */}
        {searchQuery && filteredCount === 0 && (
          <div className="section-library-no-results">
            <p>No sections match "{searchQuery}"</p>
            <button 
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleClearSearch}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
