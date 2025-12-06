/**
 * Resource Details Display Component
 * 
 * Display mode for resource information:
 * - Basic info (name, email, role, reference)
 * - SFIA level with badge
 * - Days used and value info
 * - Partner association
 * 
 * @version 2.0 - Updated to use centralised utilities, removed allocation
 * @created 1 December 2025
 * @updated 6 December 2025
 */

import React from 'react';
import { User, Mail, Briefcase, FileText, Award, Clock, DollarSign, Link2 } from 'lucide-react';
import { sfiaToDisplay, getSfiaConfig, RESOURCE_TYPE } from '../../lib/resourceCalculations';

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <span style={{ 
        fontSize: '0.75rem', 
        color: '#64748b', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.25rem' 
      }}>
        {icon} {label}
      </span>
      <span style={{ fontWeight: '500', marginTop: '0.25rem', display: 'block' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Get SFIA badge colour config
 */
function getSfiaColor(level) {
  const config = getSfiaConfig(level);
  // Map CSS class to actual colours for inline styles
  switch(config.cssClass) {
    case 'sfia-l6': return { bg: '#fef3c7', color: '#92400e' };
    case 'sfia-l5': return { bg: '#dcfce7', color: '#166534' };
    case 'sfia-l4': return { bg: '#dbeafe', color: '#1e40af' };
    default: return { bg: '#f1f5f9', color: '#475569' };
  }
}

export default function ResourceDetailsDisplay({
  resource,
  daysUsed,
  sellValue,
  canSeeResourceType
}) {
  const sfiaDisplay = sfiaToDisplay(resource.sfia_level);
  const sfiaStyle = getSfiaColor(resource.sfia_level);

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column */}
        <div>
          <DetailRow 
            icon={<User size={16} />} 
            label="Name" 
            value={resource.name} 
          />
          <DetailRow 
            icon={<Mail size={16} />} 
            label="Email" 
            value={resource.email} 
          />
          <DetailRow 
            icon={<Briefcase size={16} />} 
            label="Role" 
            value={resource.role} 
          />
          <DetailRow 
            icon={<FileText size={16} />} 
            label="Reference" 
            value={resource.resource_ref || 'Not set'} 
          />
        </div>

        {/* Right column */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem' 
            }}>
              <Award size={14} /> SFIA Level
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.25rem 0.5rem',
              backgroundColor: sfiaStyle.bg,
              color: sfiaStyle.color,
              borderRadius: '4px',
              fontWeight: '500',
              marginTop: '0.25rem'
            }}>
              {sfiaDisplay}
            </span>
          </div>

          <DetailRow 
            icon={<Clock size={16} />} 
            label="Days Used" 
            value={`${daysUsed?.toFixed(1) || 0} days`} 
          />
          <DetailRow 
            icon={<DollarSign size={16} />} 
            label="Sell Value" 
            value={`£${(sellValue || 0).toLocaleString()}`} 
          />

          {/* Partner info - only show if third_party and has partner */}
          {canSeeResourceType && resource.resource_type === RESOURCE_TYPE.THIRD_PARTY && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                color: '#64748b', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }}>
                <Link2 size={14} /> Partner
              </span>
              <span style={{ fontWeight: '500', marginTop: '0.25rem', display: 'block' }}>
                {resource.partner?.name || 'Not assigned'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
