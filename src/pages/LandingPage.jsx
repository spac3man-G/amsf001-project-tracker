/**
 * Landing Page - Public Home Page
 * 
 * Marketing/welcome page for new visitors.
 * Shows key features and CTA to sign up or login.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  Users, 
  Clock, 
  Receipt, 
  BarChart3, 
  Shield,
  CheckCircle2,
  ArrowRight,
  Zap
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

// Benefits list
const BENEFITS = [
  'Unlimited projects and team members',
  'Real-time collaboration',
  'Mobile-friendly interface',
  'No credit card required',
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
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/login?mode=signup" className="btn-signup-header">
              Sign Up Free
              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <Zap size={14} />
            Free to use • No credit card required
          </div>
          <h1>Manage Projects with Confidence</h1>
          <p className="hero-subtitle">
            Track progress, manage resources, and deliver projects on time. 
            Everything your team needs in one simple platform.
          </p>
          <div className="hero-actions">
            <Link to="/login?mode=signup" className="btn-primary-large">
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn-secondary-large">
              Sign In
            </Link>
          </div>
          <div className="hero-benefits">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <CheckCircle2 size={16} />
                <span>{benefit}</span>
              </div>
            ))}
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

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Get Started?</h2>
          <p>Join teams already using Project Tracker to deliver better projects.</p>
          <Link to="/login?mode=signup" className="btn-cta">
            Create Your Free Account
            <ArrowRight size={20} />
          </Link>
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
            <Link to="/login?mode=signup">Sign Up</Link>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Project Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
