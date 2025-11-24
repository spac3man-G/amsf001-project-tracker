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
  UserCircle
} from 'lucide-react';

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

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/milestones', icon: Milestone, label: 'Milestones' },
    { path: '/deliverables', icon: Package, label: 'Deliverables' },
    { path: '/resources', icon: Users, label: 'Resources' },
    { path: '/timesheets', icon: Clock, label: 'Timesheets' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/kpis', icon: TrendingUp, label: 'KPIs' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/users', icon: UserCircle, label: 'Users' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  function getRoleLabel(role) {
    switch (role) {
      case 'admin': return 'Admin';
      case 'customer_pm': return 'Customer PM';
      case 'contributor': return 'Contributor';
      default: return 'Viewer';
    }
  }

  function getRoleColor(role) {
    switch (role) {
      case 'admin': return { bg: '#f3e8ff', color: '#7c3aed' };
      case 'customer_pm': return { bg: '#fef3c7', color: '#d97706' };
      case 'contributor': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  const roleStyle = getRoleColor(userRole);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '60px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {sidebarOpen && (
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                AMSF001 Tracker
              </h1>
              <span style={{
                fontSize: '0.7rem',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px'
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
              color: '#64748b'
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#10b981' : '#64748b',
                  backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                  marginBottom: '0.25rem',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            {initials}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: '500', 
                color: '#1e293b', 
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                backgroundColor: roleStyle.bg,
                color: roleStyle.color,
                display: 'inline-block',
                fontWeight: '500'
              }}>
                {getRoleLabel(userRole)}
              </div>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: '#64748b'
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '240px' : '60px',
        transition: 'margin-left 0.3s',
        padding: '1.5rem',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
}
