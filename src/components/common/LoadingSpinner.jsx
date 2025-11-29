import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - Consistent loading indicator across the app
 * 
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner message="Loading timesheets..." />
 *   <LoadingSpinner size="small" />
 *   <LoadingSpinner size="large" fullPage />
 * 
 * Props:
 *   - message: Optional text to display below spinner
 *   - size: 'small' | 'medium' | 'large' (default: 'medium')
 *   - fullPage: If true, centers in full viewport height
 */
function LoadingSpinner({ message, size = 'medium', fullPage = false }) {
  const sizeConfig = {
    small: { icon: 16, text: '0.75rem', padding: '0.5rem' },
    medium: { icon: 24, text: '0.875rem', padding: '1.5rem' },
    large: { icon: 40, text: '1rem', padding: '3rem' }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: config.padding,
    ...(fullPage && {
      minHeight: '60vh'
    })
  };

  const spinnerStyle = {
    animation: 'spin 1s linear infinite',
    color: '#3b82f6'
  };

  const messageStyle = {
    marginTop: '0.75rem',
    color: '#64748b',
    fontSize: config.text
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Loader2 size={config.icon} style={spinnerStyle} />
      {message && <p style={messageStyle}>{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
