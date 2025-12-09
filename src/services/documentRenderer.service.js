/**
 * Document Renderer Service
 * 
 * Generic renderer that interprets template definitions and produces
 * output in various formats (HTML, DOCX, PDF).
 * 
 * This is the core engine that:
 * 1. Resolves data sources from templates
 * 2. Computes derived values
 * 3. Renders sections based on type
 * 4. Applies formatting and styles
 * 
 * @version 1.0
 * @created 9 December 2025
 * @see docs/DOCUMENT-TEMPLATES-SPECIFICATION.md
 */

// Supported output formats
export const RENDER_FORMAT = {
  HTML: 'html',
  DOCX: 'docx',
  PDF: 'pdf'
};

// Section types that the renderer understands
export const SECTION_TYPE = {
  HEADER: 'header',
  SECTION_TITLE: 'section_title',
  FIELD_ROW: 'field_row',
  TEXT_BLOCK: 'text_block',
  TABLE: 'table',
  SIGNATURE_BLOCK: 'signature_block',
  PAGE_BREAK: 'page_break'
};

export class DocumentRendererService {
  
  // ─────────────────────────────────────────────────────────────
  // Main Render Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Render a template to HTML
   * @param {Object} template - Template record with template_definition
   * @param {Object} data - Context data (variation, project, etc.)
   * @returns {Promise<{html: string, warnings: string[]}>}
   */
  async renderToHtml(template, data) {
    const warnings = [];
    const definition = template.template_definition;
    
    if (!definition || !definition.sections) {
      return { html: '<p>No template definition</p>', warnings: ['Missing template definition'] };
    }

    // Build context with computed values
    const context = this.buildContext(template, data);
    
    // Render each section
    const sectionsHtml = definition.sections.map((section, index) => {
      try {
        return this.renderSection(section, context, 'html', definition.styles);
      } catch (error) {
        warnings.push(`Section ${index + 1} (${section.type}): ${error.message}`);
        return `<!-- Error rendering section ${index + 1} -->`;
      }
    }).join('\n');

    // Wrap in document structure
    const html = this.wrapHtmlDocument(sectionsHtml, definition, template);

    return { html, warnings };
  }

  /**
   * Render a template to DOCX buffer
   * TODO: Phase 2 implementation
   */
  async renderToDocx(template, data) {
    throw new Error('DOCX rendering not yet implemented - Phase 2');
  }

  /**
   * Render a template to PDF buffer  
   * TODO: Phase 2 implementation
   */
  async renderToPdf(template, data) {
    throw new Error('PDF rendering not yet implemented - Phase 2');
  }

  // ─────────────────────────────────────────────────────────────
  // Context Building
  // ─────────────────────────────────────────────────────────────

  /**
   * Build the full context object for rendering
   */
  buildContext(template, data) {
    const context = {
      template: {
        logo_base64: template.logo_base64,
        primary_color: template.primary_color || '#8B0000',
        secondary_color: template.secondary_color || '#1a1a1a',
        font_family: template.font_family || 'Arial'
      },
      ...data
    };

    // Add computed values based on template type
    context.computed = this.computeDerivedValues(template.template_type, data);

    return context;
  }

  /**
   * Compute derived values not in raw data
   */
  computeDerivedValues(templateType, data) {
    const computed = {
      generated_date: new Date().toISOString()
    };

    if (templateType === 'variation_cr' && data.variation) {
      const v = data.variation;
      computed.total_cost_impact = v.cost_impact || 0;
      
      if (v.affected_milestones?.length > 0) {
        computed.total_days_impact = v.affected_milestones.reduce(
          (sum, m) => sum + (m.days_diff || 0), 0
        );
      }
    }

    return computed;
  }

  // ─────────────────────────────────────────────────────────────
  // Section Renderers
  // ─────────────────────────────────────────────────────────────

  /**
   * Route section to appropriate renderer
   */
  renderSection(section, context, format, styles) {
    switch (section.type) {
      case SECTION_TYPE.HEADER:
        return this.renderHeader(section, context, styles);
      case SECTION_TYPE.SECTION_TITLE:
        return this.renderSectionTitle(section, context, styles);
      case SECTION_TYPE.FIELD_ROW:
        return this.renderFieldRow(section, context, styles);
      case SECTION_TYPE.TEXT_BLOCK:
        return this.renderTextBlock(section, context, styles);
      case SECTION_TYPE.TABLE:
        return this.renderTable(section, context, styles);
      case SECTION_TYPE.SIGNATURE_BLOCK:
        return this.renderSignatureBlock(section, context, styles);
      case SECTION_TYPE.PAGE_BREAK:
        return this.renderPageBreak();
      default:
        return `<!-- Unknown section type: ${section.type} -->`;
    }
  }

