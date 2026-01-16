/**
 * ContextMenu - Right-click context menu component
 *
 * Provides a reusable context menu for tables and other UI elements.
 * Features:
 * - Positioned relative to click location
 * - Closes on click outside or Escape key
 * - Supports keyboard navigation
 * - Customizable menu items with icons
 *
 * @version 1.0 - WP-10: MS Planner UI enhancements
 * @created 16 January 2026
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './ContextMenu.css';

/**
 * ContextMenu component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the menu is visible
 * @param {number} props.x - X position (from mouse event clientX)
 * @param {number} props.y - Y position (from mouse event clientY)
 * @param {Array} props.items - Menu items: [{ label, icon: Component, onClick, disabled, danger, divider }]
 * @param {Function} props.onClose - Callback when menu should close
 * @param {any} props.contextData - Data passed to item onClick handlers
 */
export default function ContextMenu({
  isOpen,
  x,
  y,
  items = [],
  onClose,
  contextData
}) {
  const menuRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    // Small delay to prevent immediate close from the triggering click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu within viewport
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return { left: x, top: y };

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu would overflow right edge
    if (x + rect.width > viewportWidth - 10) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position if menu would overflow bottom edge
    if (y + rect.height > viewportHeight - 10) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    return { left: Math.max(10, adjustedX), top: Math.max(10, adjustedY) };
  }, [x, y]);

  const handleItemClick = (item) => {
    if (item.disabled) return;
    item.onClick?.(contextData);
    onClose?.();
  };

  const handleKeyDown = (e, item, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(item);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1;
      const buttons = menuRef.current?.querySelectorAll('button:not([disabled])');
      if (buttons && buttons[nextIndex]) {
        buttons[nextIndex].focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1;
      const buttons = menuRef.current?.querySelectorAll('button:not([disabled])');
      if (buttons && buttons[prevIndex]) {
        buttons[prevIndex].focus();
      }
    }
  };

  if (!isOpen) return null;

  const position = getAdjustedPosition();

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.left, top: position.top }}
      role="menu"
      aria-label="Context menu"
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="context-menu-divider" role="separator" />;
        }

        const Icon = item.icon;

        return (
          <button
            key={item.label || index}
            type="button"
            className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => handleItemClick(item)}
            onKeyDown={(e) => handleKeyDown(e, item, index)}
            disabled={item.disabled}
            role="menuitem"
          >
            {Icon && <Icon size={16} className="context-menu-icon" />}
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

/**
 * Hook for managing context menu state
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = React.useState({
    isOpen: false,
    x: 0,
    y: 0,
    data: null
  });

  const openContextMenu = useCallback((e, data) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      data
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu
  };
}
