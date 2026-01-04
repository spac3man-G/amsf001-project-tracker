/**
 * VendorPipeline Component
 * 
 * Kanban-style pipeline view for vendor status management.
 * Allows drag-and-drop status transitions.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 5 - Vendor Management (Task 5A.3)
 */

import React, { useState, useCallback } from 'react';
import { 
  Plus,
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import VendorCard from './VendorCard';
import { 
  VENDOR_STATUS_CONFIG, 
  PIPELINE_STAGES,
  TERMINAL_STAGES
} from '../../../services/evaluator';
import './VendorPipeline.css';

function VendorPipeline({ 
  vendors = [], 
  onVendorClick,
  onStatusChange,
  onVendorMenuClick,
  onAddVendor,
  loading = false
}) {
  const [draggedVendor, setDraggedVendor] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [collapsedStages, setCollapsedStages] = useState({});
  const [showTerminal, setShowTerminal] = useState(false);

  // Group vendors by status
  const vendorsByStatus = {};
  Object.keys(VENDOR_STATUS_CONFIG).forEach(status => {
    vendorsByStatus[status] = [];
  });
  vendors.forEach(vendor => {
    if (vendorsByStatus[vendor.status]) {
      vendorsByStatus[vendor.status].push(vendor);
    }
  });

  // Get valid drop targets for dragged vendor
  const getValidDropTargets = useCallback((vendor) => {
    if (!vendor) return [];
    const validTransitions = {
      'identified': ['long_list', 'rejected'],
      'long_list': ['short_list', 'rejected'],
      'short_list': ['rfp_issued', 'long_list', 'rejected'],
      'rfp_issued': ['response_received', 'rejected'],
      'response_received': ['under_evaluation', 'rejected'],
      'under_evaluation': ['selected', 'rejected'],
      'selected': [],
      'rejected': ['identified']
    };
    return validTransitions[vendor.status] || [];
  }, []);

  // Drag handlers
  const handleDragStart = (e, vendor) => {
    setDraggedVendor(vendor);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', vendor.id);
  };

  const handleDragEnd = () => {
    setDraggedVendor(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    if (!draggedVendor) return;
    
    const validTargets = getValidDropTargets(draggedVendor);
    if (validTargets.includes(stage)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverStage(stage);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    if (!draggedVendor) return;

    const validTargets = getValidDropTargets(draggedVendor);
    if (validTargets.includes(targetStage)) {
      onStatusChange?.(draggedVendor, targetStage);
    }

    setDraggedVendor(null);
    setDragOverStage(null);
  };

  const toggleStageCollapse = (stage) => {
    setCollapsedStages(prev => ({
      ...prev,
      [stage]: !prev[stage]
    }));
  };

  // Count vendors in terminal stages
  const terminalCount = TERMINAL_STAGES.reduce(
    (sum, status) => sum + (vendorsByStatus[status]?.length || 0), 
    0
  );

  return (
    <div className="vendor-pipeline">
      {/* Pipeline stages */}
      <div className="vendor-pipeline-stages">
        {PIPELINE_STAGES.map(stage => {
          const config = VENDOR_STATUS_CONFIG[stage];
          const stageVendors = vendorsByStatus[stage] || [];
          const isCollapsed = collapsedStages[stage];
          const isValidTarget = draggedVendor && 
            getValidDropTargets(draggedVendor).includes(stage);
          const isDragOver = dragOverStage === stage;

          return (
            <div 
              key={stage}
              className={`pipeline-stage ${isCollapsed ? 'collapsed' : ''} ${isValidTarget ? 'valid-target' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div 
                className="pipeline-stage-header"
                onClick={() => toggleStageCollapse(stage)}
              >
                <div className="pipeline-stage-title">
                  <span 
                    className="pipeline-stage-dot"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="pipeline-stage-name">{config.label}</span>
                  <span className="pipeline-stage-count">{stageVendors.length}</span>
                </div>
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </div>

              {!isCollapsed && (
                <div className="pipeline-stage-content">
                  {stageVendors.length === 0 && !loading && (
                    <div className="pipeline-stage-empty">
                      <p>No vendors</p>
                      {stage === 'identified' && onAddVendor && (
                        <button 
                          className="pipeline-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddVendor();
                          }}
                        >
                          <Plus size={14} />
                          Add vendor
                        </button>
                      )}
                    </div>
                  )}

                  {stageVendors.map(vendor => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      compact={true}
                      onClick={onVendorClick}
                      onMenuClick={onVendorMenuClick}
                      draggable={true}
                      isDragging={draggedVendor?.id === vendor.id}
                      onDragStart={(e) => handleDragStart(e, vendor)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal stages (Selected/Rejected) */}
      {terminalCount > 0 && (
        <div className="vendor-pipeline-terminal">
          <button 
            className="terminal-toggle"
            onClick={() => setShowTerminal(!showTerminal)}
          >
            {showTerminal ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Completed ({terminalCount})</span>
          </button>

          {showTerminal && (
            <div className="terminal-stages">
              {TERMINAL_STAGES.map(stage => {
                const config = VENDOR_STATUS_CONFIG[stage];
                const stageVendors = vendorsByStatus[stage] || [];
                if (stageVendors.length === 0) return null;

                const isValidTarget = draggedVendor && 
                  getValidDropTargets(draggedVendor).includes(stage);
                const isDragOver = dragOverStage === stage;

                return (
                  <div 
                    key={stage}
                    className={`terminal-stage ${isValidTarget ? 'valid-target' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, stage)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage)}
                  >
                    <div className="terminal-stage-header">
                      <span 
                        className="pipeline-stage-dot"
                        style={{ backgroundColor: config.color }}
                      />
                      <span>{config.label}</span>
                      <span className="pipeline-stage-count">{stageVendors.length}</span>
                    </div>
                    <div className="terminal-stage-vendors">
                      {stageVendors.map(vendor => (
                        <VendorCard
                          key={vendor.id}
                          vendor={vendor}
                          compact={true}
                          onClick={onVendorClick}
                          onMenuClick={onVendorMenuClick}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="vendor-pipeline-loading">
          <div className="spinner" />
          <span>Loading vendors...</span>
        </div>
      )}
    </div>
  );
}

export default VendorPipeline;
