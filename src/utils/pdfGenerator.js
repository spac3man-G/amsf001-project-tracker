/**
 * PDF Generator Utility
 * 
 * Provides functions to generate PDF reports and invoices for the AMSF001 Project Tracker.
 * Uses jspdf and jspdf-autotable for PDF generation.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Company Details
  supplier: {
    name: 'JT (Jersey) Limited',
    address: ['JT House', 'PO Box 53', 'St Helier', 'Jersey JE4 8PB'],
    phone: '+44 1534 882882',
    email: 'business@jtglobal.com',
    website: 'www.jtglobal.com'
  },
  customer: {
    name: 'Government of Jersey',
    department: 'Digital Jersey',
    address: ['19-21 Broad Street', 'St Helier', 'Jersey JE2 3RR']
  },
  project: {
    name: 'AMSF001 - Network Standards and Design Architectural Services',
    reference: 'AMSF001'
  },
  // PDF Styling
  colors: {
    primary: [16, 185, 129],      // Emerald green
    secondary: [100, 116, 139],   // Slate
    header: [15, 23, 42],         // Dark slate
    success: [22, 163, 74],       // Green
    warning: [234, 179, 8],       // Amber
    danger: [220, 38, 38],        // Red
    light: [248, 250, 252],       // Light background
    border: [226, 232, 240]       // Border color
  },
  fonts: {
    title: 18,
    subtitle: 14,
    heading: 12,
    body: 10,
    small: 8
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusColor(status) {
  const statusColors = {
    'Approved': CONFIG.colors.success,
    'Validated': CONFIG.colors.success,
    'Completed': CONFIG.colors.success,
    'Submitted': CONFIG.colors.warning,
    'Pending': CONFIG.colors.warning,
    'In Progress': CONFIG.colors.warning,
    'Draft': CONFIG.colors.secondary,
    'Rejected': CONFIG.colors.danger,
    'Not Started': CONFIG.colors.secondary
  };
  return statusColors[status] || CONFIG.colors.secondary;
}

// ============================================
// PDF HEADER/FOOTER FUNCTIONS
// ============================================

function addHeader(doc, title, subtitle = null) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background
  doc.setFillColor(...CONFIG.colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(CONFIG.fonts.title);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(CONFIG.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 28);
  }
  
  // Project reference on right
  doc.setFontSize(CONFIG.fonts.small);
  doc.text(CONFIG.project.reference, pageWidth - 14, 18, { align: 'right' });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  return 45; // Return Y position after header
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...CONFIG.colors.border);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
    
    // Footer text
    doc.setFontSize(CONFIG.fonts.small);
    doc.setTextColor(...CONFIG.colors.secondary);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, pageHeight - 12);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
    doc.text('AMSF001 Project Tracker', pageWidth / 2, pageHeight - 12, { align: 'center' });
  }
}

function addSection(doc, title, yPos) {
  doc.setFontSize(CONFIG.fonts.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CONFIG.colors.header);
  doc.text(title, 14, yPos);
  
  // Underline
  doc.setDrawColor(...CONFIG.colors.primary);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 2, 80, yPos + 2);
  
  return yPos + 10;
}

// ============================================
// REPORT GENERATORS
// ============================================

/**
 * Generate Project Summary Report
 */
