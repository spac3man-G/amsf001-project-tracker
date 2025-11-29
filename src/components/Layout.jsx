import React, { useState, useEffect, useRef } from 'react';
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
  PieChart
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import {
  canManageSystem,
  canViewWorkflow,
  canViewFinancials,
  getRoleDisplayConfig
} from '../utils/permissions';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [displayName, setDisplayName] = useState('User');
  const [initials, setInitials] = useState('U');
  const [navOrder, setNavOrder] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const dragNode = useRef(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch profile for role, full name, and nav_order
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email, nav_order')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role || 'viewer');
          
          // Set nav order if saved
          if (profile.nav_order && Array.isArray(profile.nav_order)) {
            setNavOrder(profile.nav_order);
          }
          
          // Set display name - prefer full_name, then profile email, then user email
          const name = profile.full_name || profile.email || user.email || 'User';
          setDisplayName(name);
          
          // Calculate initials
          if (profile.full_name) {
            const parts = profile.full_name.split(' ');
            if (parts.length >= 2) {
              setInitials(parts[0][0] + parts[parts.length - 1][0]);
            } else {
              setInitials(profile.full_name[0]);
            }
          } else {
            setInitials(name[0].toUpperCase());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  // Use centralized permission checks
  const hasSystemAccess = canManageSystem(userRole);
  const hasWorkflowAccess = canViewWorkflow(userRole);
  const hasFinancialAccess = canViewFinancials(userRole);

  // Base navigation items (before user ordering)
  const baseNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/milestones', icon: Milestone, label: 'Milestones' },
    { path: '/gantt', icon: GanttChart, label: 'Gantt Chart' },
    { path: '/deliverables', icon: Package, label: 'Deliverables' },
    { path: '/resources', icon: Users, label: 'Resources' },
    { path: '/timesheets', icon: Clock, label: 'Timesheets' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/kpis', icon: TrendingUp, label: 'KPIs' },
    { path: '/quality-standards', icon: Award, label: 'Quality Standards' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    // Margins only visible to Supplier PM and Admin
    ...(hasFinancialAccess ? [
      { path: '/margins', icon: PieChart, label: 'Margins' }
    ] : []),
    // Workflow Summary only visible to PMs and admins
    ...(hasWorkflowAccess ? [
      { path: '/workflow-summary', icon: ClipboardList, label: 'Workflow Summary' }
    ] : []),
    // Users and Settings only visible to admin and supplier_pm
    ...(hasSystemAccess ? [
      { path: '/users', icon: UserCircle, label: 'Users' },
      { path: '/settings', icon: Settings, label: 'Settings' }
    ] : []),
  ];

  // Get sorted nav items based on user's saved order
  function getSortedNavItems() {
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
  }

  const navItems = getSortedNavItems();

  // Drag and drop handlers
  function handleDragStart(e, index) {
    dragNode.current = e.target;
    setDraggedItem(index);
    
    // Add a slight delay to allow the drag image to be created
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
      // Reorder the items
      const newNavItems = [...navItems];
      const draggedItemContent = newNavItems[draggedItem];
      
      // Remove from old position and insert at new position
      newNavItems.splice(draggedItem, 1);
      newNavItems.splice(dragOverItem, 0, draggedItemContent);
      
      // Save the new order
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

  // Use centralized role display config
  const roleConfig = getRoleDisplayConfig(userRole);

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