  renderHeader(section, context, styles) {
    const logoHtml = section.logo?.source 
      ? `<img src="data:image/png;base64,${this.resolveSource(section.logo.source, context)}" 
             style="max-width: ${section.logo.width || 150}px;" alt="Logo" />`
      : '';
    
    const titleStyle = this.getStyleString(styles?.header_title);
    const subtitleStyle = this.getStyleString(styles?.header_subtitle);

    return `
      <div class="document-header" style="text-align: center; margin-bottom: 20px;">
        ${logoHtml}
        <h1 style="${titleStyle}">${section.title?.text || ''}</h1>
        ${section.subtitle ? `<p style="${subtitleStyle}">${section.subtitle.text}</p>` : ''}
      </div>
    `;
  }

  renderSectionTitle(section, context, styles) {
    const style = this.getStyleString(styles?.section_heading);
    const level = section.level || 1;
    const tag = level <= 2 ? `h${level + 1}` : 'h4';
    return `<${tag} style="${style}">${section.text}</${tag}>`;
  }

  renderFieldRow(section, context, styles) {
    if (!section.fields || section.fields.length === 0) return '';

    const fieldsHtml = section.fields.map(field => {
      const value = this.resolveSource(field.source, context);
      const formatted = this.formatValue(value, field.format, context);
      const width = field.width || `${100 / section.fields.length}%`;
      const fieldStyle = field.style ? this.getStyleString(styles?.[field.style]) : '';
      
      return `
        <div style="flex: 0 0 ${width}; padding: 8px;">
          <div style="font-size: 9px; font-weight: bold; color: #666;">${field.label}</div>
          <div style="font-size: 10px; ${fieldStyle}">${formatted || '—'}</div>
        </div>
      `;
    }).join('');

    return `<div style="display: flex; border: 1px solid #ddd; margin-bottom: 8px;">${fieldsHtml}</div>`;
  }

  renderTextBlock(section, context, styles) {
    const value = this.resolveSource(section.source, context);
    const style = this.getStyleString(styles?.text_block);
    
    return `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; font-weight: bold; color: #666; margin-bottom: 4px;">${section.label}</div>
        <div style="border: 1px solid #ddd; padding: 10px; min-height: 40px; ${style}">
          ${value || '<span style="color: #999;">Not specified</span>'}
        </div>
      </div>
    `;
  }

