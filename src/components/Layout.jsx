import React, { useState, useEffect } from 'react';
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
  GanttChart
} from 'lucide-react';

// Permission checks
function canManageSystem(role) {
  return role === 'admin' || role === 'supplier_pm';
}

function getRoleConfig(role) {
  const configs = {
    admin: { label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' },
    supplier_pm: { label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
    customer_pm: { label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
    contributor: { label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
    viewer: { label: 'Viewer', color: '#64748b', bg: '#f1f5f9' }
  };
  return configs[role] || configs.viewer;
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [displayName, setDisplayName] = useState('User');
  const [initials, setInitials] = useState('U');

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch profile for role and full name
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role || 'viewer');
          
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

  // Permission checks using centralized permissions
  const hasSystemAccess = canManageSystem(userRole);

  // Build navigation items based on permissions
  const navItems = [
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
    // Users and Settings only visible to admin and supplier_pm
    ...(hasSystemAccess ? [
      { path: '/users', icon: UserCircle, label: 'Users' },
      { path: '/settings', icon: Settings, label: 'Settings' }
    ] : []),
  ];

  const roleConfig = getRoleConfig(userRole);

  const isAccountPage = location.pathname === '/account';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '60px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'fixed',
        height: '100vh',
        zIndex: 100
      }}>
        {/* Logo section */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          {sidebarOpen && (
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>
                AMSF001 Tracker
              </h2>
              <span style={{ 
                fontSize: '0.7rem', 
                backgroundColor: '#10b981', 
                color: 'white', 
                padding: '0.125rem 0.375rem', 
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                GOJ2025/2409
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#64748b',
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: sidebarOpen ? '0.75rem 1rem' : '0.75rem',
                  marginBottom: '0.25rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#10b981' : '#64748b',
                  backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
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

        {/* User section */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '0.85rem',
            flexShrink: 0
          }}>
            {initials}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '0.9rem', 
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.75rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                display: 'inline-block',
                marginTop: '0.125rem',
                backgroundColor: roleConfig.bg,
                color: roleConfig.color,
                fontWeight: '500'
              }}>
                {roleConfig.label}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '240px' : '60px',
        transition: 'margin-left 0.2s ease',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
}
