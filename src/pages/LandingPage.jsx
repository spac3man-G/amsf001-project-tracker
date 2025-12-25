/**
 * Landing Page - Public Home Page
 * 
 * Simple welcome page with login option.
 * Users must be invited by an Org Admin to join.
 * 
 * @version 3.0
 * @updated 24 December 2025
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page landing-page-minimal">
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

      {/* Simple Hero Section */}
      <section className="hero-section hero-minimal">
        <div className="hero-container">
          <h1>Project Tracker</h1>
          <p className="hero-subtitle">
            Track progress, manage resources, and deliver projects on time.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary-large">
              Login
            </Link>
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
          <div className="footer-copyright">
            © {new Date().getFullYear()} Project Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