export function generateProjectSummaryReport(data) {
  const { project, milestones, deliverables, resources, kpis } = data;
  const doc = new jsPDF();
  
  let yPos = addHeader(doc, 'Project Summary Report', `As of ${formatDate(new Date())}`);
  
  // Project Overview Section
  yPos = addSection(doc, 'Project Overview', yPos);
  
  doc.setFontSize(CONFIG.fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const projectInfo = [
    ['Project Name:', project?.name || CONFIG.project.name],
    ['Reference:', project?.reference || CONFIG.project.reference],
    ['Start Date:', formatDate(project?.start_date)],
    ['End Date:', formatDate(project?.end_date)],
    ['Total Budget:', formatCurrency(project?.total_budget)],
    ['PMO Budget:', formatCurrency(project?.pmo_budget)],
    ['Non-PMO Budget:', formatCurrency(project?.non_pmo_budget)]
  ];
  
  projectInfo.forEach(([label, value], index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos + (index * 6));
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos + (index * 6));
  });
  
  yPos += projectInfo.length * 6 + 10;
  
  // Milestones Summary
  yPos = addSection(doc, 'Milestones Summary', yPos);
  
  if (milestones && milestones.length > 0) {
    const milestoneData = milestones.map(m => [
      m.reference || '',
      m.name || '',
      formatDate(m.target_date),
      m.status || 'Not Started',
      formatCurrency(m.budget)
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Ref', 'Name', 'Target Date', 'Status', 'Budget']],
      body: milestoneData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.text('No milestones defined.', 14, yPos);
    yPos += 15;
  }
  
  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // KPI Summary
  yPos = addSection(doc, 'KPI Performance Summary', yPos);
  
  if (kpis && kpis.length > 0) {
    const kpiData = kpis.map(k => [
      k.reference || '',
      k.name || '',
      k.category || '',
      `${k.target || 90}%`,
      k.frequency || 'Monthly'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Ref', 'KPI Name', 'Category', 'Target', 'Frequency']],
      body: kpiData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 14, right: 14 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.text('No KPIs defined.', 14, yPos);
    yPos += 15;
  }
  
  // Resources Summary
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos = addSection(doc, 'Resource Allocation', yPos);
  
  if (resources && resources.length > 0) {
    const resourceData = resources.map(r => [
      r.name || '',
      r.role || '',
      r.resource_type === 'third_party' ? 'Third-Party' : 'Internal',
      `${r.days_allocated || 0} days`,
      formatCurrency(r.daily_rate)
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Name', 'Role', 'Type', 'Days Allocated', 'Daily Rate']],
      body: resourceData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 14, right: 14 }
    });
  } else {
    doc.text('No resources allocated.', 14, yPos);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate Timesheet Report
 */
export function generateTimesheetReport(data) {
  const { timesheets, resources, dateRange, summary } = data;
  const doc = new jsPDF();
  
  const subtitle = dateRange 
    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    : `As of ${formatDate(new Date())}`;
  
  let yPos = addHeader(doc, 'Timesheet Report', subtitle);
  
  // Summary Section
  yPos = addSection(doc, 'Summary', yPos);
  
  doc.setFontSize(CONFIG.fonts.body);
  doc.setFont('helvetica', 'normal');
  
  const summaryInfo = [
    ['Total Hours:', `${summary?.totalHours || 0} hours`],
    ['Total Days:', `${summary?.totalDays || 0} days`],
    ['Total Value:', formatCurrency(summary?.totalValue)],
    ['Approved:', `${summary?.approvedCount || 0} entries`],
    ['Pending:', `${summary?.pendingCount || 0} entries`]
  ];
  
  summaryInfo.forEach(([label, value], index) => {
    const xPos = index < 3 ? 14 : 100;
    const row = index < 3 ? index : index - 3;
    doc.setFont('helvetica', 'bold');
    doc.text(label, xPos, yPos + (row * 6));
    doc.setFont('helvetica', 'normal');
    doc.text(value, xPos + 35, yPos + (row * 6));
  });
  
  yPos += 25;
  
  // Timesheet Details
  yPos = addSection(doc, 'Timesheet Entries', yPos);
  
  if (timesheets && timesheets.length > 0) {
    const timesheetData = timesheets.map(t => [
      formatDate(t.date),
      t.resource_name || t.resources?.name || 'Unknown',
      t.deliverable_name || t.deliverables?.name || 'N/A',
      `${t.hours || 0}h`,
      t.status || 'Draft',
      formatCurrency(t.total_value || (t.hours / 8) * (t.daily_rate || 0))
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Resource', 'Deliverable', 'Hours', 'Status', 'Value']],
      body: timesheetData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 45 },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 25 },
        5: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        if (data.column.index === 4 && data.section === 'body') {
          const status = data.cell.raw;
          if (status === 'Approved') {
            data.cell.styles.textColor = CONFIG.colors.success;
          } else if (status === 'Submitted') {
            data.cell.styles.textColor = CONFIG.colors.warning;
          } else if (status === 'Rejected') {
            data.cell.styles.textColor = CONFIG.colors.danger;
          }
        }
      }
    });
  } else {
    doc.text('No timesheet entries found.', 14, yPos);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate Expense Report
 */
export function generateExpenseReport(data) {
  const { expenses, dateRange, summary } = data;
  const doc = new jsPDF();
  
  const subtitle = dateRange 
    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    : `As of ${formatDate(new Date())}`;
  
  let yPos = addHeader(doc, 'Expense Report', subtitle);
  
  // Summary Section
  yPos = addSection(doc, 'Summary', yPos);
  
  doc.setFontSize(CONFIG.fonts.body);
  doc.setFont('helvetica', 'normal');
  
  const summaryInfo = [
    ['Total Expenses:', formatCurrency(summary?.totalAmount)],
    ['Chargeable:', formatCurrency(summary?.chargeableAmount)],
    ['Non-Chargeable:', formatCurrency(summary?.nonChargeableAmount)],
    ['Approved:', `${summary?.approvedCount || 0} entries`],
    ['Pending:', `${summary?.pendingCount || 0} entries`]
  ];
  
  summaryInfo.forEach(([label, value], index) => {
    const xPos = index < 3 ? 14 : 100;
    const row = index < 3 ? index : index - 3;
    doc.setFont('helvetica', 'bold');
    doc.text(label, xPos, yPos + (row * 6));
    doc.setFont('helvetica', 'normal');
    doc.text(value, xPos + 40, yPos + (row * 6));
  });
  
  yPos += 25;
  
  // Expense Details
  yPos = addSection(doc, 'Expense Entries', yPos);
  
  if (expenses && expenses.length > 0) {
    const expenseData = expenses.map(e => [
      e.reference || '',
      formatDate(e.expense_date),
      e.category || '',
      e.resource_name || e.resources?.name || 'Unknown',
      e.chargeable_to_customer ? 'Yes' : 'No',
      e.status || 'Draft',
      formatCurrency(e.amount)
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Ref', 'Date', 'Category', 'Resource', 'Chargeable', 'Status', 'Amount']],
      body: expenseData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 35 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });
  } else {
    doc.text('No expense entries found.', 14, yPos);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate KPI Assessment Report
 */
export function generateKPIReport(data) {
  const { kpis, assessments, dateRange } = data;
  const doc = new jsPDF();
  
  let yPos = addHeader(doc, 'KPI Assessment Report', `As of ${formatDate(new Date())}`);
  
  // KPI Overview
  yPos = addSection(doc, 'KPI Overview', yPos);
  
  if (kpis && kpis.length > 0) {
    const kpiData = kpis.map(k => {
      const kpiAssessments = assessments?.filter(a => a.kpi_id === k.id) || [];
      const avgScore = kpiAssessments.length > 0
        ? (kpiAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / kpiAssessments.length).toFixed(1)
        : 'N/A';
      
      return [
        k.reference || '',
        k.name || '',
        k.category || '',
        `${k.target || 90}%`,
        avgScore === 'N/A' ? avgScore : `${avgScore}%`,
        kpiAssessments.length
      ];
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['Ref', 'KPI Name', 'Category', 'Target', 'Avg Score', 'Assessments']],
      body: kpiData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 14, right: 14 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.text('No KPIs defined.', 14, yPos);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate Customer Invoice
 */
export function generateCustomerInvoice(data) {
  const { 
    invoiceNumber, 
    invoiceDate, 
    dueDate,
    milestone, 
    deliverables, 
    timesheets,
    expenses,
    kpiScores
  } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  let yPos = addHeader(doc, 'INVOICE', `Invoice #: ${invoiceNumber || 'DRAFT'}`);
  
  // From/To Section
  doc.setFontSize(CONFIG.fonts.body);
  
  // From (Supplier)
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(CONFIG.supplier.name, 14, yPos + 6);
  CONFIG.supplier.address.forEach((line, i) => {
    doc.text(line, 14, yPos + 12 + (i * 5));
  });
  
  // To (Customer)
  doc.setFont('helvetica', 'bold');
  doc.text('To:', 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(CONFIG.customer.name, 110, yPos + 6);
  doc.text(CONFIG.customer.department, 110, yPos + 12);
  CONFIG.customer.address.forEach((line, i) => {
    doc.text(line, 110, yPos + 18 + (i * 5));
  });
  
  yPos += 45;
  
  // Invoice Details Box
  doc.setDrawColor(...CONFIG.colors.border);
  doc.setFillColor(...CONFIG.colors.light);
  doc.roundedRect(14, yPos, pageWidth - 28, 25, 2, 2, 'FD');
  
  doc.setFontSize(CONFIG.fonts.small);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', 20, yPos + 8);
  doc.text('Due Date:', 70, yPos + 8);
  doc.text('Project Ref:', 120, yPos + 8);
  doc.text('Milestone:', 160, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoiceDate || new Date()), 20, yPos + 16);
  doc.text(formatDate(dueDate), 70, yPos + 16);
  doc.text(CONFIG.project.reference, 120, yPos + 16);
  doc.text(milestone?.reference || 'N/A', 160, yPos + 16);
  
  yPos += 35;
  
  // Milestone Details
  if (milestone) {
    yPos = addSection(doc, `Milestone: ${milestone.name}`, yPos);
    
    doc.setFontSize(CONFIG.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.text(`Description: ${milestone.description || 'N/A'}`, 14, yPos);
    yPos += 10;
  }
  
  // Deliverables Table
  if (deliverables && deliverables.length > 0) {
    yPos = addSection(doc, 'Deliverables', yPos);
    
    const deliverableData = deliverables.map(d => [
      d.reference || '',
      d.name || '',
      d.status || '',
      formatCurrency(d.value || 0)
    ]);
    
    const deliverableTotal = deliverables.reduce((sum, d) => sum + (d.value || 0), 0);
    deliverableData.push(['', '', 'Subtotal:', formatCurrency(deliverableTotal)]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Ref', 'Deliverable', 'Status', 'Value']],
      body: deliverableData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        if (data.row.index === deliverableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = CONFIG.colors.light;
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Timesheets Summary
  if (timesheets && timesheets.length > 0) {
    yPos = addSection(doc, 'Professional Services', yPos);
    
    const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
    const totalDays = totalHours / 8;
    const totalValue = timesheets.reduce((sum, t) => sum + (t.total_value || 0), 0);
    
    const timesheetSummary = [
      ['Professional Services', `${totalDays.toFixed(1)} days (${totalHours} hours)`, formatCurrency(totalValue)]
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [['Description', 'Quantity', 'Amount']],
      body: timesheetSummary,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        2: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Expenses Summary
  if (expenses && expenses.length > 0) {
    const chargeableExpenses = expenses.filter(e => e.chargeable_to_customer);
    
    if (chargeableExpenses.length > 0) {
      yPos = addSection(doc, 'Chargeable Expenses', yPos);
      
      const expenseData = chargeableExpenses.map(e => [
        e.category || '',
        e.description || '',
        formatCurrency(e.amount)
      ]);
      
      const expenseTotal = chargeableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      expenseData.push(['', 'Subtotal:', formatCurrency(expenseTotal)]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Description', 'Amount']],
        body: expenseData,
        theme: 'striped',
        headStyles: { 
          fillColor: CONFIG.colors.primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'right' }
        },
        margin: { left: 14, right: 14 },
        didParseCell: function(data) {
          if (data.row.index === expenseData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = CONFIG.colors.light;
          }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    }
  }
  
  // Total Box
  const deliverableTotal = deliverables?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const timesheetTotal = timesheets?.reduce((sum, t) => sum + (t.total_value || 0), 0) || 0;
  const chargeableExpenseTotal = expenses?.filter(e => e.chargeable_to_customer).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const grandTotal = deliverableTotal + timesheetTotal + chargeableExpenseTotal;
  
  yPos += 5;
  doc.setFillColor(...CONFIG.colors.primary);
  doc.roundedRect(pageWidth - 90, yPos, 76, 20, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(CONFIG.fonts.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE:', pageWidth - 85, yPos + 8);
  doc.text(formatCurrency(grandTotal), pageWidth - 19, yPos + 8, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(CONFIG.fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment terms: 30 days from invoice date', pageWidth - 85, yPos + 16);
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate Third-Party Partner Invoice
 */
export function generatePartnerInvoice(data) {
  const { 
    partner,
    invoiceNumber, 
    invoiceDate,
    dateRange,
    timesheets,
    expenses
  } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  let yPos = addHeader(doc, 'PARTNER INVOICE SUMMARY', `For: ${partner?.name || 'Partner'}`);
  
  // Partner Details Section
  doc.setFontSize(CONFIG.fonts.body);
  
  // From (Us as customer to partner)
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice From:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(CONFIG.supplier.name, 14, yPos + 6);
  CONFIG.supplier.address.forEach((line, i) => {
    doc.text(line, 14, yPos + 12 + (i * 5));
  });
  
  // Partner Details
  doc.setFont('helvetica', 'bold');
  doc.text('Partner:', 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(partner?.name || 'Third-Party Partner', 110, yPos + 6);
  doc.text(`Role: ${partner?.role || 'Consultant'}`, 110, yPos + 12);
  doc.text(`Cost Rate: ${formatCurrency(partner?.cost_price || partner?.daily_rate)} / day`, 110, yPos + 18);
  
  yPos += 40;
  
  // Period Box
  doc.setDrawColor(...CONFIG.colors.border);
  doc.setFillColor(...CONFIG.colors.light);
  doc.roundedRect(14, yPos, pageWidth - 28, 20, 2, 2, 'FD');
  
  doc.setFontSize(CONFIG.fonts.small);
  doc.setFont('helvetica', 'bold');
  doc.text('Period:', 20, yPos + 8);
  doc.text('Invoice Date:', 90, yPos + 8);
  doc.text('Invoice #:', 150, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  const periodText = dateRange 
    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    : 'All time';
  doc.text(periodText, 20, yPos + 14);
  doc.text(formatDate(invoiceDate || new Date()), 90, yPos + 14);
  doc.text(invoiceNumber || 'DRAFT', 150, yPos + 14);
  
  yPos += 30;
  
  // Timesheets Detail
  if (timesheets && timesheets.length > 0) {
    yPos = addSection(doc, 'Time Worked', yPos);
    
    const costRate = partner?.cost_price || partner?.daily_rate || 0;
    
    const timesheetData = timesheets.map(t => {
      const days = (t.hours || 0) / 8;
      const cost = days * costRate;
      return [
        formatDate(t.date),
        t.deliverable_name || t.deliverables?.name || 'N/A',
        `${t.hours || 0}h`,
        days.toFixed(2),
        formatCurrency(cost)
      ];
    });
    
    const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
    const totalDays = totalHours / 8;
    const totalCost = totalDays * costRate;
    
    timesheetData.push(['', '', `${totalHours}h`, totalDays.toFixed(2), formatCurrency(totalCost)]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Deliverable', 'Hours', 'Days', 'Cost']],
      body: timesheetData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        if (data.row.index === timesheetData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = CONFIG.colors.light;
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Expenses Detail
  if (expenses && expenses.length > 0) {
    yPos = addSection(doc, 'Expenses', yPos);
    
    const expenseData = expenses.map(e => [
      formatDate(e.expense_date),
      e.category || '',
      e.description || '',
      formatCurrency(e.amount)
    ]);
    
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    expenseData.push(['', '', 'Total:', formatCurrency(expenseTotal)]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: expenseData,
      theme: 'striped',
      headStyles: { 
        fillColor: CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        if (data.row.index === expenseData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = CONFIG.colors.light;
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Total Summary Box
  const costRate = partner?.cost_price || partner?.daily_rate || 0;
  const totalHours = timesheets?.reduce((sum, t) => sum + (t.hours || 0), 0) || 0;
  const totalDays = totalHours / 8;
  const timesheetTotal = totalDays * costRate;
  const expenseTotal = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const grandTotal = timesheetTotal + expenseTotal;
  
  yPos += 5;
  doc.setFillColor(...CONFIG.colors.warning);
  doc.roundedRect(pageWidth - 100, yPos, 86, 30, 2, 2, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(CONFIG.fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.text(`Time: ${formatCurrency(timesheetTotal)}`, pageWidth - 95, yPos + 8);
  doc.text(`Expenses: ${formatCurrency(expenseTotal)}`, pageWidth - 95, yPos + 14);
  
  doc.setFontSize(CONFIG.fonts.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 95, yPos + 24);
  doc.text(formatCurrency(grandTotal), pageWidth - 19, yPos + 24, { align: 'right' });
  
  addFooter(doc);
  
  return doc;
}

// ============================================
// CSV EXPORT FUNCTIONS
// ============================================

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename, headers) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(cell).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
        ? `"${escaped}"`
        : escaped;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${formatDate(new Date()).replace(/\s/g, '_')}.csv`;
  link.click();
}

/**
 * Export timesheets to CSV
 */
export function exportTimesheetsCSV(timesheets) {
  const headers = ['Date', 'Resource', 'Deliverable', 'Hours', 'Status', 'Value'];
  const data = timesheets.map(t => [
    formatDate(t.date),
    t.resource_name || t.resources?.name || 'Unknown',
    t.deliverable_name || t.deliverables?.name || 'N/A',
    t.hours || 0,
    t.status || 'Draft',
    t.total_value || 0
  ]);
  
  exportToCSV(data, 'timesheets', headers);
}

/**
 * Export expenses to CSV
 */
export function exportExpensesCSV(expenses) {
  const headers = ['Reference', 'Date', 'Category', 'Resource', 'Description', 'Chargeable', 'Status', 'Amount'];
  const data = expenses.map(e => [
    e.reference || '',
    formatDate(e.expense_date),
    e.category || '',
    e.resource_name || e.resources?.name || 'Unknown',
    e.description || '',
    e.chargeable_to_customer ? 'Yes' : 'No',
    e.status || 'Draft',
    e.amount || 0
  ]);
  
  exportToCSV(data, 'expenses', headers);
}
