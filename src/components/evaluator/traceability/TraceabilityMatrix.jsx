/**
 * TraceabilityMatrix Component
 * 
 * Displays the requirements x vendors matrix with scores and RAG status.
 * Supports grouping by category, collapsible sections, and cell drill-down.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7 - Traceability & Reports (Task 7A.3)
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  FileText,
  CheckCircle,
  Star,
  Layers
} from 'lucide-react';
import { RAG_CONFIG, RAG_STATUS, CELL_TYPES } from '../../../services/evaluator';
import './TraceabilityMatrix.css';

function TraceabilityMatrix({
  matrix,
  vendors,
  categories,
  collapsedCategories,
  onToggleCategory,
  onCellClick
}) {
  if (!matrix || !matrix.rows) {
    return (
      <div className="matrix-empty">
        <Layers size={48} strokeWidth={1} />
        <p>No matrix data available</p>
      </div>
    );
  }

  // Track current category for collapse functionality
  let currentCategoryId = null;

  return (
    <div className="traceability-matrix-wrapper">
      <div className="traceability-matrix">
        {/* Header Row - Fixed */}
        <div className="matrix-header">
          <div className="matrix-cell header-cell requirement-header">
            <span>Requirement</span>
          </div>
          {vendors.map(vendor => (
            <div 
              key={vendor.id} 
              className="matrix-cell header-cell vendor-header"
            >
              <Building2 size={14} />
              <span className="vendor-name">{vendor.name}</span>
            </div>
          ))}
        </div>

        {/* Matrix Body */}
        <div className="matrix-body">
          {matrix.rows.map((row, rowIndex) => {
            // Handle category header
            if (row.type === 'category_header') {
              currentCategoryId = row.category.id;
              const isCollapsed = collapsedCategories.has(currentCategoryId);
              
              return (
                <div 
                  key={`cat-${row.category.id}`} 
                  className="matrix-category-row"
                  onClick={() => onToggleCategory(row.category.id)}
                >
                  <div className="category-toggle">
                    {isCollapsed ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                  <span className="category-name">{row.category.name}</span>
                  {row.category.weight > 0 && (
                    <span className="category-weight">{row.category.weight}%</span>
                  )}
                </div>
              );
            }

            // Skip requirement rows if category is collapsed
            if (collapsedCategories.has(currentCategoryId)) {
              return null;
            }

            // Handle requirement row
            return (
              <div key={row.requirement.id} className="matrix-row">
                <div className="matrix-cell requirement-cell">
                  <div className="requirement-info">
                    <FileText size={14} />
                    <span className="requirement-name" title={row.requirement.name}>
                      {row.requirement.name}
                    </span>
                    {row.requirement.priority && (
                      <span className={`priority-badge ${row.requirement.priority}`}>
                        {row.requirement.priority.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {row.requirement.mos_cow && (
                      <span className={`moscow-badge ${row.requirement.mos_cow}`}>
                        {row.requirement.mos_cow.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {row.cells.map((cell, cellIndex) => (
                  <MatrixCell
                    key={`${row.requirement.id}-${vendors[cellIndex].id}`}
                    cell={cell}
                    onClick={() => onCellClick(row.requirement.id, vendors[cellIndex].id)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Summary Row */}
        <div className="matrix-summary-row">
          <div className="matrix-cell summary-label">
            <strong>Weighted Average</strong>
          </div>
          {vendors.map(vendor => {
            const totals = matrix.vendorTotals[vendor.id];
            const weightedAvg = totals.totalWeight > 0
              ? totals.weightedScore / totals.totalWeight
              : 0;
            const ragStatus = getRAGStatus(weightedAvg);
            const ragConfig = RAG_CONFIG[ragStatus];

            return (
              <div 
                key={`summary-${vendor.id}`} 
                className="matrix-cell summary-cell"
                style={{ backgroundColor: ragConfig?.bgColor }}
              >
                <span 
                  className="summary-score"
                  style={{ color: ragConfig?.color }}
                >
                  {weightedAvg.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual matrix cell component
 */
function MatrixCell({ cell, onClick }) {
  const { cellType, averageScore, consensusScore, ragStatus, ragConfig, evidenceCount } = cell;

  // Determine cell styling based on RAG status
  const cellStyle = {
    backgroundColor: ragConfig?.bgColor || '#f3f4f6',
    cursor: 'pointer'
  };

  // Render empty cell for no score
  if (cellType === CELL_TYPES.NO_SCORE) {
    return (
      <div 
        className="matrix-cell score-cell no-score"
        style={cellStyle}
        onClick={onClick}
        title="Click to view details"
      >
        <span className="no-score-text">—</span>
      </div>
    );
  }

  // Render scored cell
  const displayScore = consensusScore !== null ? consensusScore : averageScore;
  const isConsensus = cellType === CELL_TYPES.CONSENSUS;

  return (
    <div 
      className={`matrix-cell score-cell ${ragStatus}`}
      style={cellStyle}
      onClick={onClick}
      title={`${isConsensus ? 'Consensus' : 'Average'} Score: ${displayScore?.toFixed(1)}/5. Click for details.`}
    >
      <div className="score-content">
        <span 
          className="score-value"
          style={{ color: ragConfig?.color }}
        >
          {displayScore?.toFixed(1)}
        </span>
        
        {/* Star indicator */}
        <div className="score-stars">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              size={10}
              fill={i <= Math.round(displayScore) ? ragConfig?.color : 'transparent'}
              stroke={ragConfig?.color}
              strokeWidth={1}
            />
          ))}
        </div>
        
        {/* Indicators */}
        <div className="cell-indicators">
          {isConsensus && (
            <CheckCircle 
              size={10} 
              className="consensus-indicator"
              style={{ color: ragConfig?.color }}
            />
          )}
          {evidenceCount > 0 && (
            <span className="evidence-count" style={{ color: ragConfig?.color }}>
              {evidenceCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to get RAG status from score
 */
function getRAGStatus(score) {
  if (score === null || score === undefined || score === 0) return RAG_STATUS.NONE;
  if (score >= 4) return RAG_STATUS.GREEN;
  if (score >= 3) return RAG_STATUS.AMBER;
  return RAG_STATUS.RED;
}

TraceabilityMatrix.propTypes = {
  matrix: PropTypes.shape({
    rows: PropTypes.array.isRequired,
    vendorTotals: PropTypes.object.isRequired
  }),
  vendors: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  categories: PropTypes.array,
  collapsedCategories: PropTypes.instanceOf(Set).isRequired,
  onToggleCategory: PropTypes.func.isRequired,
  onCellClick: PropTypes.func.isRequired
};

MatrixCell.propTypes = {
  cell: PropTypes.shape({
    cellType: PropTypes.string.isRequired,
    averageScore: PropTypes.number,
    consensusScore: PropTypes.number,
    ragStatus: PropTypes.string.isRequired,
    ragConfig: PropTypes.object,
    evidenceCount: PropTypes.number
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

export default TraceabilityMatrix;
