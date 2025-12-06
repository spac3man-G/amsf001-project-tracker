/**
 * Section Error Boundary
 * 
 * A granular error boundary that wraps individual page sections.
 * When an error occurs, it shows a contained error message instead of
 * crashing the entire page.
 * 
 * Features:
 * - Contained error display (doesn't crash entire app)
 * - Retry functionality
 * - Error reporting to console
 * - Customizable fallback UI
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Error state display component
 */
function ErrorFallback({ error, resetError, title = 'Something went wrong', compact = false }) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  if (compact) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
        <span style={{ color: '#991b1b', fontSize: '0.875rem', flex: 1 }}>
          Failed to load this section
        </span>
        {resetError && (
          <button
            onClick={resetError}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: 'white',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              color: '#dc2626'
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        backgroundColor: '#fee2e2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem'
      }}>
        <AlertTriangle size={24} style={{ color: '#dc2626' }} />
      </div>
      
      <h3 style={{
        margin: '0 0 0.5rem',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#991b1b'
      }}>
        {title}
      </h3>
      
      <p style={{
        margin: '0 0 1rem',
        fontSize: '0.875rem',
        color: '#b91c1c'
      }}>
        This section encountered an error and couldn't load.
      </p>
      
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        {resetError && (
          <button
            onClick={resetError}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          textAlign: 'left',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          <pre style={{
            margin: 0,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: '#7f1d1d',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}Stack trace:{'\n'}
                {error.stack}
              </>
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Section Error Boundary Class Component
 */
class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error(`[SectionErrorBoundary] Error in ${this.props.name || 'section'}:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, resetError: this.resetError })
          : this.props.fallback;
      }
      
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          title={this.props.errorTitle}
          compact={this.props.compact}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Widget Error Boundary - Compact version for dashboard widgets
 */
export function WidgetErrorBoundary({ children, name }) {
  return (
    <SectionErrorBoundary name={name} compact>
      {children}
    </SectionErrorBoundary>
  );
}

/**
 * Card Error Boundary - For individual cards
 */
export function CardErrorBoundary({ children, name }) {
  return (
    <SectionErrorBoundary name={name} compact>
      {children}
    </SectionErrorBoundary>
  );
}

export { ErrorFallback };
export default SectionErrorBoundary;
