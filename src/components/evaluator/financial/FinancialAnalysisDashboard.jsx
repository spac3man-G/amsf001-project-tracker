/**
 * Financial Analysis Dashboard
 *
 * Comprehensive TCO analysis, cost comparison, sensitivity analysis, and ROI.
 * Part of Evaluator Product Roadmap v1.0.x - Feature 0.4
 *
 * @version 1.0
 * @created 09 January 2026
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  PieChart,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  Play,
  Target,
  Clock,
  Users,
  Percent,
  Info,
} from 'lucide-react';
import {
  financialAnalysisService,
  COST_CATEGORIES,
  COST_CATEGORY_CONFIG,
  ASSUMPTION_CATEGORIES,
  ASSUMPTION_CATEGORY_CONFIG,
  ADJUSTMENT_TYPES,
  BENEFIT_CATEGORIES,
  BENEFIT_CATEGORY_CONFIG,
} from '../../../services/evaluator/financialAnalysis.service';
import './FinancialAnalysisDashboard.css';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const formatCurrency = (amount, decimals = 0) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

const StatCard = ({ icon: Icon, label, value, subValue, trend, color = 'primary' }) => (
  <div className={`financial-stat-card financial-stat-card--${color}`}>
    <div className="financial-stat-card__icon">
      <Icon size={20} />
    </div>
    <div className="financial-stat-card__content">
      <span className="financial-stat-card__label">{label}</span>
      <span className="financial-stat-card__value">{value}</span>
      {subValue && <span className="financial-stat-card__subvalue">{subValue}</span>}
      {trend !== undefined && (
        <span className={`financial-stat-card__trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {formatPercent(trend)}
        </span>
      )}
    </div>
  </div>
);

// ============================================================================
// TABS
// ============================================================================

const OverviewTab = ({ data, onCalculateTCO }) => {
  const { stats, tcoSummaries, costByCategory } = data;

  const categoryChartData = useMemo(() => {
    return Object.entries(costByCategory || {})
      .map(([category, amount]) => ({
        category,
        label: COST_CATEGORY_CONFIG[category]?.label || category,
        amount,
        color: COST_CATEGORY_CONFIG[category]?.color || '#64748b',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [costByCategory]);

  const totalCategoryAmount = categoryChartData.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="financial-overview">
      <div className="financial-overview__stats">
        <StatCard
          icon={DollarSign}
          label="Lowest TCO"
          value={stats.lowestTCO ? formatCurrency(stats.lowestTCO.amount) : '-'}
          subValue={stats.lowestTCO?.vendorName}
          color="success"
        />
        <StatCard
          icon={TrendingUp}
          label="TCO Spread"
          value={stats.tcoSpread ? formatCurrency(stats.tcoSpread) : '-'}
          subValue={stats.tcoSpreadPercent ? `${stats.tcoSpreadPercent.toFixed(1)}% range` : null}
          color="warning"
        />
        <StatCard
          icon={Target}
          label="Best ROI"
          value={stats.bestROI ? `${stats.bestROI.roiPercent.toFixed(0)}%` : '-'}
          subValue={stats.bestROI?.vendorName}
          color="primary"
        />
        <StatCard
          icon={Calculator}
          label="Vendors Analyzed"
          value={stats.tcoCalculated || 0}
          subValue={`${stats.totalCostEntries || 0} cost entries`}
          color="info"
        />
      </div>

      <div className="financial-overview__content">
        <div className="financial-overview__tco-ranking">
          <div className="financial-section-header">
            <h3>TCO Ranking</h3>
            <button className="btn btn--sm btn--primary" onClick={onCalculateTCO}>
              <RefreshCw size={14} />
              Recalculate All
            </button>
          </div>

          {tcoSummaries.length === 0 ? (
            <div className="financial-empty-state">
              <Calculator size={32} />
              <p>No TCO calculations yet</p>
              <span>Add cost breakdowns for vendors and calculate TCO</span>
            </div>
          ) : (
            <div className="tco-ranking-list">
              {tcoSummaries.map((tco, index) => (
                <div key={tco.id} className={`tco-ranking-item ${index === 0 ? 'tco-ranking-item--best' : ''}`}>
                  <div className="tco-ranking-item__rank">
                    {index === 0 ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : (
                      <span className="rank-number">{tco.tco_rank}</span>
                    )}
                  </div>
                  <div className="tco-ranking-item__vendor">
                    <span className="vendor-name">{tco.vendor?.vendor_name}</span>
                    <span className="vendor-years">{tco.tco_years}-year TCO</span>
                  </div>
                  <div className="tco-ranking-item__amount">
                    <span className="amount">{formatCurrency(tco.total_tco)}</span>
                    {tco.percent_vs_lowest > 0 && (
                      <span className="vs-lowest">+{tco.percent_vs_lowest.toFixed(1)}% vs lowest</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="financial-overview__cost-breakdown">
          <div className="financial-section-header">
            <h3>Cost by Category</h3>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="financial-empty-state">
              <PieChart size={32} />
              <p>No cost data</p>
            </div>
          ) : (
            <div className="cost-category-chart">
              {categoryChartData.map(cat => (
                <div key={cat.category} className="cost-category-bar">
                  <div className="cost-category-bar__header">
                    <span className="category-label">{cat.label}</span>
                    <span className="category-amount">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="cost-category-bar__track">
                    <div
                      className="cost-category-bar__fill"
                      style={{
                        width: `${(cat.amount / totalCategoryAmount) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <span className="cost-category-bar__percent">
                    {((cat.amount / totalCategoryAmount) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CostBreakdownTab = ({
  evaluationProjectId,
  vendors,
  costBreakdowns,
  onRefresh
}) => {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [loading, setLoading] = useState(false);

  const vendorCosts = useMemo(() => {
    const grouped = {};
    costBreakdowns.forEach(cost => {
      if (!grouped[cost.vendor_id]) {
        grouped[cost.vendor_id] = {
          vendorId: cost.vendor_id,
          vendorName: cost.vendor?.vendor_name || 'Unknown',
          costs: [],
          total: 0,
        };
      }
      grouped[cost.vendor_id].costs.push(cost);
      grouped[cost.vendor_id].total +=
        (parseFloat(cost.year_1_cost) || 0) +
        (parseFloat(cost.year_2_cost) || 0) +
        (parseFloat(cost.year_3_cost) || 0);
    });
    return Object.values(grouped);
  }, [costBreakdowns]);

  const handleSaveCost = async (costData) => {
    setLoading(true);
    try {
      if (editingCost) {
        await financialAnalysisService.updateCostBreakdown(editingCost.id, costData);
      } else {
        await financialAnalysisService.createCostBreakdown({
          evaluationProjectId,
          vendorId: selectedVendor,
          ...costData,
        });
      }
      setShowModal(false);
      setEditingCost(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCost = async (costId) => {
    if (!window.confirm('Delete this cost entry?')) return;
    try {
      await financialAnalysisService.deleteCostBreakdown(costId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting cost:', error);
    }
  };

  return (
    <div className="cost-breakdown-tab">
      <div className="cost-breakdown-tab__header">
        <h3>Cost Breakdown by Vendor</h3>
        <div className="cost-breakdown-tab__actions">
          <select
            value={selectedVendor || ''}
            onChange={(e) => setSelectedVendor(e.target.value || null)}
            className="form-select"
          >
            <option value="">Select vendor to add costs...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.vendor_name}</option>
            ))}
          </select>
          <button
            className="btn btn--primary"
            disabled={!selectedVendor}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add Cost
          </button>
        </div>
      </div>

      {vendorCosts.length === 0 ? (
        <div className="financial-empty-state">
          <DollarSign size={48} />
          <h4>No costs entered yet</h4>
          <p>Select a vendor and add cost breakdowns to calculate TCO</p>
        </div>
      ) : (
        <div className="vendor-costs-list">
          {vendorCosts.map(vendor => (
            <VendorCostCard
              key={vendor.vendorId}
              vendor={vendor}
              onEdit={(cost) => {
                setSelectedVendor(cost.vendor_id);
                setEditingCost(cost);
                setShowModal(true);
              }}
              onDelete={handleDeleteCost}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CostModal
          cost={editingCost}
          onSave={handleSaveCost}
          onClose={() => {
            setShowModal(false);
            setEditingCost(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

const VendorCostCard = ({ vendor, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const categoryTotals = useMemo(() => {
    const totals = {};
    vendor.costs.forEach(cost => {
      if (!totals[cost.cost_category]) {
        totals[cost.cost_category] = 0;
      }
      totals[cost.cost_category] +=
        (parseFloat(cost.year_1_cost) || 0) +
        (parseFloat(cost.year_2_cost) || 0) +
        (parseFloat(cost.year_3_cost) || 0);
    });
    return Object.entries(totals)
      .map(([cat, amount]) => ({ category: cat, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [vendor.costs]);

  return (
    <div className="vendor-cost-card">
      <div
        className="vendor-cost-card__header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="vendor-cost-card__toggle">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        <div className="vendor-cost-card__info">
          <h4>{vendor.vendorName}</h4>
          <span className="cost-count">{vendor.costs.length} cost entries</span>
        </div>
        <div className="vendor-cost-card__total">
          <span className="total-label">3-Year Total</span>
          <span className="total-amount">{formatCurrency(vendor.total)}</span>
        </div>
      </div>

      {expanded && (
        <div className="vendor-cost-card__body">
          <div className="cost-summary-pills">
            {categoryTotals.map(cat => (
              <span
                key={cat.category}
                className="cost-pill"
                style={{ borderColor: COST_CATEGORY_CONFIG[cat.category]?.color }}
              >
                {COST_CATEGORY_CONFIG[cat.category]?.label}: {formatCurrency(cat.amount)}
              </span>
            ))}
          </div>

          <table className="cost-details-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Year 1</th>
                <th>Year 2</th>
                <th>Year 3</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendor.costs.map(cost => (
                <tr key={cost.id}>
                  <td>
                    <span
                      className="category-badge"
                      style={{ backgroundColor: COST_CATEGORY_CONFIG[cost.cost_category]?.color }}
                    >
                      {COST_CATEGORY_CONFIG[cost.cost_category]?.label}
                    </span>
                  </td>
                  <td>{cost.cost_description || '-'}</td>
                  <td>{formatCurrency(cost.year_1_cost)}</td>
                  <td>{formatCurrency(cost.year_2_cost)}</td>
                  <td>{formatCurrency(cost.year_3_cost)}</td>
                  <td className="total-cell">
                    {formatCurrency(
                      (parseFloat(cost.year_1_cost) || 0) +
                      (parseFloat(cost.year_2_cost) || 0) +
                      (parseFloat(cost.year_3_cost) || 0)
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => onEdit(cost)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon btn-icon--danger"
                        onClick={() => onDelete(cost.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CostModal = ({ cost, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    costCategory: cost?.cost_category || COST_CATEGORIES.LICENSE,
    costDescription: cost?.cost_description || '',
    year1Cost: cost?.year_1_cost || 0,
    year2Cost: cost?.year_2_cost || 0,
    year3Cost: cost?.year_3_cost || 0,
    year4Cost: cost?.year_4_cost || 0,
    year5Cost: cost?.year_5_cost || 0,
    isRecurring: cost?.is_recurring || false,
    isEstimated: cost?.is_estimated !== false,
    notes: cost?.notes || '',
    source: cost?.source || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal financial-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{cost ? 'Edit Cost Entry' : 'Add Cost Entry'}</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.costCategory}
                onChange={(e) => setFormData({ ...formData, costCategory: e.target.value })}
                required
              >
                {Object.entries(COST_CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={formData.costDescription}
                onChange={(e) => setFormData({ ...formData, costDescription: e.target.value })}
                placeholder="e.g., Base license, Premium support"
              />
            </div>
          </div>

          <div className="form-row form-row--costs">
            <div className="form-group">
              <label>Year 1</label>
              <input
                type="number"
                value={formData.year1Cost}
                onChange={(e) => setFormData({ ...formData, year1Cost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Year 2</label>
              <input
                type="number"
                value={formData.year2Cost}
                onChange={(e) => setFormData({ ...formData, year2Cost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Year 3</label>
              <input
                type="number"
                value={formData.year3Cost}
                onChange={(e) => setFormData({ ...formData, year3Cost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-group--checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                Recurring cost
              </label>
            </div>
            <div className="form-group form-group--checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isEstimated}
                  onChange={(e) => setFormData({ ...formData, isEstimated: e.target.checked })}
                />
                Estimated (not confirmed)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., RFP Response, Vendor Quote, Negotiation"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TCOComparisonTab = ({ evaluationProjectId, tcoSummaries, vendors, onRefresh }) => {
  const [calculating, setCalculating] = useState(false);
  const [tcoYears, setTcoYears] = useState(3);
  const [totalUsers, setTotalUsers] = useState('');

  const handleCalculateAll = async () => {
    setCalculating(true);
    try {
      await financialAnalysisService.calculateAllTCO(evaluationProjectId, {
        tcoYears,
        totalUsers: totalUsers ? parseInt(totalUsers) : null,
      });
      onRefresh();
    } catch (error) {
      console.error('Error calculating TCO:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateSingle = async (vendorId) => {
    setCalculating(true);
    try {
      await financialAnalysisService.calculateTCO(evaluationProjectId, vendorId, {
        tcoYears,
        totalUsers: totalUsers ? parseInt(totalUsers) : null,
      });
      onRefresh();
    } catch (error) {
      console.error('Error calculating TCO:', error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="tco-comparison-tab">
      <div className="tco-comparison-tab__config">
        <div className="config-row">
          <div className="config-item">
            <label>TCO Period</label>
            <select value={tcoYears} onChange={(e) => setTcoYears(parseInt(e.target.value))}>
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
              <option value={3}>3 Years</option>
              <option value={4}>4 Years</option>
              <option value={5}>5 Years</option>
            </select>
          </div>
          <div className="config-item">
            <label>Total Users (optional)</label>
            <input
              type="number"
              value={totalUsers}
              onChange={(e) => setTotalUsers(e.target.value)}
              placeholder="For per-user cost"
              min="1"
            />
          </div>
          <button
            className="btn btn--primary"
            onClick={handleCalculateAll}
            disabled={calculating}
          >
            <Calculator size={16} />
            {calculating ? 'Calculating...' : 'Calculate All TCO'}
          </button>
        </div>
      </div>

      {tcoSummaries.length === 0 ? (
        <div className="financial-empty-state">
          <BarChart3 size={48} />
          <h4>No TCO data yet</h4>
          <p>Add cost breakdowns and calculate TCO to see comparisons</p>
        </div>
      ) : (
        <>
          <div className="tco-comparison-chart">
            {tcoSummaries.map((tco, index) => {
              const maxTCO = Math.max(...tcoSummaries.map(t => t.total_tco));
              const barWidth = (tco.total_tco / maxTCO) * 100;

              return (
                <div key={tco.id} className="tco-bar-row">
                  <div className="tco-bar-row__label">
                    <span className="rank">#{tco.tco_rank}</span>
                    <span className="vendor-name">{tco.vendor?.vendor_name}</span>
                  </div>
                  <div className="tco-bar-row__bar-container">
                    <div
                      className={`tco-bar-row__bar ${index === 0 ? 'tco-bar-row__bar--best' : ''}`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="bar-value">{formatCurrency(tco.total_tco)}</span>
                    </div>
                  </div>
                  <div className="tco-bar-row__meta">
                    {tco.percent_vs_lowest > 0 && (
                      <span className="vs-lowest">+{tco.percent_vs_lowest.toFixed(1)}%</span>
                    )}
                    {index === 0 && <span className="lowest-badge">Lowest</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tco-details-grid">
            {tcoSummaries.map(tco => (
              <div key={tco.id} className="tco-detail-card">
                <div className="tco-detail-card__header">
                  <h4>{tco.vendor?.vendor_name}</h4>
                  <span className={`rank-badge ${tco.tco_rank === 1 ? 'rank-badge--best' : ''}`}>
                    #{tco.tco_rank}
                  </span>
                </div>
                <div className="tco-detail-card__body">
                  <div className="tco-metric">
                    <span className="label">Total {tco.tco_years}-Year TCO</span>
                    <span className="value">{formatCurrency(tco.total_tco)}</span>
                  </div>
                  <div className="tco-yearly-breakdown">
                    <div className="yearly-item">
                      <span>Year 1</span>
                      <span>{formatCurrency(tco.year_1_total)}</span>
                    </div>
                    <div className="yearly-item">
                      <span>Year 2</span>
                      <span>{formatCurrency(tco.year_2_total)}</span>
                    </div>
                    <div className="yearly-item">
                      <span>Year 3</span>
                      <span>{formatCurrency(tco.year_3_total)}</span>
                    </div>
                  </div>
                  {tco.cost_per_user_per_month && (
                    <div className="tco-metric tco-metric--small">
                      <span className="label">Cost per user/month</span>
                      <span className="value">{formatCurrency(tco.cost_per_user_per_month, 2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SensitivityTab = ({ evaluationProjectId, scenarios, tcoSummaries, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [runningScenario, setRunningScenario] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSaveScenario = async (scenarioData) => {
    setLoading(true);
    try {
      if (editingScenario) {
        await financialAnalysisService.updateScenario(editingScenario.id, scenarioData);
      } else {
        await financialAnalysisService.createScenario({
          evaluationProjectId,
          ...scenarioData,
        });
      }
      setShowModal(false);
      setEditingScenario(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async (scenarioId) => {
    setRunningScenario(scenarioId);
    try {
      await financialAnalysisService.runSensitivityAnalysis(scenarioId);
      onRefresh();
    } catch (error) {
      console.error('Error running scenario:', error);
      alert(error.message);
    } finally {
      setRunningScenario(null);
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    if (!window.confirm('Delete this scenario?')) return;
    try {
      await financialAnalysisService.deleteScenario(scenarioId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting scenario:', error);
    }
  };

  return (
    <div className="sensitivity-tab">
      <div className="sensitivity-tab__header">
        <div className="header-info">
          <h3>Sensitivity Analysis</h3>
          <p>Model "what if" scenarios to understand how changes affect vendor rankings</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          New Scenario
        </button>
      </div>

      {scenarios.length === 0 ? (
        <div className="financial-empty-state">
          <TrendingUp size={48} />
          <h4>No scenarios created</h4>
          <p>Create scenarios to model different cost assumptions</p>
        </div>
      ) : (
        <div className="scenarios-list">
          {scenarios.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              tcoSummaries={tcoSummaries}
              running={runningScenario === scenario.id}
              onRun={() => handleRunScenario(scenario.id)}
              onEdit={() => {
                setEditingScenario(scenario);
                setShowModal(true);
              }}
              onDelete={() => handleDeleteScenario(scenario.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ScenarioModal
          scenario={editingScenario}
          onSave={handleSaveScenario}
          onClose={() => {
            setShowModal(false);
            setEditingScenario(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

const ScenarioCard = ({ scenario, tcoSummaries, running, onRun, onEdit, onDelete }) => {
  const results = scenario.results || {};
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className={`scenario-card ${scenario.is_baseline ? 'scenario-card--baseline' : ''}`}>
      <div className="scenario-card__header">
        <div className="scenario-info">
          <h4>
            {scenario.scenario_name}
            {scenario.is_baseline && <span className="baseline-badge">Baseline</span>}
          </h4>
          {scenario.scenario_description && (
            <p>{scenario.scenario_description}</p>
          )}
        </div>
        <div className="scenario-actions">
          <button
            className="btn btn--sm btn--primary"
            onClick={onRun}
            disabled={running}
          >
            <Play size={14} />
            {running ? 'Running...' : 'Run'}
          </button>
          <button className="btn-icon" onClick={onEdit}>
            <Edit2 size={14} />
          </button>
          <button className="btn-icon btn-icon--danger" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="scenario-card__adjustments">
        <span className="adjustments-label">Adjustments:</span>
        {(scenario.adjustments || []).map((adj, i) => (
          <span key={i} className="adjustment-chip">
            {adj.variable.replace(/_/g, ' ')}: {adj.adjustment_type === 'percent' ? `${adj.value}%` : formatCurrency(adj.value)}
          </span>
        ))}
        {(!scenario.adjustments || scenario.adjustments.length === 0) && (
          <span className="no-adjustments">No adjustments (baseline)</span>
        )}
      </div>

      {hasResults && (
        <div className="scenario-card__results">
          {scenario.ranking_changed && (
            <div className={`ranking-alert ${scenario.recommendation_changed ? 'ranking-alert--critical' : 'ranking-alert--warning'}`}>
              <AlertTriangle size={16} />
              {scenario.recommendation_changed
                ? 'Recommended vendor changes in this scenario!'
                : 'Vendor ranking changes in this scenario'
              }
            </div>
          )}

          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Baseline TCO</th>
                  <th>Adjusted TCO</th>
                  <th>Change</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results)
                  .sort((a, b) => a[1].new_rank - b[1].new_rank)
                  .map(([vendorId, result]) => {
                    const vendor = tcoSummaries.find(t => t.vendor_id === vendorId);
                    return (
                      <tr key={vendorId}>
                        <td>{vendor?.vendor?.vendor_name || 'Unknown'}</td>
                        <td>{formatCurrency(result.baseline_tco)}</td>
                        <td>{formatCurrency(result.adjusted_tco)}</td>
                        <td className={result.difference >= 0 ? 'negative' : 'positive'}>
                          {formatCurrency(result.difference)}
                        </td>
                        <td>
                          {result.rank_change !== 0 && (
                            <span className={`rank-change ${result.rank_change > 0 ? 'positive' : 'negative'}`}>
                              {result.rank_change > 0 ? '↑' : '↓'}{Math.abs(result.rank_change)}
                            </span>
                          )}
                          #{result.new_rank}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ScenarioModal = ({ scenario, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    scenarioName: scenario?.scenario_name || '',
    scenarioDescription: scenario?.scenario_description || '',
    isBaseline: scenario?.is_baseline || false,
    adjustments: scenario?.adjustments || [],
  });

  const addAdjustment = () => {
    setFormData({
      ...formData,
      adjustments: [
        ...formData.adjustments,
        { variable: 'implementation_cost', adjustment_type: 'percent', value: 0 },
      ],
    });
  };

  const updateAdjustment = (index, field, value) => {
    const updated = [...formData.adjustments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, adjustments: updated });
  };

  const removeAdjustment = (index) => {
    setFormData({
      ...formData,
      adjustments: formData.adjustments.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const variableOptions = [
    { value: 'implementation_cost', label: 'Implementation Cost' },
    { value: 'license_cost', label: 'License Cost' },
    { value: 'support_cost', label: 'Support Cost' },
    { value: 'training_cost', label: 'Training Cost' },
    { value: 'integration_cost', label: 'Integration Cost' },
    { value: 'infrastructure_cost', label: 'Infrastructure Cost' },
    { value: 'all_costs', label: 'All Costs' },
    { value: 'one_time_costs', label: 'One-Time Costs' },
    { value: 'recurring_costs', label: 'Recurring Costs' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal financial-modal financial-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{scenario ? 'Edit Scenario' : 'Create Scenario'}</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="form-group">
            <label>Scenario Name *</label>
            <input
              type="text"
              value={formData.scenarioName}
              onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })}
              placeholder="e.g., Implementation +20% Overrun"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.scenarioDescription}
              onChange={(e) => setFormData({ ...formData, scenarioDescription: e.target.value })}
              rows={2}
              placeholder="Describe this scenario..."
            />
          </div>

          <div className="form-group form-group--checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.isBaseline}
                onChange={(e) => setFormData({ ...formData, isBaseline: e.target.checked })}
              />
              Mark as baseline scenario
            </label>
          </div>

          <div className="adjustments-section">
            <div className="adjustments-header">
              <h4>Cost Adjustments</h4>
              <button type="button" className="btn btn--sm btn--secondary" onClick={addAdjustment}>
                <Plus size={14} />
                Add Adjustment
              </button>
            </div>

            {formData.adjustments.length === 0 ? (
              <p className="no-adjustments-msg">No adjustments - this will show baseline values</p>
            ) : (
              <div className="adjustments-list">
                {formData.adjustments.map((adj, index) => (
                  <div key={index} className="adjustment-row">
                    <select
                      value={adj.variable}
                      onChange={(e) => updateAdjustment(index, 'variable', e.target.value)}
                    >
                      {variableOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <select
                      value={adj.adjustment_type}
                      onChange={(e) => updateAdjustment(index, 'adjustment_type', e.target.value)}
                    >
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="multiplier">Multiplier</option>
                    </select>
                    <div className="value-input">
                      <input
                        type="number"
                        value={adj.value}
                        onChange={(e) => updateAdjustment(index, 'value', parseFloat(e.target.value) || 0)}
                        step={adj.adjustment_type === 'multiplier' ? '0.1' : '1'}
                      />
                      {adj.adjustment_type === 'percent' && <span className="unit">%</span>}
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      onClick={() => removeAdjustment(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ROITab = ({ evaluationProjectId, roiCalculations, tcoSummaries, vendors, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSaveROI = async (roiData) => {
    setLoading(true);
    try {
      await financialAnalysisService.calculateROI(evaluationProjectId, selectedVendor, roiData);
      setShowModal(false);
      setSelectedVendor(null);
      onRefresh();
    } catch (error) {
      console.error('Error calculating ROI:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="roi-tab">
      <div className="roi-tab__header">
        <div className="header-info">
          <h3>Return on Investment</h3>
          <p>Calculate projected benefits and ROI for each vendor</p>
        </div>
        <div className="header-actions">
          <select
            value={selectedVendor || ''}
            onChange={(e) => setSelectedVendor(e.target.value || null)}
            className="form-select"
          >
            <option value="">Select vendor...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.vendor_name}</option>
            ))}
          </select>
          <button
            className="btn btn--primary"
            disabled={!selectedVendor}
            onClick={() => setShowModal(true)}
          >
            <Calculator size={16} />
            Calculate ROI
          </button>
        </div>
      </div>

      {roiCalculations.length === 0 ? (
        <div className="financial-empty-state">
          <Target size={48} />
          <h4>No ROI calculations yet</h4>
          <p>Select a vendor and calculate projected ROI</p>
        </div>
      ) : (
        <div className="roi-cards-grid">
          {roiCalculations.map(roi => (
            <div key={roi.id} className="roi-card">
              <div className="roi-card__header">
                <h4>{roi.vendor?.vendor_name}</h4>
                <div className={`roi-badge ${roi.roi_percent >= 100 ? 'roi-badge--excellent' : roi.roi_percent >= 0 ? 'roi-badge--positive' : 'roi-badge--negative'}`}>
                  {roi.roi_percent.toFixed(0)}% ROI
                </div>
              </div>

              <div className="roi-card__metrics">
                <div className="roi-metric">
                  <DollarSign size={16} />
                  <div>
                    <span className="label">Total Benefits</span>
                    <span className="value">{formatCurrency(roi.total_benefits)}</span>
                  </div>
                </div>
                <div className="roi-metric">
                  <TrendingDown size={16} />
                  <div>
                    <span className="label">Total Costs (TCO)</span>
                    <span className="value">{formatCurrency(roi.total_costs)}</span>
                  </div>
                </div>
                <div className="roi-metric roi-metric--highlight">
                  <TrendingUp size={16} />
                  <div>
                    <span className="label">Net Benefit</span>
                    <span className={`value ${roi.net_benefit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(roi.net_benefit)}
                    </span>
                  </div>
                </div>
                {roi.payback_months && (
                  <div className="roi-metric">
                    <Clock size={16} />
                    <div>
                      <span className="label">Payback Period</span>
                      <span className="value">{roi.payback_months} months</span>
                    </div>
                  </div>
                )}
              </div>

              {roi.risk_adjustment_percent > 0 && (
                <div className="roi-card__risk-adjusted">
                  <Info size={14} />
                  <span>Risk-adjusted ROI ({roi.risk_adjustment_percent}% discount): {roi.risk_adjusted_roi.toFixed(0)}%</span>
                </div>
              )}

              <button
                className="btn btn--sm btn--secondary roi-card__edit"
                onClick={() => {
                  setSelectedVendor(roi.vendor_id);
                  setShowModal(true);
                }}
              >
                <Edit2 size={14} />
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedVendor && (
        <ROIModal
          vendorId={selectedVendor}
          existingROI={roiCalculations.find(r => r.vendor_id === selectedVendor)}
          tco={tcoSummaries.find(t => t.vendor_id === selectedVendor)}
          onSave={handleSaveROI}
          onClose={() => {
            setShowModal(false);
            setSelectedVendor(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

const ROIModal = ({ vendorId, existingROI, tco, onSave, onClose, loading }) => {
  const [benefits, setBenefits] = useState(
    existingROI?.benefit_breakdown || []
  );
  const [riskAdjustment, setRiskAdjustment] = useState(
    existingROI?.risk_adjustment_percent || 0
  );
  const [notes, setNotes] = useState(existingROI?.methodology_notes || '');

  const addBenefit = () => {
    setBenefits([
      ...benefits,
      {
        category: BENEFIT_CATEGORIES.EFFICIENCY,
        description: '',
        annual_value: 0,
      },
    ]);
  };

  const updateBenefit = (index, field, value) => {
    const updated = [...benefits];
    updated[index] = { ...updated[index], [field]: value };
    setBenefits(updated);
  };

  const removeBenefit = (index) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const totalAnnualBenefits = benefits.reduce(
    (sum, b) => sum + (parseFloat(b.annual_value) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      benefitBreakdown: benefits,
      riskAdjustmentPercent: riskAdjustment,
      methodologyNotes: notes,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal financial-modal financial-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Calculate ROI</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          {tco && (
            <div className="roi-tco-summary">
              <Info size={16} />
              <span>
                TCO for this vendor: <strong>{formatCurrency(tco.total_tco)}</strong> ({tco.tco_years}-year)
              </span>
            </div>
          )}

          <div className="benefits-section">
            <div className="benefits-header">
              <h4>Projected Benefits</h4>
              <button type="button" className="btn btn--sm btn--secondary" onClick={addBenefit}>
                <Plus size={14} />
                Add Benefit
              </button>
            </div>

            {benefits.length === 0 ? (
              <p className="no-benefits-msg">Add projected benefits to calculate ROI</p>
            ) : (
              <div className="benefits-list">
                {benefits.map((benefit, index) => (
                  <div key={index} className="benefit-row">
                    <select
                      value={benefit.category}
                      onChange={(e) => updateBenefit(index, 'category', e.target.value)}
                    >
                      {Object.entries(BENEFIT_CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={benefit.description}
                      onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    <div className="value-input">
                      <span className="currency">£</span>
                      <input
                        type="number"
                        value={benefit.annual_value}
                        onChange={(e) => updateBenefit(index, 'annual_value', parseFloat(e.target.value) || 0)}
                        placeholder="Annual value"
                        min="0"
                      />
                      <span className="period">/year</span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      onClick={() => removeBenefit(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <div className="benefits-total">
                  <span>Total Annual Benefits:</span>
                  <strong>{formatCurrency(totalAnnualBenefits)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Risk Adjustment (%)</label>
              <input
                type="number"
                value={riskAdjustment}
                onChange={(e) => setRiskAdjustment(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                placeholder="Discount for uncertainty"
              />
              <span className="form-help">Reduce ROI by this % to account for risk/uncertainty</span>
            </div>
          </div>

          <div className="form-group">
            <label>Methodology Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Document your assumptions and methodology..."
            />
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate ROI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FinancialAnalysisDashboard = ({ evaluationProjectId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, vendorsData] = await Promise.all([
        financialAnalysisService.getDashboardData(evaluationProjectId),
        supabase
          .from('vendors')
          .select('id, vendor_name')
          .eq('evaluation_project_id', evaluationProjectId)
          .order('vendor_name'),
      ]);

      setData(dashboardData);
      setVendors(vendorsData.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCalculateAllTCO = async () => {
    try {
      await financialAnalysisService.calculateAllTCO(evaluationProjectId);
      fetchData();
    } catch (err) {
      console.error('Error calculating TCO:', err);
    }
  };

  if (loading) {
    return (
      <div className="financial-dashboard financial-dashboard--loading">
        <RefreshCw className="spin" size={24} />
        <span>Loading financial analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="financial-dashboard financial-dashboard--error">
        <AlertTriangle size={24} />
        <span>Error loading data: {error}</span>
        <button className="btn btn--secondary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'costs', label: 'Cost Breakdown', icon: DollarSign },
    { id: 'tco', label: 'TCO Comparison', icon: BarChart3 },
    { id: 'sensitivity', label: 'Sensitivity', icon: TrendingUp },
    { id: 'roi', label: 'ROI', icon: Target },
  ];

  return (
    <div className="financial-dashboard">
      <div className="financial-dashboard__header">
        <h2>
          <Calculator size={24} />
          Financial Analysis
        </h2>
        <p>Total Cost of Ownership, cost comparison, and ROI analysis</p>
      </div>

      <div className="financial-dashboard__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="financial-dashboard__content">
        {activeTab === 'overview' && (
          <OverviewTab data={data} onCalculateTCO={handleCalculateAllTCO} />
        )}
        {activeTab === 'costs' && (
          <CostBreakdownTab
            evaluationProjectId={evaluationProjectId}
            vendors={vendors}
            costBreakdowns={data.costBreakdowns}
            onRefresh={fetchData}
          />
        )}
        {activeTab === 'tco' && (
          <TCOComparisonTab
            evaluationProjectId={evaluationProjectId}
            tcoSummaries={data.tcoSummaries}
            vendors={vendors}
            onRefresh={fetchData}
          />
        )}
        {activeTab === 'sensitivity' && (
          <SensitivityTab
            evaluationProjectId={evaluationProjectId}
            scenarios={data.scenarios}
            tcoSummaries={data.tcoSummaries}
            onRefresh={fetchData}
          />
        )}
        {activeTab === 'roi' && (
          <ROITab
            evaluationProjectId={evaluationProjectId}
            roiCalculations={data.roiCalculations}
            tcoSummaries={data.tcoSummaries}
            vendors={vendors}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
};

// Need to import supabase for vendors query
import { supabase } from '../../../lib/supabase';

export default FinancialAnalysisDashboard;
