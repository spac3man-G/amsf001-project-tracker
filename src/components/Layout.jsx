// src/components/Layout.jsx
// Version 13.0 - Uses getNavigationForUser for org admin support
// - User name/role only shown in header (top right)
// - Clicking user info in header navigates to My Account
// - Drag and drop navigation reordering for non-viewers
// - Reset to default order button when custom order is active
// - View As bar for admin/supplier_pm to preview other roles
// - Project Switcher for users with multiple project assignments
// - Organisation Switcher for users with multiple organisation memberships
//
// Test IDs (see docs/TESTING-CONVENTIONS.md):
//   - nav-{itemId} for each navigation link (e.g., nav-dashboard, nav-timesheets)
//   - logout-button
//   - user-menu-button

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LogOut,
  Menu,
  X,
  GripVertical,
  RotateCcw
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ViewAsBar, { ViewAsInline } from './ViewAsBar';
import ProjectSwitcher from './ProjectSwitcher';
import OrganisationSwitcher from './OrganisationSwitcher';
import { useToast } from '../contexts/ToastContext';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useProject } from '../contexts/ProjectContext';

// Import from centralized navigation config
import { 
  getNavigationForUser,
  applyCustomNavOrder, 
  canReorderNavigation,
  getRoleDisplay,
  isReadOnlyForRole,
  getNavItemIdByPath,
  isDefaultOrder
} from '../lib/navigation';

