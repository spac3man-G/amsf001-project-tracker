import React from 'react';

/**
 * LoadingSpinner - Apple-inspired loading indicator
 * 
 * @param {string} [message] - Optional text to display below spinner
 * @param {string} [size='medium'] - Size: 'small', 'medium', 'large'
 * @param {boolean} [fullPage=false] - Center in full viewport
 * @param {string} [className] - Additional CSS classes
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
      className={`loading-spinner ${className}`}
      style={fullPage ? { minHeight: '60vh' } : undefined}
    >
      <div className={`spinner ${sizeClasses[size]}`} />
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
