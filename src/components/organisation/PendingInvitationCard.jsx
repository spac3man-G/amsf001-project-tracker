/**
 * Pending Invitation Card Component
 * 
 * Displays a pending organisation invitation with actions to:
 * - Copy invitation link
 * - Resend invitation
 * - Revoke invitation
 * - View expiry countdown
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState, useMemo } from 'react';
import { 
  Mail, Clock, Copy, RefreshCw, X, Check,
  AlertCircle, Shield, User
} from 'lucide-react';
import { ORG_ROLE_CONFIG } from '../../lib/permissionMatrix';
import './PendingInvitationCard.css';

/**
 * Calculate time remaining until expiry
 * @param {string} expiresAt - ISO date string
 * @returns {Object} { text, isExpired, isExpiringSoon }
 */
function getExpiryInfo(expiresAt) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;
  
  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true, isExpiringSoon: false };
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 1) {
    return { 
      text: `Expires in ${diffDays} days`, 
      isExpired: false, 
      isExpiringSoon: diffDays <= 2 
    };
  } else if (diffDays === 1) {
    return { text: 'Expires in 1 day', isExpired: false, isExpiringSoon: true };
  } else if (diffHours > 1) {
    return { text: `Expires in ${diffHours} hours`, isExpired: false, isExpiringSoon: true };
  } else if (diffHours === 1) {
    return { text: 'Expires in 1 hour', isExpired: false, isExpiringSoon: true };
  } else {
    return { text: 'Expires soon', isExpired: false, isExpiringSoon: true };
  }
}

export default function PendingInvitationCard({
  invitation,
  onResend,
  onRevoke,
  onCopyLink,
  disabled = false
}) {
  const [copying, setCopying] = useState(false);
  const [resending, setResending] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Calculate expiry info
  const expiryInfo = useMemo(() => {
    return getExpiryInfo(invitation.expires_at);
  }, [invitation.expires_at]);

  // Get role display info
  const roleConfig = ORG_ROLE_CONFIG[invitation.org_role] || {
    label: invitation.org_role,
    color: '#64748b',
    bg: '#f1f5f9'
  };

  // Get role icon
  const getRoleIcon = () => {
    if (invitation.org_role === 'org_admin') {
      return <Shield size={12} />;
    }
    return <User size={12} />;
  };

  // Handle copy link
  const handleCopyLink = async () => {
    if (copying || disabled) return;
    
    setCopying(true);
    try {
      const result = await onCopyLink(invitation);
      if (result) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } finally {
      setCopying(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (resending || disabled) return;
    
    setResending(true);
    try {
      await onResend(invitation);
    } finally {
      setResending(false);
    }
  };

  // Handle revoke
  const handleRevoke = async () => {
    if (revoking || disabled) return;
    
    setRevoking(true);
    try {
      await onRevoke(invitation);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className={`pending-invitation-card ${expiryInfo.isExpired ? 'expired' : ''}`}>
      <div className="invitation-main">
        <div className="invitation-icon">
          <Mail size={18} />
        </div>
        
        <div className="invitation-details">
          <div className="invitation-email">
            {invitation.email}
          </div>
          
          <div className="invitation-meta">
            <span 
              className="invitation-role-badge"
              style={{
                backgroundColor: roleConfig.bg,
                color: roleConfig.color
              }}
            >
              {getRoleIcon()}
              {roleConfig.label}
            </span>
            
            <span className={`invitation-expiry ${expiryInfo.isExpiringSoon ? 'warning' : ''} ${expiryInfo.isExpired ? 'expired' : ''}`}>
              <Clock size={12} />
              {expiryInfo.text}
            </span>
          </div>
          
          {invitation.inviter && (
            <div className="invitation-inviter">
              Invited by {invitation.inviter.full_name || invitation.inviter.email}
              {invitation.invited_at && (
                <> on {new Date(invitation.invited_at).toLocaleDateString()}</>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="invitation-actions">
        {/* Copy Link Button */}
        <button
          className={`invitation-action-btn ${copySuccess ? 'success' : ''}`}
          onClick={handleCopyLink}
          disabled={copying || disabled || expiryInfo.isExpired}
          title="Copy invitation link"
        >
          {copySuccess ? (
            <Check size={16} />
          ) : copying ? (
            <RefreshCw size={16} className="spinning" />
          ) : (
            <Copy size={16} />
          )}
        </button>
        
        {/* Resend Button */}
        <button
          className="invitation-action-btn"
          onClick={handleResend}
          disabled={resending || disabled}
          title={expiryInfo.isExpired ? 'Send new invitation' : 'Resend invitation'}
        >
          {resending ? (
            <RefreshCw size={16} className="spinning" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
        
        {/* Revoke Button */}
        <button
          className="invitation-action-btn danger"
          onClick={handleRevoke}
          disabled={revoking || disabled}
          title="Revoke invitation"
        >
          {revoking ? (
            <RefreshCw size={16} className="spinning" />
          ) : (
            <X size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
