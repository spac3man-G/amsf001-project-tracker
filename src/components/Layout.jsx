// src/components/Layout.jsx
// Version 6.1 - Added Partners navigation

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Milestone, 
  Package,
  Users, 
  Clock, 
  Receipt,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  UserCog,
  Award,
  GanttChart,
  GripVertical,
  ClipboardList,
  Building2
} from 'lucide-react';
import NotificationBell from './NotificationBell';

// Import from centralized permissions
import { canAccessSettings, canViewWorkflowSummary, canViewPartners, getRoleConfig } from '../lib/permissions';

// Import AuthContext for user data
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use AuthContext for user data - single source of truth
  const { user, profile, role, signOut } = useAuth();
  
  // Local state for UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navOrder, setNavOrder] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const dragNode = useRef(null);

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

  // Load nav_order from profile when it becomes available
  useEffect(() => {
    if (profile?.nav_order && Array.isArray(profile.nav_order)) {
      setNavOrder(profile.nav_order);
    }
  }, [profile]);

  // Handle logout using AuthContext
  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  // Permission checks using centralized permissions
  const hasSystemAccess = canAccessSettings(role);
  const hasWorkflowAccess = canViewWorkflowSummary(role);
  const hasPartnersAccess = canViewPartners(role);

  // Base navigation items (before user ordering)
  const baseNavItems = useMemo(() => [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/milestones', icon: Milestone, label: 'Milestones' },
    { path: '/gantt', icon: GanttChart, label: 'Gantt Chart' },
    { path: '/deliverables', icon: Package, label: 'Deliverables' },
    { path: '/resources', icon: Users, label: 'Resources' },
    // Partners only visible to admin and supplier_pm
    ...(hasPartnersAccess ? [
      { path: '/partners', icon: Building2, label: 'Partners' }
    ] : []),
    { path: '/timesheets', icon: Clock, label: 'Timesheets' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/kpis', icon: TrendingUp, label: 'KPIs' },
    { path: '/quality-standards', icon: Award, label: 'Quality Standards' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    // Workflow Summary only visible to PMs and admins
    ...(hasWorkflowAccess ? [
      { path: '/workflow-summary', icon: ClipboardList, label: 'Workflow Summary' }
    ] : []),
    // Users and Settings only visible to admin and supplier_pm
    ...(hasSystemAccess ? [
      { path: '/users', icon: UserCircle, label: 'Users' },
      { path: '/settings', icon: Settings, label: 'Settings' }
    ] : []),
  ], [hasSystemAccess, hasWorkflowAccess, hasPartnersAccess]);

  // Get sorted nav items based on user's saved order
  const navItems = useMemo(() => {
    if (!navOrder || navOrder.length === 0) {
      return baseNavItems;
    }
    
    // Create a map of items by path for quick lookup
    const itemMap = {};
    baseNavItems.forEach(item => {
      itemMap[item.path] = item;
    });
    
    // Build sorted array based on saved order
    const sorted = [];
    navOrder.forEach(path => {
      if (itemMap[path]) {
        sorted.push(itemMap[path]);
        delete itemMap[path];
      }
    });
    
    // Add any items not in the saved order at the end
    Object.values(itemMap).forEach(item => {
      sorted.push(item);
    });
    
    return sorted;
  }, [navOrder, baseNavItems]);

  // Drag and drop handlers
  function handleDragStart(e, index) {
    dragNode.current = e.target;
    setDraggedItem(index);
    
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.5';
      }
    }, 0);
  }

  function handleDragEnter(e, index) {
    if (index !== draggedItem) {
      setDragOverItem(index);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDragEnd() {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newNavItems = [...navItems];
      const draggedItemContent = newNavItems[draggedItem];
      
      newNavItems.splice(draggedItem, 1);
      newNavItems.splice(dragOverItem, 0, draggedItemContent);
      
      const newOrder = newNavItems.map(item => item.path);
      setNavOrder(newOrder);
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
      }
    } catch (error) {
      console.error('Error saving nav order:', error);
    }
  }

  // Get role config from centralized permissions
  const roleConfig = getRoleConfig(role);

  const isAccountPage = location.pathname === '/account';

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
            
            return (
              <div
                key={item.path}
                draggable
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
                    cursor: 'grab'
                  }}
                >
                  {sidebarOpen && (
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
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* My Account Link */}
        <div style={{ 
          padding: '0.5rem', 
          borderTop: '1px solid #e2e8f0'
        }}>
          <Link
            to="/account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: sidebarOpen ? '0.75rem 1rem' : '0.75rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isAccountPage ? '#10b981' : '#64748b',
              backgroundColor: isAccountPage ? '#f0fdf4' : 'transparent',
              fontWeight: isAccountPage ? '600' : '500',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <UserCog size={20} />
            {sidebarOpen && <span>My Account</span>}
          </Link>
        </div>

        {/* User Info & Logout */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {displayName}
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.125rem 0.5rem',
                  backgroundColor: roleConfig.bg,
                  color: roleConfig.color,
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}>
                  {roleConfig.label}
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.875rem',
              margin: '0 auto 0.75rem'
            }}>
              {initials}
            </div>
          )}
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
        {/* Top Header Bar with Notification Bell */}
        <header style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <NotificationBell />
        </header>

        {/* Page Content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
