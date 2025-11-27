// Centralized permission checks for AMSF001 Project Tracker
// Role hierarchy: admin = supplier_pm > customer_pm > contributor > viewer

export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  CUSTOMER_PM: 'customer_pm',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};

// Check if user has full admin rights (admin or supplier_pm)
export function isFullAdmin(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPPLIER_PM;
}

// Check if user can manage users and settings
export function canManageSystem(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPPLIER_PM;
}

// Check if user can create/edit milestones, KPIs, quality standards
export function canManageProjectItems(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPPLIER_PM || role === ROLES.CUSTOMER_PM;
}

// Check if user can validate (approve) timesheets, expenses, deliverables
export function canValidate(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPPLIER_PM || role === ROLES.CUSTOMER_PM;
}

// Check if user can add deliverables
export function canAddDeliverables(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPPLIER_PM || role === ROLES.CUSTOMER_PM || role === ROLES.CONTRIBUTOR;
}

// Check if user can submit timesheets
export function canSubmitTimesheets(role) {
  return role !== ROLES.VIEWER;
}

// Check if user can submit timesheets for anyone (not just themselves)
export function canSubmitTimesheetsForAnyone(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPPLIER_PM;
}

// Get role display configuration
export function getRoleConfig(role) {
  const configs = {
    admin: { label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' },
    supplier_pm: { label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
    customer_pm: { label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
    contributor: { label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
    viewer: { label: 'Viewer', color: '#64748b', bg: '#f1f5f9' }
  };
  return configs[role] || configs.viewer;
}

// All available roles for dropdowns
export const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', color: '#64748b', bg: '#f1f5f9' },
  { value: 'contributor', label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
  { value: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
  { value: 'supplier_pm', label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
  { value: 'admin', label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' }
];
