/**
 * Report Preview Component
 * 
 * Renders the report HTML in an iframe for preview.
 * Provides print functionality using the iframe's print method.
 * 
 * Features:
 * - Sandboxed iframe for security
 * - Print-ready output
 * - Responsive sizing
 * - Loading states
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 11
 */

import React, { 
  useRef, 
  useEffect, 
  useState, 
  forwardRef, 
  useImperativeHandle,
  useCallback 
} from 'react';
import { Loader, AlertCircle, FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// ============================================
// ZOOM CONTROLS
// ============================================

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="preview-zoom-controls">
      <button 
        className="preview-zoom-btn"
        onClick={onZoomOut}
        disabled={zoom <= 50}
        title="Zoom Out"
      >
        <ZoomOut size={16} />
      </button>
      <span className="preview-zoom-level">{zoom}%</span>
      <button 
        className="preview-zoom-btn"
        onClick={onZoomIn}
        disabled={zoom >= 200}
        title="Zoom In"
      >
        <ZoomIn size={16} />
      </button>
      <button 
        className="preview-zoom-btn"
        onClick={onReset}
        disabled={zoom === 100}
        title="Reset Zoom"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const ReportPreview = forwardRef(function ReportPreview({ html, title = 'Report' }, ref) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(100);

  // ─────────────────────────────────────────
  // Expose print method to parent
  // ─────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    print: () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.focus();
          iframeRef.current.contentWindow.print();
        } catch (error) {
          console.error('Print error:', error);
          // Fallback: try to open in new window and print
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }
        }
      }
    },
    getHtml: () => html
  }), [html]);

  // ─────────────────────────────────────────
  // Load HTML into iframe
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!html || !iframeRef.current) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        // Wait for content to load
        if (iframe.contentWindow) {
          iframe.contentWindow.onload = () => {
            setIsLoading(false);
          };
        }

        // Fallback timeout in case onload doesn't fire
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        throw new Error('Could not access iframe document');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [html]);

  // ─────────────────────────────────────────
  // Zoom Controls
  // ─────────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  if (!html) {
    return (
      <div className="preview-frame-empty">
        <FileText size={48} />
        <p>No preview content available</p>
      </div>
    );
  }

  return (
    <div className="preview-frame-container">
      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleZoomReset}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="preview-frame-loading">
          <Loader size={32} className="ai-spinner" />
          <p>Loading preview...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="preview-frame-error">
          <AlertCircle size={32} />
          <p>Failed to load preview</p>
        </div>
      )}

      {/* Preview Frame */}
      <div 
        className="preview-frame-wrapper"
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center'
        }}
      >
        <iframe
          ref={iframeRef}
          title={title}
          className="preview-frame"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
});

export default ReportPreview;
