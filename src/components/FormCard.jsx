import React from 'react';
import { Save, X } from 'lucide-react';

/**
 * FormCard - Consistent form card wrapper with title and action buttons
 * 
 * Usage:
 *   <FormCard
 *     title="Add New Timesheet"
 *     onSave={handleAdd}
 *     onCancel={() => setShowAddForm(false)}
 *     saving={saving}
 *     saveText="Save Timesheet"
 *   >
 *     <FormCard.Grid>
 *       <FormField.Input label="Name" ... />
 *       <FormField.Select label="Category" ... />
 *     </FormCard.Grid>
 *   </FormCard>
 * 
 * With header badge (like auto-generated ref):
 *   <FormCard
 *     title="Add New KPI"
 *     headerBadge={<span className="badge">{nextRef}</span>}
 *     ...
 *   >
 */

export default function FormCard({
  title,
  headerBadge,
  onSave,
  onCancel,
  saving = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' = left border, 'outlined' = full border
  children,
  saveIcon: SaveIcon = Save,
  disabled = false
}) {
  const cardStyle = variant === 'outlined' 
    ? { marginBottom: '1.5rem', border: '2px solid var(--primary)' }
    : { marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' };

  return (
    <div className="card" style={cardStyle}>
      {/* Header */}
      {(title || headerBadge) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          {title && <h3 style={{ margin: 0 }}>{title}</h3>}
          {headerBadge}
        </div>
      )}
      
      {/* Form Content */}
      {children}
      
      {/* Action Buttons */}
      {(onSave || onCancel) && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {onSave && (
            <button 
              className="btn btn-primary" 
              onClick={onSave} 
              disabled={saving || disabled}
            >
              <SaveIcon size={16} /> {saving ? 'Saving...' : saveText}
            </button>
          )}
          {onCancel && (
            <button 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={saving}
            >
              <X size={16} /> {cancelText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FormCard.Grid - Grid layout for form fields
 * 
 * Usage:
 *   <FormCard.Grid columns={2}>
 *     <FormField.Input ... />
 *     <FormField.Select ... />
 *   </FormCard.Grid>
 * 
 *   <FormCard.Grid columns="auto"> // Uses auto-fit with minmax
 *     ...
 *   </FormCard.Grid>
 */
FormCard.Grid = function FormCardGrid({ 
  columns = 2, 
  gap = '1rem',
  children 
}) {
  const gridStyle = columns === 'auto'
    ? { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap 
      }
    : { 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columns}, 1fr)`, 
        gap 
      };

  return <div style={gridStyle}>{children}</div>;
};

/**
 * FormCard.Section - Section within a form with optional title
 */
FormCard.Section = function FormCardSection({
  title,
  children
}) {
  return (
    <div style={{ marginTop: '1rem' }}>
      {title && (
        <h4 style={{ 
          margin: '0 0 0.75rem 0', 
          fontSize: '0.95rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};
