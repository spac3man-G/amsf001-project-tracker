import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Settings as SettingsIcon, User, Shield, Bell, Database,
  Save, RefreshCw, Trash2, AlertTriangle, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
import { useAuth, useProject } from '../hooks';

export default function Settings() {
  // ============================================
  // HOOKS - Replace boilerplate
  // ============================================
  const { user: currentUser, userRole, profile: authProfile, loading: authLoading } = useAuth();
  const { project, loading: projectLoading } = useProject();
  const toast = useToast();
  const { showTestUsers, setShowTestUsers } = useTestUsers();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    role: 'viewer'
  });
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!authLoading && authProfile) {
      setProfile({
        full_name: authProfile.full_name || '',
        email: authProfile.email || currentUser?.email || '',
        role: authProfile.role || 'viewer'
      });
      fetchData();
    }
  }, [authLoading, authProfile]);

  async function fetchData() {
    try {
      setLoading(true);
        setProject(projectData);
      }

      // Fetch all users for admin
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
      
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching settings data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateUserRole(userId, newRole) {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchData();
      toast.success('User role updated!');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update role', error.message);
    }
  }

  async function handleResetTestData() {
    if (!confirm('This will reset all test data. Are you sure?')) return;
    
    toast.info('Test data reset is not yet implemented.');
  }

  function getRoleColor(role) {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'project_manager': return '#8b5cf6';
      case 'team_member': return '#3b82f6';
      default: return '#64748b';
    }
  }

  function getRoleLabel(role) {
    switch (role) {
      case 'admin': return 'Admin';
      case 'project_manager': return 'Project Manager';
      case 'team_member': return 'Team Member';
      default: return 'Viewer';
    }
  }

  if (loading) return <TablePageSkeleton />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <SettingsIcon size={28} />
          <div>
            <h1>Settings</h1>
            <p>Manage your account and application settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: activeTab === 'profile' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#64748b',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}
        >
          <User size={18} /> Profile
        </button>
        <button 
          onClick={() => setActiveTab('preferences')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: activeTab === 'preferences' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'preferences' ? 'white' : '#64748b',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}
        >
          <Bell size={18} /> Preferences
        </button>
        {userRole === 'admin' && (
          <>
            <button 
              onClick={() => setActiveTab('users')}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                backgroundColor: activeTab === 'users' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'users' ? 'white' : '#64748b',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}
            >
              <Shield size={18} /> User Management
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                backgroundColor: activeTab === 'data' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'data' ? 'white' : '#64748b',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}
            >
              <Database size={18} /> Data Management
            </button>
          </>
        )}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Your Profile</h3>
          
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={profile.email}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Email cannot be changed here</span>
            </div>
            
            <div>
              <label className="form-label">Role</label>
              <div style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: `${getRoleColor(profile.role)}15`,
                border: `1px solid ${getRoleColor(profile.role)}`,
                borderRadius: '8px',
                color: getRoleColor(profile.role),
                fontWeight: '500'
              }}>
                {getRoleLabel(profile.role)}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Role is assigned by administrators</span>
            </div>
            
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ marginTop: '0.5rem' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Display Preferences</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Test Data Toggle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Show Test Data</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Display test users, timesheets, and expenses in the application
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTestUsers(!showTestUsers);
                  toast.info(`Test data ${!showTestUsers ? 'shown' : 'hidden'}`);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: showTestUsers ? '#10b981' : '#e2e8f0',
                  color: showTestUsers ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {showTestUsers ? <Eye size={16} /> : <EyeOff size={16} />}
                {showTestUsers ? 'Visible' : 'Hidden'}
              </button>
            </div>
            
            {/* Future preferences can go here */}
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontWeight: '500', color: '#1e40af', marginBottom: '0.25rem' }}>
                More preferences coming soon
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>
                Notification settings, theme options, and more will be available in future updates.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab (Admin Only) */}
      {activeTab === 'users' && userRole === 'admin' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>User Management</h3>
          
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        backgroundColor: getRoleColor(user.role),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{user.full_name || 'No name set'}</div>
                        {user.id === currentUser?.id && (
                          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>(You)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{user.email}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: `${getRoleColor(user.role)}15`,
                      color: getRoleColor(user.role),
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.id !== currentUser?.id ? (
                      <select 
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="team_member">Team Member</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Cannot change own role</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Data Management Tab (Admin Only) */}
      {activeTab === 'data' && userRole === 'admin' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Data Management</h3>
          
          {/* Project Info */}
          {project && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Current Project</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Reference</div>
                  <div style={{ fontWeight: '600' }}>{project.reference}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Name</div>
                  <div style={{ fontWeight: '600' }}>{project.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Budget</div>
                  <div style={{ fontWeight: '600' }}>£{(project.budget || 0).toLocaleString('en-GB')}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Danger Zone */}
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={20} style={{ color: '#dc2626' }} />
              <h4 style={{ margin: 0, color: '#dc2626' }}>Danger Zone</h4>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500', color: '#991b1b' }}>Reset Test Data</div>
                <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>
                  This will remove all test timesheets, expenses, and test user data.
                </div>
              </div>
              <button 
                className="btn" 
                onClick={handleResetTestData}
                style={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white',
                  border: 'none'
                }}
              >
                <RefreshCw size={16} /> Reset Test Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Info */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>Your Permissions</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          {userRole === 'admin' && (
            <>
              <li>Full access to all features and data</li>
              <li>Can manage user roles and permissions</li>
              <li>Can approve/reject all timesheets and expenses</li>
              <li>Can access data management tools</li>
            </>
          )}
          {userRole === 'project_manager' && (
            <>
              <li>Can view and manage all project data</li>
              <li>Can approve/reject timesheets and expenses</li>
              <li>Can add timesheets/expenses for any resource</li>
              <li>Cannot change user roles</li>
            </>
          )}
          {userRole === 'team_member' && (
            <>
              <li>Can submit your own timesheets and expenses</li>
              <li>Can edit your own draft entries</li>
              <li>Cannot approve/reject submissions</li>
              <li>View access to project reports</li>
            </>
          )}
          {userRole === 'viewer' && (
            <>
              <li>Read-only access to project data</li>
              <li>Cannot create or edit entries</li>
              <li>Contact an admin to upgrade your role</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
