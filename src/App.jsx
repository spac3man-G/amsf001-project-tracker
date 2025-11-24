import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Milestones from './pages/Milestones'
import Resources from './pages/Resources'
import Timesheets from './pages/Timesheets'
import Expenses from './pages/Expenses'
import KPIs from './pages/KPIs'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import NetworkStandards from './pages/NetworkStandards'
import Deliverables from './pages/Deliverables'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            session ? <Navigate to="/" /> : <Login />
          } />
          
          <Route path="/" element={
            !session ? <Navigate to="/login" /> : <Layout session={session} />
          }>
            <Route index element={<Dashboard />} />
            <Route path="milestones" element={<Milestones />} />
            <Route path="deliverables" element={<Deliverables />} />
            <Route path="resources" element={<Resources />} />
            <Route path="timesheets" element={<Timesheets />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="kpis" element={<KPIs />} />
            <Route path="standards" element={<NetworkStandards />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
