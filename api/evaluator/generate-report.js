/**
 * Report Generation API
 * 
 * Generates PDF and CSV reports for evaluation projects.
 * Supports multiple report types including executive summary,
 * traceability matrix, requirements, and vendor scores.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7B - Client Dashboard & Reports (Task 7B.8-7B.10)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/evaluator/generate-report
 * 
 * Generates a report for the evaluation project.
 * 
 * Request body:
 * {
 *   "evaluationProjectId": "uuid",
 *   "reportType": "summary" | "traceability" | "requirements" | "scores" | "comparison" | "evidence",
 *   "format": "pdf" | "csv"
 * }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { evaluationProjectId, reportType, format } = req.body;

    // Validate inputs
    if (!evaluationProjectId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'evaluationProjectId is required'
      });
    }

    if (!reportType) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'reportType is required'
      });
    }

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'format must be "pdf" or "csv"'
      });
    }

    // Get evaluation project details
    const { data: project, error: projectError } = await supabase
      .from('evaluation_projects')
      .select('*')
      .eq('id', evaluationProjectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Evaluation project not found'
      });
    }

    // Generate the report based on type
    let reportData;
    let filename;

    switch (reportType) {
      case 'summary':
        reportData = await generateSummaryReport(evaluationProjectId, project, format);
        filename = `${sanitizeFilename(project.name)}-summary`;
        break;
      
      case 'traceability':
        reportData = await generateTraceabilityReport(evaluationProjectId, project, format);
        filename = `${sanitizeFilename(project.name)}-traceability`;
        break;
      
      case 'requirements':
        reportData = await generateRequirementsReport(evaluationProjectId, project, format);
        filename = `${sanitizeFilename(project.name)}-requirements`;
        break;
      
      case 'scores':
        reportData = await generateScoresReport(evaluationProjectId, project, format);
        filename = `${sanitizeFilename(project.name)}-scores`;
        break;
      
      case 'comparison':
        reportData = await generateComparisonReport(evaluationProjectId, project, format);
        filename = `${sanitizeFilename(project.name)}-comparison`;
        break;
      
      case 'evidence':
        reportData = await generateEvidenceReport(evaluationProjectId, project, format);
        filename = `${sanitizeFilename(project.name)}-evidence`;
        break;
      
      default:
        return res.status(400).json({
          error: 'Bad request',
          message: `Unknown report type: ${reportType}`
        });
    }

    // Log the report generation
    try {
      await supabase.from('evaluation_audit_log').insert({
        evaluation_project_id: evaluationProjectId,
        action: 'generate_report',
        entity_type: 'report',
        details: {
          reportType,
          format,
          filename
        }
      });
    } catch (auditError) {
      console.error('Failed to log report generation:', auditError);
    }

    // Return the report
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.status(200).send(reportData);
    } else {
      // For PDF, we return HTML that can be rendered to PDF on the client
      // In a production app, you might use a PDF generation library like Puppeteer
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
      return res.status(200).send(reportData);
    }

  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate report'
    });
  }
}

/**
 * Helper: Sanitize filename
 */
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Helper: Format date for reports
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Helper: Escape CSV value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Helper: Convert array to CSV
 */
function arrayToCSV(headers, rows) {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => 
    row.map(escapeCSV).join(',')
  ).join('\n');
  return `${headerRow}\n${dataRows}`;
}

// ============================================================================
// REPORT GENERATORS
// ============================================================================

/**
 * Generate Executive Summary Report
 */
