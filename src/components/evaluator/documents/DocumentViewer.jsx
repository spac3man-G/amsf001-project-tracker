/**
 * Document Viewer Component
 * 
 * Modal viewer for previewing documents.
 * Supports PDF, images, and text files.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4C)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader,
  AlertCircle,
  FileText
} from 'lucide-react';
import './DocumentViewer.css';

function DocumentViewer({
  document,
  isOpen,
  onClose,
  onDownload
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState(null);

  const isImage = document?.mime_type?.startsWith('image/');
  const isPdf = document?.mime_type === 'application/pdf';
  const isText = document?.mime_type?.startsWith('text/');

  useEffect(() => {
    if (!isOpen || !document) return;
    setLoading(true);
    setError(null);
    setTextContent(null);
    setZoom(100);
    setRotation(0);
    
    if (isText && document.file_url) {
      fetch(document.file_url)
        .then(res => res.text())
        .then(text => {
          setTextContent(text);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load text content');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isOpen, document, isText]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(document);
    }
  }, [document, onDownload]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') handleZoomIn();
    if (e.key === '-') handleZoomOut();
    if (e.key === 'r' || e.key === 'R') handleRotate();
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleRotate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !document) return null;

  return (
    <div className={`document-viewer-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="document-viewer">
        <div className="viewer-header">
          <div className="viewer-title">
            <FileText size={20} />
            <span>{document.name}</span>
          </div>
          <div className="viewer-controls">
            {(isImage || isPdf) && (
              <>
                <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut size={18} />
                </button>
                <span className="zoom-level">{zoom}%</span>
                <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn size={18} />
                </button>
                {isImage && (
                  <button className="control-btn" onClick={handleRotate} title="Rotate">
                    <RotateCw size={18} />
                  </button>
                )}
                <div className="control-divider" />
              </>
            )}
            <button className="control-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button className="control-btn" onClick={handleDownload} title="Download">
              <Download size={18} />
            </button>
            {document.file_url && (
              <a 
                href={document.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="control-btn"
                title="Open in new tab"
              >
                <ExternalLink size={18} />
              </a>
            )}
            <div className="control-divider" />
            <button className="control-btn close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="viewer-content">
          {loading ? (
            <div className="viewer-loading">
              <Loader className="spinning" size={32} />
              <p>Loading document...</p>
            </div>
          ) : error ? (
            <div className="viewer-error">
              <AlertCircle size={32} />
              <p>{error}</p>
            </div>
          ) : isImage ? (
            <div className="image-container" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}>
              <img src={document.file_url} alt={document.name} onError={() => setError('Failed to load image')} />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${document.file_url}#zoom=${zoom}`}
              title={document.name}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            />
          ) : isText && textContent !== null ? (
            <div className="text-container">
              <pre>{textContent}</pre>
            </div>
          ) : (
            <div className="viewer-unsupported">
              <FileText size={48} />
              <p>Preview not available for this file type</p>
              <button className="download-btn" onClick={handleDownload}>
                <Download size={16} />
                Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentViewer;
