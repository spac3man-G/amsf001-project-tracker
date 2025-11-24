import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Plus, Calendar, Save, X, Send, CheckCircle } from 'lucide-react';

export default function Timesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(new Date()));
  const [newEntry, setNewEntry] = useState({
    milestone_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    status: 'Draft'
  });

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  async function fetchData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          
          // Get resource record for this user
          const { data: resource } = await supabase
            .from('resources')
            .select('*')
            .eq('email', profile.email)
            .single();
          
          if (resource) {
            // Fetch timesheets for this resource
            const weekEnd = new Date(selectedWeek);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const { data: timesheetData } = await supabase
              .from('timesheets')
              .select(`
                *,
                milestones (
                  milestone_ref,
                  name
                )
              `)
              .eq('resource_id', resource.id)
              .gte('date', selectedWeek)
              .lte('date', weekEnd.toISOString().split('T')[0])
              .order('date');
            
            setTimesheets(timesheetData || []);
          }
        }
      }

      // Fetch milestones for dropdown
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('milestone_ref');
      setMilestones(milestonesData || []);

      // Fetch all resources if admin
      if (userRole === 'admin') {
        const { data: resourcesData } = await supabase
          .from('resources')
          .select('*')
          .order('name');
        setResources(resourcesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry() {
    try {
      // Get resource ID for current user
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', currentUser.id)
        .single();

      const { data: resource } = await supabase
        .from('resources')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (!resource) {
        alert('You are not set up as a resource. Please contact admin.');
        return;
      }

      const { error } = await supabase
        .from('timesheets')
        .insert([{
          ...newEntry,
          resource_id: resource.id,
          created_by: currentUser.id
        }]);

      if (error) throw error;

      await fetchData();
      setShowAddForm(false);
      setNewEntry({
        milestone_id: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
        status: 'Draft'
      });
      alert('Timesheet entry added successfully!');
    } catch (error) {
      console.error('Error adding timesheet:', error);
      alert('Failed to add timesheet entry');
    }
  }

  async function handleSubmitWeek() {
    try {
      const weekEnd = new Date(selectedWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', currentUser.id)
        .single();

      const { data: resource } = await supabase
        .from('resources')
        .select('id')
        .eq('email', profile.email)
        .single();

      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Submitted' })
        .eq('resource_id', resource.id)
        .eq('status', 'Draft')
        .gte('date', selectedWeek)
        .lte('date', weekEnd.toISOString().split('T')[0]);

      if (error) throw error;

      await fetchData();
      alert('Timesheet submitted for approval!');
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Failed to submit timesheet');
    }
  }

  async function handleApprove(id) {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error approving timesheet:', error);
      alert('Failed to approve timesheet');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const { error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      alert('Failed to delete timesheet');
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'badge-success';
      case 'Submitted': return 'badge-primary';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }

  const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const draftCount = timesheets.filter(t => t.status === 'Draft').length;

  if (loading) {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Timesheets</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <p>Loading timesheets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'viewer') {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Timesheets</h2>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h3>Contributor Access Required</h3>
            <p>You need contributor or admin access to submit timesheets.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{totalHours}</div>
          <div className="stat-label">Hours This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{draftCount}</div>
          <div className="stat-label">Draft Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{timesheets.filter(t => t.status === 'Submitted').length}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{timesheets.filter(t => t.status === 'Approved').length}</div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Week of {new Date(selectedWeek).toLocaleDateString()}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="week"
              value={selectedWeek.substring(0, 10)}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="input-field"
            />
            {draftCount > 0 && (
              <button 
                className="btn btn-primary"
                onClick={handleSubmitWeek}
              >
                <Send size={20} />
                Submit Week
              </button>
            )}
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} />
              Add Entry
            </button>
          </div>
        </div>

        {showAddForm && (
          <div style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add Timesheet Entry</h3>
            <div className="form-grid">
              <select
                className="input-field"
                value={newEntry.milestone_id}
                onChange={(e) => setNewEntry({...newEntry, milestone_id: e.target.value})}
              >
                <option value="">Select Milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.milestone_ref} - {m.name}
                  </option>
                ))}
              </select>
              <input
                className="input-field"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
              />
              <input
                className="input-field"
                type="number"
                step="0.5"
                min="0"
                max="12"
                placeholder="Hours"
                value={newEntry.hours}
                onChange={(e) => setNewEntry({...newEntry, hours: e.target.value})}
              />
              <input
                className="input-field"
                placeholder="Description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleAddEntry}>
                  <Save size={16} /> Save
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddForm(false)}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Milestone</th>
                <th>Hours</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>
                    {entry.milestones?.milestone_ref} - {entry.milestones?.name}
                  </td>
                  <td>{entry.hours}h</td>
                  <td>{entry.description}</td>
                  <td>
                    <span className={`badge ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {userRole === 'admin' && entry.status === 'Submitted' && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleApprove(entry.id)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {entry.status === 'Draft' && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {timesheets.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No timesheet entries for this week
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        
        .stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-light);
          margin-top: 0.25rem;
        }
        
        .btn-success {
          background: var(--success);
          color: white;
        }
        
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        
        .badge-danger {
          background: var(--danger);
          color: white;
        }
      `}</style>
    </div>
  );
}
