import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  RefreshCw, 
  DollarSign, 
  Users, 
  Milestone as MilestoneIcon,
  AlertTriangle,
  Lock,
  Building2,
  Link2,
  PieChart
} from 'lucide-react';

export default function Margins() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [viewMode, setViewMode] = useState('summary'); // summary, by-resource, by-milestone, by-type

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
          
          // Only supplier_pm and admin can access this page
          if (!['admin', 'supplier_pm'].includes(profile.role)) {
            setLoading(false);
            return;
          }
        }
      }

      // Fetch resources
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('*')
        .order('name');
      
      if (resourcesData) setResources(resourcesData);

      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('milestone_ref');
      
      if (milestonesData) setMilestones(milestonesData);

      // Fetch timesheets (only Approved or Submitted)
      const { data: timesheetsData } = await supabase
        .from('timesheets')
        .select('*')
        .in('status', ['Approved', 'Submitted']);
      
      if (timesheetsData) setTimesheets(timesheetsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate margin
  const calculateMargin = (salePrice, costPrice) => {
    if (!salePrice || salePrice === 0) return { margin: 0, markup: 0, profit: 0 };
    const cost = costPrice || salePrice;
    const profit = salePrice - cost;
    const margin = (profit / salePrice) * 100;
    const markup = cost > 0 ? (profit / cost) * 100 : 0;
    return { margin, markup, profit };
  };

  // Get margin colour coding
  const getMarginStyle = (marginPercent) => {
    if (marginPercent >= 25) return { bg: '#dcfce7', color: '#166534', label: 'Good' };
    if (marginPercent >= 10) return { bg: '#fef3c7', color: '#92400e', label: 'Warning' };
    return { bg: '#fee2e2', color: '#dc2626', label: 'Low' };
  };

  // Calculate totals
  const totalSaleValue = resources.reduce((sum, r) => {
    return sum + ((r.daily_rate || 0) * (r.days_allocated || 0));
  }, 0);

  const totalCostValue = resources.reduce((sum, r) => {
    const costPrice = r.cost_price || r.daily_rate || 0;
    return sum + (costPrice * (r.days_allocated || 0));
  }, 0);

  const totalProfit = totalSaleValue - totalCostValue;
  const overallMargin = totalSaleValue > 0 ? (totalProfit / totalSaleValue) * 100 : 0;
  const overallMarkup = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0;

  // Calculate by resource type
  const internalResources = resources.filter(r => (r.resource_type || 'internal') === 'internal');
  const thirdPartyResources = resources.filter(r => r.resource_type === 'third_party');

  const internalSale = internalResources.reduce((sum, r) => sum + ((r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const internalCost = internalResources.reduce((sum, r) => sum + ((r.cost_price || r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const internalMargin = internalSale > 0 ? ((internalSale - internalCost) / internalSale) * 100 : 0;

  const thirdPartySale = thirdPartyResources.reduce((sum, r) => sum + ((r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const thirdPartyCost = thirdPartyResources.reduce((sum, r) => sum + ((r.cost_price || r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const thirdPartyMargin = thirdPartySale > 0 ? ((thirdPartySale - thirdPartyCost) / thirdPartySale) * 100 : 0;

  // Access check
  const canAccess = ['admin', 'supplier_pm'].includes(userRole);

  if (loading) {
    return <div className="loading">Loading margins data...</div>;
  }

  if (!canAccess) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Lock size={48} style={{ color: '#64748b', marginBottom: '1rem' }} />
          <h2>Access Restricted</h2>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            You don't have permission to view margin information.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            This page is only accessible to <strong>Supplier PM</strong> and <strong>Admin</strong> roles.
          </p>
          <p style={{ marginTop: '1rem' }}>
            Your current role: <strong style={{ textTransform: 'capitalize' }}>{userRole.replace('_', ' ')}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <TrendingUp size={28} />
          <div>
            <h1>Project Margins</h1>
            <p>Financial overview and margin analysis</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              border: '1px solid #d1d5db',
              backgroundColor: 'white'
            }}
          >
            <option value="summary">Summary View</option>
            <option value="by-resource">By Resource</option>
            <option value="by-type">By Resource Type</option>
          </select>
          <button 
            className="btn btn-secondary" 
            onClick={fetchInitialData}
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Sale Value</div>
          <div className="stat-value">£{totalSaleValue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">£{totalCostValue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value" style={{ color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
            £{totalProfit.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overall Margin</div>
          <div className="stat-value" style={{ 
            color: overallMargin >= 25 ? '#10b981' : overallMargin >= 10 ? '#f59e0b' : '#ef4444' 
          }}>
            {overallMargin.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {overallMarkup.toFixed(1)}% markup
          </div>
        </div>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <>
          {/* Margin Breakdown Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} />
              Margin Breakdown
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Internal Resources */}
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                borderLeft: '4px solid #2563eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Building2 size={20} style={{ color: '#2563eb' }} />
                  <h4 style={{ margin: 0 }}>Internal Resources</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Count</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{internalResources.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Sale Value</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>£{internalSale.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Cost</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>£{internalCost.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Margin</div>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700',
                      color: internalMargin >= 25 ? '#10b981' : internalMargin >= 10 ? '#f59e0b' : '#ef4444'
                    }}>
                      {internalMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Third-Party Resources */}
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: '#fffbeb', 
                borderRadius: '8px',
                borderLeft: '4px solid #d97706'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Link2 size={20} style={{ color: '#d97706' }} />
                  <h4 style={{ margin: 0 }}>Third-Party Partners</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Count</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{thirdPartyResources.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Sale Value</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>£{thirdPartySale.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Cost</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>£{thirdPartyCost.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Margin</div>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700',
                      color: thirdPartyMargin >= 25 ? '#10b981' : thirdPartyMargin >= 10 ? '#f59e0b' : '#ef4444'
                    }}>
                      {thirdPartyMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Summary */}
          <div className="card" style={{ 
            marginBottom: '1.5rem', 
            backgroundColor: '#f0fdf4', 
            borderLeft: '4px solid #10b981' 
          }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} />
              Profit Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>£{totalSaleValue.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Cost</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>£{totalCostValue.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Gross Profit</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                  £{totalProfit.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Margin %</div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: overallMargin >= 25 ? '#10b981' : overallMargin >= 10 ? '#f59e0b' : '#ef4444'
                }}>
                  {overallMargin.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Markup %</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {overallMarkup.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* By Resource View */}
      {viewMode === 'by-resource' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} />
            Margin by Resource
          </h3>
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Sale Rate</th>
                <th style={{ textAlign: 'right' }}>Cost Rate</th>
                <th style={{ textAlign: 'right' }}>Days</th>
                <th style={{ textAlign: 'right' }}>Total Sale</th>
                <th style={{ textAlign: 'right' }}>Total Cost</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
                <th style={{ textAlign: 'center' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => {
                const costPrice = resource.cost_price || resource.daily_rate || 0;
                const salePrice = resource.daily_rate || 0;
                const days = resource.days_allocated || 0;
                const totalSale = salePrice * days;
                const totalCost = costPrice * days;
                const profit = totalSale - totalCost;
                const { margin } = calculateMargin(salePrice, costPrice);
                const marginStyle = getMarginStyle(margin);
                const isThirdParty = resource.resource_type === 'third_party';

                return (
                  <tr key={resource.id}>
                    <td>
                      <strong>{resource.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{resource.resource_ref}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: isThirdParty ? '#fef3c7' : '#dbeafe',
                        color: isThirdParty ? '#92400e' : '#1e40af',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {isThirdParty ? <Link2 size={12} /> : <Building2 size={12} />}
                        {isThirdParty ? 'Third-Party' : 'Internal'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>{resource.role}</td>
                    <td style={{ textAlign: 'right' }}>£{salePrice.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>£{costPrice.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{days}</td>
                    <td style={{ textAlign: 'right' }}>£{totalSale.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>£{totalCost.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: profit >= 0 ? '#10b981' : '#ef4444' }}>
                      £{profit.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: marginStyle.bg,
                        color: marginStyle.color,
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        {margin < 10 && <AlertTriangle size={12} />}
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr style={{ fontWeight: '700', backgroundColor: '#f8fafc' }}>
                <td colSpan={5}>Totals</td>
                <td style={{ textAlign: 'right' }}>
                  {resources.reduce((sum, r) => sum + (r.days_allocated || 0), 0)}
                </td>
                <td style={{ textAlign: 'right' }}>£{totalSaleValue.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>£{totalCostValue.toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  £{totalProfit.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: getMarginStyle(overallMargin).bg,
                    color: getMarginStyle(overallMargin).color,
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}>
                    {overallMargin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* By Type View */}
      {viewMode === 'by-type' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Internal Resources */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} style={{ color: '#2563eb' }} />
              Internal Resources ({internalResources.length})
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th style={{ textAlign: 'right' }}>Sale</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th style={{ textAlign: 'center' }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {internalResources.map(resource => {
                  const costPrice = resource.cost_price || resource.daily_rate || 0;
                  const salePrice = resource.daily_rate || 0;
                  const { margin } = calculateMargin(salePrice, costPrice);
                  const marginStyle = getMarginStyle(margin);

                  return (
                    <tr key={resource.id}>
                      <td>
                        <strong>{resource.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{resource.role}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>£{salePrice}</td>
                      <td style={{ textAlign: 'right' }}>£{costPrice}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: marginStyle.bg,
                          color: marginStyle.color,
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: '700', backgroundColor: '#f0f9ff' }}>
                  <td>Total Internal</td>
                  <td style={{ textAlign: 'right' }}>£{internalSale.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>£{internalCost.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: getMarginStyle(internalMargin).bg,
                      color: getMarginStyle(internalMargin).color,
                      borderRadius: '4px'
                    }}>
                      {internalMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Third-Party Resources */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link2 size={20} style={{ color: '#d97706' }} />
              Third-Party Partners ({thirdPartyResources.length})
            </h3>
            {thirdPartyResources.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th style={{ textAlign: 'right' }}>Sale</th>
                    <th style={{ textAlign: 'right' }}>Cost</th>
                    <th style={{ textAlign: 'center' }}>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {thirdPartyResources.map(resource => {
                    const costPrice = resource.cost_price || resource.daily_rate || 0;
                    const salePrice = resource.daily_rate || 0;
                    const { margin } = calculateMargin(salePrice, costPrice);
                    const marginStyle = getMarginStyle(margin);

                    return (
                      <tr key={resource.id}>
                        <td>
                          <strong>{resource.name}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{resource.role}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>£{salePrice}</td>
                        <td style={{ textAlign: 'right' }}>£{costPrice}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: marginStyle.bg,
                            color: marginStyle.color,
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                          }}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: '700', backgroundColor: '#fffbeb' }}>
                    <td>Total Third-Party</td>
                    <td style={{ textAlign: 'right' }}>£{thirdPartySale.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>£{thirdPartyCost.toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: getMarginStyle(thirdPartyMargin).bg,
                        color: getMarginStyle(thirdPartyMargin).color,
                        borderRadius: '4px'
                      }}>
                        {thirdPartyMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#64748b',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                No third-party partners allocated to this project
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 Margin Calculations</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li><strong>Margin %</strong> = (Sale Price - Cost Price) ÷ Sale Price × 100</li>
          <li><strong>Markup %</strong> = (Sale Price - Cost Price) ÷ Cost Price × 100</li>
          <li><strong>Gross Profit</strong> = Total Sale Value - Total Cost</li>
          <li>Margins are calculated based on allocated days (not actual days worked)</li>
          <li>
            <strong>Colour coding:</strong>{' '}
            <span style={{ color: '#166534' }}>Green (≥25%)</span> |{' '}
            <span style={{ color: '#92400e' }}>Amber (10-25%)</span> |{' '}
            <span style={{ color: '#dc2626' }}>Red (&lt;10%)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