// Import AuthContext for user data
import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { usePermissions } from '../hooks/usePermissions';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  // Use AuthContext for user data - single source of truth
  const { user, profile, role: actualRole, signOut } = useAuth();
  
  // Use ViewAsContext for effective role (supports impersonation)
  const { effectiveRole, isImpersonating, effectiveRoleConfig } = useViewAs();
  
  // Use usePermissions to get org-level admin flags
  const { isSystemAdmin, isOrgAdmin } = usePermissions();
  
  // Get organisation and project context for header display
  const { currentOrganisation } = useOrganisation();
  const { projectRef } = useProject();
  
  // Get organisation brand color (default to green if not set)
  const brandColor = currentOrganisation?.primary_color || '#10b981';
  
  // Local state for UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customNavOrder, setCustomNavOrder] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const dragNode = useRef(null);

  // Get role display configuration - use effective role for display
  const roleDisplay = useMemo(() => getRoleDisplay(effectiveRole), [effectiveRole]);

  // Derive display name and initials from profile
  const displayName = useMemo(() => {
    if (!profile) return 'User';
    return profile.full_name || profile.email || user?.email || 'User';
  }, [profile, user]);

  const initials = useMemo(() => {
    if (!profile) return 'U';
    if (profile.full_name) {
      const parts = profile.full_name.split(' ');
      if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0];
      }
      return profile.full_name[0].toUpperCase();
    }
    return displayName[0].toUpperCase();
  }, [profile, displayName]);

  // Load custom nav_order from profile when it becomes available
  useEffect(() => {
    if (profile?.nav_order && Array.isArray(profile.nav_order)) {
      setCustomNavOrder(profile.nav_order);
    }
  }, [profile]);

  // Handle logout using AuthContext
  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  // Check if this role can reorder navigation
  const canReorder = useMemo(() => canReorderNavigation(effectiveRole), [effectiveRole]);

  // Check if current order is customized (not default)
  const hasCustomOrder = useMemo(() => {
    return customNavOrder && !isDefaultOrder(effectiveRole, customNavOrder);
  }, [effectiveRole, customNavOrder]);

  // Get navigation items for current role, with custom ordering if saved
  // getNavigationForUser handles:
  // - System Admin: full admin nav + system-level items
  // - Org Admin: full admin nav (effectiveRole is 'admin') but NO system-level items
  // - Regular users: nav based on their project role
  const navItems = useMemo(() => {
    // Get base navigation using the new function that respects org hierarchy
    let roleNav = getNavigationForUser({ 
      isSystemAdmin, 
      isOrgAdmin, 
      effectiveRole 
    });
    
    // Apply custom ordering if user has saved a custom order
    if (customNavOrder && customNavOrder.length > 0) {
      roleNav = applyCustomNavOrder(effectiveRole, customNavOrder);
      
      // Re-apply system-level item filtering after custom order
      // (in case custom order includes items user shouldn't see)
      if (!isSystemAdmin) {
        roleNav = roleNav.filter(item => 
          item.id !== 'systemUsers' && item.id !== 'systemAdmin'
        );
      }
    }
    
    return roleNav;
  }, [effectiveRole, customNavOrder, isSystemAdmin, isOrgAdmin]);

  // Check if current page is read-only for this role
  const isCurrentPageReadOnly = useMemo(() => {
    const itemId = getNavItemIdByPath(location.pathname);
    return itemId ? isReadOnlyForRole(effectiveRole, itemId) : false;
  }, [effectiveRole, location.pathname]);

  // Drag and drop handlers (only for non-viewers)
  function handleDragStart(e, index) {
    if (!canReorder) return;
    
    dragNode.current = e.target;
    setDraggedItem(index);
    
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.5';
      }
    }, 0);
  }

  function handleDragEnter(e, index) {
    if (!canReorder) return;
    if (index !== draggedItem) {
      setDragOverItem(index);
    }
  }

  function handleDragOver(e) {
    if (!canReorder) return;
    e.preventDefault();
  }

  function handleDragEnd() {
    if (!canReorder) return;
    
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newNavItems = [...navItems];
      const draggedItemContent = newNavItems[draggedItem];
      
      newNavItems.splice(draggedItem, 1);
      newNavItems.splice(dragOverItem, 0, draggedItemContent);
      
      const newOrder = newNavItems.map(item => item.path);
      setCustomNavOrder(newOrder);
      saveNavOrder(newOrder);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
    dragNode.current = null;
  }

  async function saveNavOrder(order) {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nav_order: order })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving nav order:', error);
        showError('Failed to save menu order');
      }
    } catch (error) {
      console.error('Error saving nav order:', error);
      showError('Failed to save menu order');
    }
  }

  // Reset navigation to default order
  async function handleResetNavOrder() {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nav_order: null })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error resetting nav order:', error);
        showError('Failed to reset menu order');
        return;
      }
      
      setCustomNavOrder(null);
      showSuccess('Menu order reset to default');
    } catch (error) {
      console.error('Error resetting nav order:', error);
      showError('Failed to reset menu order');
    }
  }

  // Fixed header height for alignment
  const headerHeight = '56px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '70px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 50
      }}>
        {/* Logo/Header - Organisation : Project - FIXED HEIGHT */}
        <div style={{ 
          height: headerHeight,
          minHeight: headerHeight,
          padding: '0 1rem',
          borderBottom: `2px solid ${brandColor}`,
          background: `linear-gradient(to right, ${brandColor}15, ${brandColor}08)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          boxSizing: 'border-box'
        }}>
          {sidebarOpen && (
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '0.8rem', 
                fontWeight: '600', 
                color: brandColor,
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentOrganisation?.display_name || currentOrganisation?.name || 'Organisation'}
              </h2>
              <span style={{ 
                fontSize: '0.75rem', 
                color: '#64748b',
                display: 'block',
                lineHeight: '1.3'
              }}>
                {projectRef || 'Select Project'}
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const isDragging = draggedItem === index;
            const isDragOver = dragOverItem === index;
            const isReadOnly = isReadOnlyForRole(effectiveRole, item.id);
            
            return (
              <div
                key={item.path}
                draggable={canReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                style={{
                  position: 'relative',
                  marginBottom: '0.25rem',
                  borderTop: isDragOver && draggedItem > index ? '2px solid #10b981' : '2px solid transparent',
                  borderBottom: isDragOver && draggedItem < index ? '2px solid #10b981' : '2px solid transparent',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <Link
                  to={item.path}
                  data-testid={`nav-${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: sidebarOpen ? '0.75rem 1rem' : '0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? '#10b981' : '#64748b',
                    backgroundColor: isActive ? '#f0fdf4' : isDragging ? '#f1f5f9' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    transition: 'all 0.15s ease',
                    cursor: canReorder ? 'grab' : 'pointer'
                  }}
                >
                  {sidebarOpen && canReorder && (
                    <GripVertical 
                      size={14} 
                      style={{ 
                        color: '#cbd5e1',
                        marginRight: '-0.25rem',
                        flexShrink: 0
                      }} 
                    />
                  )}
                  <Icon size={20} />
                  {sidebarOpen && (
                    <span style={{ flex: 1 }}>{item.label}</span>
                  )}
                  {sidebarOpen && isReadOnly && (
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '0.125rem 0.375rem',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      VIEW
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Reset Navigation Order Button (only shown when custom order is active) */}
        {sidebarOpen && canReorder && hasCustomOrder && (
          <div style={{ 
            padding: '0.5rem 1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              onClick={handleResetNavOrder}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <RotateCcw size={14} />
              Reset Menu Order
            </button>
          </div>
        )}

        {/* Logout Button Only (sidebar bottom) */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <button
            data-testid="logout-button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '70px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header Bar with User Info and Notification Bell - MATCHES SIDEBAR HEIGHT */}
        <header style={{
          height: headerHeight,
          minHeight: headerHeight,
          padding: '0 1.5rem',
          backgroundColor: 'white',
          borderBottom: `2px solid ${brandColor}`,
          background: `linear-gradient(to right, ${brandColor}08, white 30%)`,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          boxSizing: 'border-box'
        }}>
          {/* Organisation Switcher (only shown for users with multiple organisations) */}
          <OrganisationSwitcher />
          
          {/* Project Switcher (only shown for users with multiple projects) */}
          <ProjectSwitcher />
          
          {/* View As Role Selector (only shown for admin/supplier_pm) */}
          <ViewAsBar />
          
          {/* User Name and Role Display - Clickable to go to My Account */}
          <Link
            to="/account"
            data-testid="user-menu-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingRight: '1rem',
              borderRight: '1px solid #e2e8f0',
              textDecoration: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '0.5rem 1rem 0.5rem 0.75rem',
              marginRight: '0',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '0.875rem',
                color: '#1e293b'
              }}>
                {displayName}
                {isImpersonating && (
                  <ViewAsInline />
                )}
              </div>
              <span style={{
                display: 'inline-block',
                padding: '0.125rem 0.5rem',
                backgroundColor: roleDisplay.bg,
                color: roleDisplay.color,
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                {roleDisplay.shortLabel}
              </span>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: roleDisplay.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}>
              {initials}
            </div>
          </Link>
          
          {/* Notification Bell */}
          <NotificationBell />
        </header>

        {/* Read-only Banner (for viewers on read-only pages) */}
        {isCurrentPageReadOnly && (
          <div style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>You have read-only access to this page</span>
          </div>
        )}

        {/* Page Content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
