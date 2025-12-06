/**
 * Help Drawer Component
 * 
 * A slide-out panel that displays contextual help content for the current page.
 * Opens from the right side of the screen.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React from 'react';
import { X, HelpCircle, Lightbulb, ArrowRight, ExternalLink } from 'lucide-react';
import { useHelp } from '../../contexts/HelpContext';
import { getHelpContent, helpContent } from '../../help/helpContent';
import './HelpDrawer.css';

export function HelpDrawer() {
  const { isOpen, currentTopic, closeHelp, navigateToTopic } = useHelp();
  const content = getHelpContent(currentTopic);
  
  if (!isOpen) return null;

  const Icon = content.icon || HelpCircle;

  return (
    <>
      {/* Backdrop */}
      <div className="help-drawer-backdrop" onClick={closeHelp} />
      
      {/* Drawer */}
      <div className="help-drawer">
        {/* Header */}
        <div className="help-drawer-header">
          <div className="help-drawer-title">
            <Icon size={20} />
            <span>{content.title}</span>
          </div>
          <button className="help-drawer-close" onClick={closeHelp}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="help-drawer-content">
          {/* Description */}
          <p className="help-description">{content.description}</p>

          {/* Sections */}
          {content.sections?.map((section, index) => (
            <div key={index} className="help-section">
              <h3 className="help-section-heading">{section.heading}</h3>
              
              {section.type === 'list' ? (
                <ul className="help-list">
                  {section.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="help-text">{section.content}</p>
              )}
            </div>
          ))}

          {/* Tips */}
          {content.tips?.length > 0 && (
            <div className="help-tips">
              <div className="help-tips-header">
                <Lightbulb size={16} />
                <span>Tips</span>
              </div>
              <ul className="help-tips-list">
                {content.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Topics */}
          {content.relatedTopics?.length > 0 && (
            <div className="help-related">
              <h4 className="help-related-heading">Related Topics</h4>
              <div className="help-related-links">
                {content.relatedTopics.map((topicKey) => {
                  const topic = helpContent[topicKey];
                  if (!topic) return null;
                  const TopicIcon = topic.icon || HelpCircle;
                  return (
                    <button
                      key={topicKey}
                      className="help-related-link"
                      onClick={() => navigateToTopic(topicKey)}
                    >
                      <TopicIcon size={14} />
                      <span>{topic.title}</span>
                      <ArrowRight size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="help-drawer-footer">
          <a 
            href="/AMSF001-User-Guide.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="help-full-guide-link"
          >
            <ExternalLink size={14} />
            View Full User Guide
          </a>
          <span className="help-shortcut">Press <kbd>?</kbd> to toggle help</span>
        </div>
      </div>
    </>
  );
}

/**
 * Help Button Component
 * 
 * A floating button that opens the help drawer.
 */
export function HelpButton() {
  const { toggleHelp, isOpen } = useHelp();

  return (
    <button 
      className={`help-button ${isOpen ? 'active' : ''}`}
      onClick={toggleHelp}
      title="Help (Press ?)"
      aria-label="Open help"
    >
      <HelpCircle size={20} />
    </button>
  );
}

export default HelpDrawer;
