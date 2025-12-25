/**
 * Landing Page - Public Home Page
 * 
 * Simple welcome page for visitors with login option.
 * Users must be invited by an Org Admin to join.
 * 
 * @version 2.0
 * @updated 24 December 2025
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  Users, 
  Clock, 
  Receipt, 
  BarChart3, 
  Shield
} from 'lucide-react';
import './LandingPage.css';

// Feature list
const FEATURES = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Track milestones, deliverables, and project progress in one place.'
  },
  {
    icon: Clock,
    title: 'Timesheet Tracking',
    description: 'Log hours, manage approvals, and monitor resource allocation.'
  },
  {
    icon: Receipt,
    title: 'Expense Management',
    description: 'Capture receipts, track costs, and manage project budgets.'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign roles, and work together seamlessly.'
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Generate insights with customisable reports and dashboards.'
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based access control.'
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-container">
          <div className="logo">
            <FolderKanban size={32} />
            <span>Project Tracker</span>
          </div>
          <nav className="header-nav">
            <Link to="/login" className="btn-login-header">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1>Manage Projects with Confidence</h1>
          <p className="hero-subtitle">
            Track progress, manage resources, and deliver projects on time. 
            Everything your team needs in one simple platform.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary-large">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2>Everything You Need</h2>
            <p>Powerful features to help your team succeed</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <FolderKanban size={24} />
            <span>Project Tracker</span>
          </div>
          <div className="footer-links">
            <Link to="/login">Login</Link>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Project Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
