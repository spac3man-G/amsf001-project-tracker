import React from 'react';
import { 
  Package, Clock, Receipt, Users, Target, Award, FileText,
  PiggyBank, FolderOpen, Search, AlertCircle
} from 'lucide-react';

/**
 * EmptyState - Reusable empty state component
 * 
 * Usage:
 *   <EmptyState
 *     icon="deliverables"
 *     title="No deliverables found"
 *     message="Get started by adding your first deliverable."
 *     action={{ label: 'Add Deliverable', onClick: () => setShowAddForm(true) }}
 *   />
 * 
 * For tables:
 *   <EmptyState.TableRow colSpan={7} message="No expenses found." />
 */

const ICONS = {
  deliverables: Package,
  timesheets: Clock,
  expenses: Receipt,
  users: Users,
  resources: Users,
  milestones: Target,
  quality: Award,
  kpis: Target,
  budgets: PiggyBank,
  standards: FileText,
  default: FolderOpen,
  search: Search,
  error: AlertCircle
};

export default function EmptyState({
  icon = 'default',
  title,
  message,
  action,
  compact = false
}) {
  const Icon = ICONS[icon] || ICONS.default;

  if (compact) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#64748b',
        padding: '2rem'
      }}>
        <Icon size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p style={{ margin: 0 }}>{message || title}</p>
      </div>
    );
  }

  return (
    <div 
      className="card"
      style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        color: '#64748b'
      }}
    >
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem auto'
      }}>
        <Icon size={28} style={{ color: '#94a3b8' }} />
      </div>
      
      {title && (
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          color: '#374151',
          fontSize: '1.125rem'
        }}>
          {title}
        </h3>
      )}
      
      {message && (
        <p style={{ 
          margin: action ? '0 0 1.5rem 0' : 0,
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {message}
        </p>
      )}
      
      {action && (
        <button 
          className="btn btn-primary"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * TableRow variant for use inside tables
 */
EmptyState.TableRow = function EmptyStateTableRow({
  colSpan = 1,
  message = 'No data found.',
  icon = 'default'
}) {
  const Icon = ICONS[icon] || ICONS.default;
  
  return (
    <tr>
      <td 
        colSpan={colSpan} 
        style={{ 
          textAlign: 'center', 
          color: '#64748b', 
          padding: '2rem' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Icon size={18} style={{ opacity: 0.5 }} />
          <span>{message}</span>
        </div>
      </td>
    </tr>
  );
};

/**
 * Card variant with grid span for card-based layouts
 */
EmptyState.Card = function EmptyStateCard({
  message = 'No items found.',
  icon = 'default',
  gridColumn = '1 / -1'
}) {
  const Icon = ICONS[icon] || ICONS.default;
  
  return (
    <div 
      className="card" 
      style={{ 
        gridColumn, 
        textAlign: 'center', 
        color: '#64748b', 
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem'
      }}
    >
      <Icon size={20} style={{ opacity: 0.5 }} />
      <span>{message}</span>
    </div>
  );
};
