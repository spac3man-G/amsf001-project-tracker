import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Target, Package, Users, Clock, Receipt, 
  TrendingUp, BookOpen, FileText, Settings, LogOut, UserCircle
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);
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
    { path: '/milestones', icon: Target, label: 'Milestones' },
    { path: '/deliverables', icon: Package, label: 'Deliverables' },
    { path: '/resources', icon: Users, label: 'Resources' },
    { path: '/timeshones', icon: Clock, label: 'Timesheets' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/kpis', icon: TrendingUp, label: 'KPIs' },
    { path: '/standards', icon: BookOpen, label: 'Standards' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/users', icon: UserCircle, label: 'Users' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Fix the typo above - timeshones should be timesheets
  navItems[4].path = '/timesheets';

  const displayName = profile?.full_name || profile?.email || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            AMSF001 Tracker
          </h1>
          <span style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            GOJ2025/2409
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <span style={{ fontWeight: '500', color: '#374151' }}>{displayName}</span>
          </div>
          <button 
            onClick={handleLogout} 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{
          width: '250px',
          backgroundColor: 'white',
          borderRight: '1px solid #e2e8f0',
          minHeight: 'calc(100vh - 70px)',
          padding: '1rem 0',
          position: 'sticky',
          top: '70px',
          alignSelf: 'flex-start'
        }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                color: isActive ? '#10b981' : '#64748b',
                backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '500',
                borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                transition: 'all 0.2s'
              })}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          minHeight: 'calc(100vh - 70px)',
          overflow: 'auto'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
