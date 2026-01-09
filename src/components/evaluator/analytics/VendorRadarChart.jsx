/**
 * VendorRadarChart Component
 *
 * Displays a radar/spider chart comparing multiple vendors across evaluation categories.
 * Useful for quick visual comparison of vendor strengths and weaknesses.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Hexagon, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './VendorRadarChart.css';

const VENDOR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

function VendorRadarChart({ evaluationProjectId, maxVendors = 5 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleVendors, setVisibleVendors] = useState({});

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getVendorRadarData(evaluationProjectId);

      // Transform data for Recharts RadarChart format
      // Each data point needs: { category: "Category Name", vendorId1: score1, vendorId2: score2, ... }
      const chartData = result.categories.map((categoryName, index) => {
        const dataPoint = { category: categoryName };
        result.vendors.forEach(vendor => {
          dataPoint[vendor.id] = vendor.scores[index] || 0;
        });
        return dataPoint;
      });

      // Calculate overall scores for each vendor
      const vendorsWithOverall = result.vendors.map(vendor => ({
        ...vendor,
        overallScore: vendor.scores.length > 0
          ? vendor.scores.reduce((sum, s) => sum + s, 0) / vendor.scores.length
          : 0
      }));

      // Limit to maxVendors
      const topVendors = vendorsWithOverall
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, maxVendors);

      setData({
        categories: result.categories,
        vendors: topVendors,
        chartData
      });

      // Initialize all vendors as visible
      const initialVisibility = {};
      topVendors.forEach(v => {
        initialVisibility[v.id] = true;
      });
      setVisibleVendors(initialVisibility);
    } catch (err) {
      console.error('Failed to load radar data:', err);
      setError('Failed to load vendor comparison data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId, maxVendors]);

  const toggleVendor = (vendorId) => {
    setVisibleVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  if (loading) {
    return (
      <div className="vendor-radar-chart loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading comparison chart...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vendor-radar-chart error">
        <AlertCircle size={24} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data || data.vendors.length === 0 || data.chartData.length === 0) {
    return (
      <div className="vendor-radar-chart empty">
        <Hexagon size={32} />
        <p>Not enough scoring data for comparison</p>
      </div>
    );
  }

  return (
    <div className="vendor-radar-chart">
      <div className="radar-header">
        <h3>
          <Hexagon size={18} />
          Vendor Comparison
        </h3>
        <div className="vendor-toggles">
          {data.vendors.map((vendor, index) => (
            <button
              key={vendor.id}
              className={`vendor-toggle ${visibleVendors[vendor.id] ? 'active' : ''}`}
              onClick={() => toggleVendor(vendor.id)}
              style={{
                '--vendor-color': VENDOR_COLORS[index % VENDOR_COLORS.length]
              }}
            >
              {visibleVendors[vendor.id] ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="vendor-toggle-name">{vendor.name}</span>
              <span className="vendor-toggle-score">{Math.round(vendor.overallScore)}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="radar-container">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data.chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickCount={5}
            />
            {data.vendors.map((vendor, index) => (
              visibleVendors[vendor.id] && (
                <Radar
                  key={vendor.id}
                  name={vendor.name}
                  dataKey={vendor.id}
                  stroke={VENDOR_COLORS[index % VENDOR_COLORS.length]}
                  fill={VENDOR_COLORS[index % VENDOR_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              )
            ))}
            <Tooltip content={<CustomTooltip vendors={data.vendors} />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => <span style={{ color: '#374151', fontSize: 12 }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="radar-summary">
        <div className="summary-title">Overall Rankings</div>
        <div className="ranking-list">
          {data.vendors
            .sort((a, b) => b.overallScore - a.overallScore)
            .map((vendor, index) => (
              <div key={vendor.id} className="ranking-item">
                <span className="rank">#{index + 1}</span>
                <span className="vendor-name">{vendor.name}</span>
                <span className="overall-score">{Math.round(vendor.overallScore)}%</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, vendors }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="radar-tooltip">
      <div className="tooltip-category">{label}</div>
      <div className="tooltip-scores">
        {payload.map((entry, index) => (
          <div key={entry.dataKey} className="tooltip-score-item">
            <span
              className="tooltip-color"
              style={{ backgroundColor: entry.color }}
            />
            <span className="tooltip-vendor">{entry.name}</span>
            <span className="tooltip-value">{Math.round(entry.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorRadarChart;
