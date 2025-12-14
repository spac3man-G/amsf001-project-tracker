import React from 'react';

/**
 * LoadingSpinner - Apple-inspired loading indicator
 * 
 * @param {string} [message] - Optional text to display below spinner
 * @param {string} [size='medium'] - Size: 'small', 'medium', 'large'
 * @param {boolean} [fullPage=false] - Center in full viewport
 * @param {string} [className] - Additional CSS classes
 * 
 * Test IDs (see docs/TESTING-CONVENTIONS.md):
 *   - loading-spinner
 * 
 * @version 1.1
 * @modified 14 December 2025 - Added data-testid for E2E testing
 */
function LoadingSpinner({ 
  message, 
  size = 'medium', 
  fullPage = false,
  className = ''
}) {
  const sizeClasses = {
    small: 'spinner-sm',
    medium: '',
    large: 'spinner-lg'
  };

  return (
    <div 
      data-testid="loading-spinner"
      className={`loading-spinner ${className}`}
      style={fullPage ? { minHeight: '60vh' } : undefined}
    >
      <div className={`spinner ${sizeClasses[size]}`} />
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
