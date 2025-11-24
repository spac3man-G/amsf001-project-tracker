import { Outlet, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  Clock, 
  Receipt, 
  TrendingUp,
  FileText,
  UserCog,
  Settings as SettingsIcon,
  LogOut,
  BookOpen
} from 'lucide-react'

export default function Layout({ session }) {
  const location = useLocation()
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Milestones', href: '/milestones', icon: Target },
    { name: 'Resources', href: '/resources', icon: Users },
    { name: 'Timesheets', href: '/timesheets', icon: Clock },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'KPIs', href: '/kpis', icon: TrendingUp },
    { name: 'Standards', href: '/standards', icon: BookOpen },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Users', href: '/users', icon: UserCog },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const userEmail = session?.user?.email || 'User'
  const userInitial = userEmail[0].toUpperCase()

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>AMSF001 Tracker</h1>
            <span className="logo-badge">GOJ/2025/2409</span>
          </div>
          
          <div className="user-menu">
            <div className="user-info">
              <div className="user-avatar">{userInitial}</div>
              <span>{userEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-outline"
              style={{ padding: '0.5rem' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <nav className="nav-menu">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
