/**
 * VendorCard Component
 * 
 * Displays vendor information in a card format.
 * Used in the vendor pipeline/Kanban view and list views.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 5 - Vendor Management (Task 5A.4)
 */

import React from 'react';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  User,
  MoreVertical,
  ChevronRight,
  Key,
  Clock,
  Users
} from 'lucide-react';
import { VENDOR_STATUS_CONFIG } from '../../../services/evaluator';
import './VendorCard.css';

function VendorCard({ 
  vendor, 
  onClick, 
  onStatusChange,
  onMenuClick,
  compact = false,
  draggable = false,
  isDragging = false
}) {
  const statusConfig = VENDOR_STATUS_CONFIG[vendor.status] || {};
  const primaryContact = vendor.primaryContact || vendor.contacts?.find(c => c.is_primary);
  
  const handleClick = (e) => {
    // Don't navigate if clicking on menu button
    if (e.target.closest('.vendor-card-menu')) return;
    onClick?.(vendor);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    onMenuClick?.(vendor, e);
  };

  // Format portal expiry
  const formatPortalExpiry = () => {
    if (!vendor.portal_access_expires_at) return null;
    const expiry = new Date(vendor.portal_access_expires_at);
    const now = new Date();
    const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'Expired';
    if (daysUntil === 0) return 'Expires today';
    if (daysUntil === 1) return 'Expires tomorrow';
    return `Expires in ${daysUntil} days`;
  };

  return (
    <div 
      className={`vendor-card ${compact ? 'vendor-card-compact' : ''} ${isDragging ? 'vendor-card-dragging' : ''}`}
      onClick={handleClick}
      draggable={draggable}
    >
      <div className="vendor-card-header">
        <div className="vendor-card-icon">
          <Building2 size={compact ? 16 : 20} />
        </div>
        <div className="vendor-card-title-section">
          <h3 className="vendor-card-name">{vendor.name}</h3>
          {!compact && vendor.website && (
            <a 
              href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="vendor-card-website"
              onClick={e => e.stopPropagation()}
            >
              <Globe size={12} />
              {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
        </div>
        {onMenuClick && (
          <button 
            className="vendor-card-menu"
            onClick={handleMenuClick}
            aria-label="Vendor actions"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {!compact && vendor.description && (
        <p className="vendor-card-description">{vendor.description}</p>
      )}

      <div className="vendor-card-status">
        <span 
          className="vendor-status-badge"
          style={{ 
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color 
          }}
        >
          {statusConfig.label || vendor.status}
        </span>
        {vendor.portal_enabled && (
          <span className="vendor-portal-badge" title={formatPortalExpiry()}>
            <Key size={12} />
            Portal
          </span>
        )}
      </div>

      {!compact && (
        <div className="vendor-card-details">
          {primaryContact && (
            <div className="vendor-card-contact">
              <div className="vendor-contact-header">
                <User size={14} />
                <span className="vendor-contact-name">{primaryContact.name}</span>
                {primaryContact.role && (
                  <span className="vendor-contact-role">{primaryContact.role}</span>
                )}
              </div>
              <div className="vendor-contact-info">
                {primaryContact.email && (
                  <a 
                    href={`mailto:${primaryContact.email}`}
                    onClick={e => e.stopPropagation()}
                    className="vendor-contact-link"
                  >
                    <Mail size={12} />
                    {primaryContact.email}
                  </a>
                )}
                {primaryContact.phone && (
                  <span className="vendor-contact-phone">
                    <Phone size={12} />
                    {primaryContact.phone}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {!primaryContact && vendor.contactCount > 0 && (
            <div className="vendor-card-contact-count">
              <Users size={14} />
              <span>{vendor.contactCount} contact{vendor.contactCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {!primaryContact && vendor.contactCount === 0 && (
            <div className="vendor-card-no-contact">
              <User size={14} />
              <span>No contacts added</span>
            </div>
          )}
        </div>
      )}

      {compact && primaryContact && (
        <div className="vendor-card-contact-compact">
          <User size={12} />
          <span>{primaryContact.name}</span>
        </div>
      )}

      {!compact && vendor.status_changed_at && (
        <div className="vendor-card-footer">
          <div className="vendor-card-timestamp">
            <Clock size={12} />
            <span>
              Updated {new Date(vendor.status_changed_at).toLocaleDateString()}
            </span>
          </div>
          {onClick && (
            <ChevronRight size={16} className="vendor-card-arrow" />
          )}
        </div>
      )}
    </div>
  );
}

export default VendorCard;
