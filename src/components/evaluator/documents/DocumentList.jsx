/**
 * Document List Component
 * 
 * Displays a list or grid of documents with filtering options.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4C)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  X,
  SortAsc,
  SortDesc,
  FileText
} from 'lucide-react';
import DocumentCard from './DocumentCard';
import { 
  DOCUMENT_TYPES, 
  DOCUMENT_TYPE_CONFIG,
  PARSE_STATUSES,
  PARSE_STATUS_CONFIG 
} from '../../../services/evaluator';
import './DocumentList.css';

function DocumentList({
  documents = [],
  loading = false,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
  onParse,
  emptyMessage = 'No documents uploaded yet'
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ documentType: '', parseStatus: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const filteredDocuments = useMemo(() => {
    let result = [...documents];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.name?.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term)
      );
    }
    if (filters.documentType) {
      result = result.filter(doc => doc.document_type === filters.documentType);
    }
    if (filters.parseStatus) {
      result = result.filter(doc => doc.parse_status === filters.parseStatus);
    }
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'file_size':
          aVal = a.file_size || 0;
          bVal = b.file_size || 0;
          break;
        default:
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [documents, searchTerm, filters, sortBy, sortDir]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.documentType) count++;
    if (filters.parseStatus) count++;
    return count;
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({ documentType: '', parseStatus: '' });
    setSearchTerm('');
  }, []);

  if (loading) {
    return (
      <div className="document-list-loading">
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="document-list-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="toolbar-actions">
          <button 
            className={`toolbar-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Document Type</label>
            <select
              value={filters.documentType}
              onChange={(e) => setFilters(f => ({ ...f, documentType: e.target.value }))}
            >
              <option value="">All Types</option>
              {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Parse Status</label>
            <select
              value={filters.parseStatus}
              onChange={(e) => setFilters(f => ({ ...f, parseStatus: e.target.value }))}
            >
              <option value="">All Statuses</option>
              {Object.entries(PARSE_STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="name">Name</option>
              <option value="file_size">File Size</option>
            </select>
            <button 
              className="sort-dir-btn"
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            >
              {sortDir === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
          {activeFilterCount > 0 && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div className="document-list-empty">
          <FileText size={48} />
          <p>{searchTerm || activeFilterCount > 0 ? 'No documents match your filters' : emptyMessage}</p>
        </div>
      ) : (
        <div className={`document-grid ${viewMode}`}>
          {filteredDocuments.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              compact={viewMode === 'list'}
              onPreview={onPreview}
              onDownload={onDownload}
              onEdit={onEdit}
              onDelete={onDelete}
              onParse={onParse}
            />
          ))}
        </div>
      )}

      <div className="document-list-footer">
        <span>{filteredDocuments.length} of {documents.length} documents</span>
      </div>
    </div>
  );
}

export default DocumentList;
