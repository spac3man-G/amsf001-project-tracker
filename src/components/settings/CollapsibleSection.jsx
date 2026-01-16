/**
 * CollapsibleSection - Expandable section with chevron toggle
 *
 * Microsoft Planner-style collapsible section for grouping related settings.
 * Animates smoothly on expand/collapse.
 *
 * @version 1.0
 * @created 17 January 2026
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './CollapsibleSection.css';

export default function CollapsibleSection({
  title,
  description,
  icon: Icon,
  children,
  defaultExpanded = true,
  badge,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`collapsible-section ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      <button
        type="button"
        className="collapsible-section__header"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <div className="collapsible-section__header-left">
          <span className="collapsible-section__chevron">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
          {Icon && (
            <span className="collapsible-section__icon">
              <Icon size={18} />
            </span>
          )}
          <div className="collapsible-section__title-group">
            <span className="collapsible-section__title">{title}</span>
            {description && (
              <span className="collapsible-section__description">{description}</span>
            )}
          </div>
        </div>
        {badge && (
          <span className="collapsible-section__badge">{badge}</span>
        )}
      </button>
      <div className={`collapsible-section__content ${isExpanded ? 'visible' : ''}`}>
        <div className="collapsible-section__inner">
          {children}
        </div>
      </div>
    </div>
  );
}