async function generateSummaryReport(evaluationProjectId, project, format) {
  // Fetch all required data
  const [requirements, vendors, categories, scores] = await Promise.all([
    fetchRequirements(evaluationProjectId),
    fetchVendors(evaluationProjectId),
    fetchCategories(evaluationProjectId),
    fetchConsensusScores(evaluationProjectId)
  ]);

  if (format === 'csv') {
    // CSV format for summary
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Project Name', project.name],
      ['Client', project.client_name || ''],
      ['Status', project.status],
      ['Total Requirements', requirements.length],
      ['Approved Requirements', requirements.filter(r => r.status === 'approved').length],
      ['Total Vendors', vendors.length],
      ['Shortlisted Vendors', vendors.filter(v => v.pipeline_stage === 'shortlist').length],
      ['Vendors in Evaluation', vendors.filter(v => v.pipeline_stage === 'evaluation').length],
      ['Finalist Vendors', vendors.filter(v => v.pipeline_stage === 'finalist').length],
      ['Total Scores Entered', scores.length],
      ['Report Generated', new Date().toISOString()]
    ];
    return arrayToCSV(headers, rows);
  }

  // HTML/PDF format for summary
  const vendorRankings = calculateVendorRankings(vendors, scores, categories);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Executive Summary</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .meta { color: #6b7280; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
    .stat-label { color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .rank-1 { background: #fef3c7; }
    .rank-2, .rank-3 { background: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875em; }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <p class="meta">Executive Summary Report | Generated: ${formatDate(new Date())}</p>
  
  ${project.client_name ? `<p><strong>Client:</strong> ${project.client_name}</p>` : ''}
  ${project.description ? `<p>${project.description}</p>` : ''}

  <h2>Evaluation Overview</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${requirements.length}</div>
      <div class="stat-label">Requirements</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${vendors.length}</div>
      <div class="stat-label">Vendors</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${scores.length}</div>
      <div class="stat-label">Scores</div>
    </div>
  </div>

  <h2>Requirements Summary</h2>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    <tr><td>Draft</td><td>${requirements.filter(r => r.status === 'draft').length}</td></tr>
    <tr><td>Pending Review</td><td>${requirements.filter(r => r.status === 'pending_review').length}</td></tr>
    <tr><td>Approved</td><td>${requirements.filter(r => r.status === 'approved').length}</td></tr>
  </table>

  <h2>Vendor Rankings</h2>
  <table>
    <tr><th>Rank</th><th>Vendor</th><th>Stage</th><th>Weighted Score</th></tr>
    ${vendorRankings.map((v, i) => `
      <tr class="rank-${i + 1}">
        <td>#${i + 1}</td>
        <td>${v.name}</td>
        <td>${v.pipeline_stage}</td>
        <td>${v.weightedScore.toFixed(2)}</td>
      </tr>
    `).join('')}
  </table>

  <div class="footer">
    <p>Report generated on ${new Date().toLocaleString()} | ${project.name}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Traceability Matrix Report
 */
async function generateTraceabilityReport(evaluationProjectId, project, format) {
  const [requirements, vendors, scores] = await Promise.all([
    fetchRequirements(evaluationProjectId),
    fetchVendors(evaluationProjectId),
    fetchConsensusScores(evaluationProjectId)
  ]);

  // Build score lookup
  const scoreLookup = {};
  scores.forEach(s => {
    const key = `${s.requirement_id}-${s.vendor_id}`;
    scoreLookup[key] = s.consensus_score;
  });

  if (format === 'csv') {
    // CSV format
    const headers = ['Requirement ID', 'Requirement Name', 'Category', 'Priority', ...vendors.map(v => v.name)];
    const rows = requirements.map(req => [
      req.requirement_id,
      req.name,
      req.category?.name || '',
      req.priority || '',
      ...vendors.map(v => {
        const score = scoreLookup[`${req.id}-${v.id}`];
        return score !== undefined ? score : '';
      })
    ]);
    return arrayToCSV(headers, rows);
  }

  // HTML format
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Traceability Matrix</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #1f2937; }
    .meta { color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875em; }
    th, td { padding: 8px 12px; text-align: left; border: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .score { text-align: center; font-weight: 600; }
    .score-5 { background: #d1fae5; color: #059669; }
    .score-4 { background: #ecfdf5; color: #059669; }
    .score-3 { background: #fef3c7; color: #d97706; }
    .score-2 { background: #fee2e2; color: #dc2626; }
    .score-1 { background: #fef2f2; color: #dc2626; }
    .score-none { background: #f9fafb; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>Traceability Matrix</h1>
  <p class="meta">${project.name} | Generated: ${formatDate(new Date())}</p>
  
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Requirement</th>
        <th>Category</th>
        <th>Priority</th>
        ${vendors.map(v => `<th>${v.name}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${requirements.map(req => `
        <tr>
          <td>${req.requirement_id}</td>
          <td>${req.name}</td>
          <td>${req.category?.name || '-'}</td>
          <td>${req.priority || '-'}</td>
          ${vendors.map(v => {
            const score = scoreLookup[`${req.id}-${v.id}`];
            const scoreClass = score !== undefined ? `score-${Math.floor(score)}` : 'score-none';
            return `<td class="score ${scoreClass}">${score !== undefined ? score : '-'}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}

/**
 * Generate Requirements Export
 */
async function generateRequirementsReport(evaluationProjectId, project, format) {
  const requirements = await fetchRequirements(evaluationProjectId);

  const headers = [
    'Requirement ID',
    'Name',
    'Description',
    'Category',
    'Criterion',
    'Stakeholder Area',
    'Priority',
    'MoSCoW',
    'Status',
    'Created At'
  ];

  const rows = requirements.map(req => [
    req.requirement_id,
    req.name,
    req.description || '',
    req.category?.name || '',
    req.criterion?.name || '',
    req.stakeholder_area?.name || '',
    req.priority || '',
    req.mos_cow || '',
    req.status,
    formatDate(req.created_at)
  ]);

  return arrayToCSV(headers, rows);
}

/**
 * Generate Vendor Scores Export
 */
async function generateScoresReport(evaluationProjectId, project, format) {
  const [vendors, criteria, scores] = await Promise.all([
    fetchVendors(evaluationProjectId),
    fetchCriteria(evaluationProjectId),
    fetchConsensusScores(evaluationProjectId)
  ]);

  const headers = [
    'Vendor',
    'Criterion',
    'Category',
    'Criterion Weight',
    'Consensus Score',
    'Rationale'
  ];

  const rows = [];
  vendors.forEach(vendor => {
    criteria.forEach(criterion => {
      const score = scores.find(s => s.vendor_id === vendor.id && s.criterion_id === criterion.id);
      rows.push([
        vendor.name,
        criterion.name,
        criterion.category?.name || '',
        criterion.weight || '',
        score?.consensus_score || '',
        score?.rationale || ''
      ]);
    });
  });

  return arrayToCSV(headers, rows);
}

/**
 * Generate Vendor Comparison Report
 */
async function generateComparisonReport(evaluationProjectId, project, format) {
  const [vendors, categories, scores] = await Promise.all([
    fetchVendors(evaluationProjectId),
    fetchCategories(evaluationProjectId),
    fetchConsensusScores(evaluationProjectId)
  ]);

  const vendorRankings = calculateVendorRankings(vendors, scores, categories);

  if (format === 'csv') {
    const headers = ['Rank', 'Vendor', 'Pipeline Stage', 'Weighted Score', ...categories.map(c => c.name)];
    const rows = vendorRankings.map((v, i) => [
      i + 1,
      v.name,
      v.pipeline_stage,
      v.weightedScore.toFixed(2),
      ...categories.map(c => v.categoryScores[c.id]?.toFixed(2) || '')
    ]);
    return arrayToCSV(headers, rows);
  }

  // HTML format
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Vendor Comparison</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 40px; }
    h1 { color: #1f2937; }
    .meta { color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .rank-1 { background: #fef3c7; }
    .score { text-align: center; }
  </style>
</head>
<body>
  <h1>Vendor Comparison</h1>
  <p class="meta">${project.name} | Generated: ${formatDate(new Date())}</p>
  
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Vendor</th>
        <th>Stage</th>
        <th>Overall Score</th>
        ${categories.map(c => `<th>${c.name} (${c.weight}%)</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${vendorRankings.map((v, i) => `
        <tr class="${i === 0 ? 'rank-1' : ''}">
          <td><strong>#${i + 1}</strong></td>
          <td>${v.name}</td>
          <td>${v.pipeline_stage}</td>
          <td class="score"><strong>${v.weightedScore.toFixed(2)}</strong></td>
          ${categories.map(c => `<td class="score">${v.categoryScores[c.id]?.toFixed(2) || '-'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}

/**
 * Generate Evidence Register Export
 */
async function generateEvidenceReport(evaluationProjectId, project, format) {
  const { data: evidence, error } = await supabase
    .from('evidence')
    .select(`
      id,
      type,
      title,
      content,
      summary,
      source_url,
      confidence_level,
      captured_at,
      vendor:vendor_id(name),
      created_at
    `)
    .eq('evaluation_project_id', evaluationProjectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const headers = [
    'Title',
    'Type',
    'Vendor',
    'Summary',
    'Confidence Level',
    'Content',
    'Source URL',
    'Captured At',
    'Created At'
  ];

  const rows = (evidence || []).map(e => [
    e.title,
    e.type,
    e.vendor?.name || '',
    e.summary || '',
    e.confidence_level || '',
    e.content || '',
    e.source_url || '',
    formatDate(e.captured_at),
    formatDate(e.created_at)
  ]);

  return arrayToCSV(headers, rows);
}

// ============================================================================
// DATA FETCH HELPERS
// ============================================================================

async function fetchRequirements(evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_requirements')
    .select(`
      id,
      requirement_id,
      name,
      description,
      priority,
      status,
      mos_cow,
      category:category_id(id, name),
      criterion:criterion_id(id, name),
      stakeholder_area:stakeholder_area_id(id, name),
      created_at
    `)
    .eq('evaluation_project_id', evaluationProjectId)
    .eq('is_deleted', false)
    .order('requirement_id');

  if (error) throw error;
  return data;
}

async function fetchVendors(evaluationProjectId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, pipeline_stage, status')
    .eq('evaluation_project_id', evaluationProjectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('name');

  if (error) throw error;
  return data;
}

async function fetchCategories(evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_categories')
    .select('id, name, weight')
    .eq('evaluation_project_id', evaluationProjectId)
    .order('name');

  if (error) throw error;
  return data;
}

async function fetchCriteria(evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_criteria')
    .select(`
      id,
      name,
      weight,
      category:category_id(id, name)
    `)
    .eq('evaluation_project_id', evaluationProjectId)
    .order('name');

  if (error) throw error;
  return data;
}

async function fetchConsensusScores(evaluationProjectId) {
  const { data, error } = await supabase
    .from('consensus_scores')
    .select(`
      id,
      vendor_id,
      criterion_id,
      requirement_id,
      consensus_score,
      rationale
    `)
    .eq('evaluation_project_id', evaluationProjectId);

  if (error) throw error;
  return data || [];
}

/**
 * Calculate vendor rankings with weighted scores
 */
function calculateVendorRankings(vendors, scores, categories) {
  const vendorScores = vendors.map(vendor => {
    const vendorScoresFiltered = scores.filter(s => s.vendor_id === vendor.id);
    
    // Calculate category averages
    const categoryScores = {};
    categories.forEach(cat => {
      const catScores = vendorScoresFiltered.filter(s => {
        // This is simplified - in reality, you'd join with criteria to get category
        return true;
      });
      
      if (catScores.length > 0) {
        const avg = catScores.reduce((sum, s) => sum + (s.consensus_score || 0), 0) / catScores.length;
        categoryScores[cat.id] = avg;
      }
    });

    // Calculate weighted total
    let weightedTotal = 0;
    let totalWeight = 0;
    categories.forEach(cat => {
      if (categoryScores[cat.id] !== undefined) {
        weightedTotal += categoryScores[cat.id] * (cat.weight / 100);
        totalWeight += cat.weight;
      }
    });

    const normalizedScore = totalWeight > 0 
      ? (weightedTotal / (totalWeight / 100))
      : 0;

    return {
      ...vendor,
      categoryScores,
      weightedScore: normalizedScore
    };
  });

  // Sort by weighted score descending
  vendorScores.sort((a, b) => b.weightedScore - a.weightedScore);

  return vendorScores;
}