  renderTable(section, context, styles) {
    const data = this.resolveSource(section.source, context);
    if (!data || !Array.isArray(data) || data.length === 0) {
      return `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 9px; font-weight: bold; color: #666;">${section.label}</div>
          <div style="padding: 10px; color: #999; font-style: italic;">
            ${section.emptyMessage || 'No data'}
          </div>
        </div>
      `;
    }

    const headerStyle = this.getStyleString(styles?.table_header);
    const cellStyle = this.getStyleString(styles?.table_cell);

    const headerRow = section.columns.map(col => 
      `<th style="width: ${col.width || 'auto'}; ${headerStyle}">${col.header}</th>`
    ).join('');

    const bodyRows = data.map(row => {
      const cells = section.columns.map(col => {
        const value = row[col.source] ?? '';
        const formatted = this.formatValue(value, col.format, context);
        return `<td style="${cellStyle}">${formatted}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; font-weight: bold; color: #666; margin-bottom: 4px;">${section.label}</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    `;
  }

  renderSignatureBlock(section, context, styles) {
    if (!section.parties) return '';

    const partiesHtml = section.parties.map(party => {
      const fieldsHtml = party.fields.map(field => {
        if (field.type === 'signature_line') {
          return `
            <div style="margin-top: 20px; border-top: 1px solid #333; width: 200px;">
              <span style="font-size: 9px;">Signature</span>
            </div>
          `;
        }
        const value = this.resolveSource(field.source, context);
        const formatted = field.format ? this.formatValue(value, field.format, context) : (value || field.default || '');
        return `
          <div style="margin-bottom: 8px;">
            <span style="font-size: 9px; color: #666;">${field.label}:</span>
            <span style="font-size: 10px; margin-left: 8px;">${formatted || '________________'}</span>
          </div>
        `;
      }).join('');

      return `
        <div style="flex: 1; padding: 15px; border: 1px solid #ddd;">
          <div style="font-weight: bold; margin-bottom: 5px;">${party.title}</div>
          ${party.subtitle ? `<div style="font-size: 9px; color: #666; margin-bottom: 10px;">${party.subtitle}</div>` : ''}
          ${fieldsHtml}
        </div>
      `;
    }).join('');

    return `<div style="display: flex; gap: 20px; margin-top: 20px;">${partiesHtml}</div>`;
  }

  renderPageBreak() {
    return '<div style="page-break-after: always;"></div>';
  }

  // ─────────────────────────────────────────────────────────────
  // Data Resolution
  // ─────────────────────────────────────────────────────────────

  /**
   * Resolve dot-notation path to value
   */
  resolveSource(source, context) {
    if (!source || typeof source !== 'string') return source;
    
    const parts = source.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = value[part];
    }
    
    return value;
  }

  // ─────────────────────────────────────────────────────────────
  // Formatting
  // ─────────────────────────────────────────────────────────────

  /**
   * Format a value based on format type
   */
  formatValue(value, format, context) {
    if (value === null || value === undefined) return '';
    if (!format) return String(value);

    switch (format) {
      case 'date':
        return this.formatDate(value);
      case 'datetime':
        return this.formatDateTime(value);
      case 'currency':
        return this.formatCurrency(value);
      case 'currency_with_sign':
        return this.formatCurrencyWithSign(value);
      case 'days_with_sign':
        return this.formatDaysWithSign(value);
      case 'variation_type_label':
        return this.getVariationTypeLabel(value);
      default:
        return String(value);
    }
  }

  formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatCurrencyWithSign(value) {
    const num = parseFloat(value) || 0;
    const sign = num >= 0 ? '+' : '';
    return `${sign}£${Math.abs(num).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDaysWithSign(value) {
    const num = parseInt(value) || 0;
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num} days`;
  }

  getVariationTypeLabel(value) {
    const labels = {
      scope_extension: 'Scope Extension',
      scope_reduction: 'Scope Reduction',
      time_extension: 'Time Extension',
      cost_adjustment: 'Cost Adjustment',
      combined: 'Combined'
    };
    return labels[value] || value;
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Convert style object to CSS string
   */
  getStyleString(styleObj) {
    if (!styleObj) return '';
    
    const cssMap = {
      fontSize: 'font-size',
      fontWeight: 'font-weight',
      fontFamily: 'font-family',
      color: 'color',
      backgroundColor: 'background-color',
      textAlign: 'text-align',
      marginTop: 'margin-top',
      marginBottom: 'margin-bottom',
      padding: 'padding',
      borderBottom: 'border-bottom',
      paddingBottom: 'padding-bottom',
      lineHeight: 'line-height'
    };

    return Object.entries(styleObj)
      .map(([key, value]) => {
        const cssKey = cssMap[key] || key;
        const cssValue = typeof value === 'number' && !['lineHeight'].includes(key) 
          ? `${value}px` 
          : value;
        return `${cssKey}: ${cssValue}`;
      })
      .join('; ');
  }

  /**
   * Wrap sections in full HTML document
   */
  wrapHtmlDocument(sectionsHtml, definition, template) {
    const meta = definition.metadata || {};
    const styles = definition.styles?.page || {};
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${meta.document_title || 'Document'}</title>
  <style>
    @page {
      size: ${meta.page_size || 'A4'} ${meta.orientation || 'portrait'};
      margin: ${meta.margins?.top || 20}mm ${meta.margins?.right || 20}mm ${meta.margins?.bottom || 20}mm ${meta.margins?.left || 20}mm;
    }
    body {
      font-family: ${styles.fontFamily || template.font_family || 'Arial'}, sans-serif;
      font-size: ${styles.fontSize || 10}pt;
      line-height: ${styles.lineHeight || 1.4};
      color: ${styles.color || template.secondary_color || '#1a1a1a'};
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    table { border-collapse: collapse; }
    th, td { text-align: left; vertical-align: top; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>
    `.trim();
  }
}

// Export singleton instance
export const documentRendererService = new DocumentRendererService();
export default documentRendererService;
