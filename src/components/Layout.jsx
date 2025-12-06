// src/components/Layout.jsx
// Version 10.0 - Added View As role impersonation support
// - User name/role only shown in header (top right)
// - Clicking user info in header navigates to My Account
// - Drag and drop navigation reordering for non-viewers
// - Reset to default order button when custom order is active
// - View As bar for admin/supplier_pm to preview other roles

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
import { useToast } from '../contexts/ToastContext';

// Import from centralized navigation config
import { 
  getNavigationForRole, 
  applyCustomNavOrder, 
  canReorderNavigation,
  getRoleDisplay,
  isReadOnlyForRole,
  getNavItemIdByPath,
  getDefaultNavOrder,
  isDefaultOrder
} from '../lib/navigation';

// Import AuthContext for user data
import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  // Use AuthContext for user data - single source of truth
  const { user, profile, role: actualRole, signOut } = useAuth();
  
  // Use ViewAsContext for effective role (supports impersonation)
  const { effectiveRole, isImpersonating, effectiveRoleConfig } = useViewAs();
  
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
  const navItems = useMemo(() => {
    const roleNav = getNavigationForRole(effectiveRole);
    if (customNavOrder && customNavOrder.length > 0) {
      return applyCustomNavOrder(effectiveRole, customNavOrder);
    }
    return roleNav;
  }, [effectiveRole, customNavOrder]);

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
        {/* Logo/Header */}
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {sidebarOpen && (
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>
                AMSF001
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Project Tracker</span>
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
              justifyContent: 'center'
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
        {/* Top Header Bar with User Info and Notification Bell */}
        <header style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* View As Role Selector (only shown for admin/supplier_pm) */}
          <ViewAsBar />
          
          {/* User Name and Role Display - Clickable to go to My Account */}
          <Link
            to="/account"
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
