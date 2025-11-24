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
        // Fetch profile to get name
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
    { path: '/timesheets', icon: Clock, label: 'Timesheets' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/kpis', icon: TrendingUp, label: 'KPIs' },
    { path: '/standards', icon: BookOpen, label: 'Standards' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/users', icon: UserCircle, label: 'Users' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Get display name - prefer full_name, then email, then user email
  const displayName = profile?.full_name || profile?.email || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">AMSF001 Tracker</h1>
          <span className="project-badge">GOJ2025/2409</span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div 
              className="avatar" 
              style={{ 
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
              }}
            >
              {initials}
            </div>
            <span className="user-name">{displayName}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <nav className="sidebar">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
