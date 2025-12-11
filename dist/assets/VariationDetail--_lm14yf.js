import{a as $,Z as q,j as e,$ as J,a0 as Q,u as _e,c as Ne,d as ye,W as w,L as we,Y as Se,X as x}from"./index-Dmy3q9-g.js";import{r as h,i as Ce,d as Te}from"./vendor-react-BUTV5ZEl.js";import{C as De}from"./ConfirmDialog-CBj9kq-1.js";import{a as D,f as A,b as _}from"./formatters-BTbCMDgc.js";import{am as L,az as Z,c as ee,F as z,a as $e,D as Ee,R as O,a5 as Y,ah as Pe,T as ke,a8 as Re,i as Ae,Q as ze,p as V,Y as Ie,U as K,aQ as R,X as Fe,A as Ve}from"./vendor-icons-CWM4So-G.js";import"./deliverableCalculations-D-qG4O_w.js";import"./timesheetCalculations-CqT_rZ40.js";import"./vendor-supabase-6faYzd5A.js";const S={HEADER:"header",SECTION_TITLE:"section_title",FIELD_ROW:"field_row",TEXT_BLOCK:"text_block",TABLE:"table",SIGNATURE_BLOCK:"signature_block",PAGE_BREAK:"page_break"};class Me{async renderToHtml(s,t){const r=[],i=s.template_definition;if(!i||!i.sections)return{html:"<p>No template definition</p>",warnings:["Missing template definition"]};const l=this.buildContext(s,t),c=i.sections.map((p,o)=>{try{return this.renderSection(p,l,"html",i.styles)}catch(f){return r.push(`Section ${o+1} (${p.type}): ${f.message}`),`<!-- Error rendering section ${o+1} -->`}}).join(`
`);return{html:this.wrapHtmlDocument(c,i,s),warnings:r}}async renderToDocx(s,t){throw new Error("DOCX rendering not yet implemented - Phase 2")}async renderToPdf(s,t){throw new Error("PDF rendering not yet implemented - Phase 2")}buildContext(s,t){const r={template:{logo_base64:s.logo_base64,primary_color:s.primary_color||"#8B0000",secondary_color:s.secondary_color||"#1a1a1a",font_family:s.font_family||"Arial"},...t};return r.computed=this.computeDerivedValues(s.template_type,t),r}computeDerivedValues(s,t){const r={generated_date:new Date().toISOString()};if(s==="variation_cr"&&t.variation){const i=t.variation;r.total_cost_impact=i.cost_impact||0,i.affected_milestones?.length>0&&(r.total_days_impact=i.affected_milestones.reduce((l,c)=>l+(c.days_diff||0),0))}return r}renderSection(s,t,r,i){switch(s.type){case S.HEADER:return this.renderHeader(s,t,i);case S.SECTION_TITLE:return this.renderSectionTitle(s,t,i);case S.FIELD_ROW:return this.renderFieldRow(s,t,i);case S.TEXT_BLOCK:return this.renderTextBlock(s,t,i);case S.TABLE:return this.renderTable(s,t,i);case S.SIGNATURE_BLOCK:return this.renderSignatureBlock(s,t,i);case S.PAGE_BREAK:return this.renderPageBreak();default:return`<!-- Unknown section type: ${s.type} -->`}}renderHeader(s,t,r){const i=s.logo?.source?`<img src="data:image/png;base64,${this.resolveSource(s.logo.source,t)}" 
             style="max-width: ${s.logo.width||150}px;" alt="Logo" />`:"",l=this.getStyleString(r?.header_title),c=this.getStyleString(r?.header_subtitle);return`
      <div class="document-header" style="text-align: center; margin-bottom: 20px;">
        ${i}
        <h1 style="${l}">${s.title?.text||""}</h1>
        ${s.subtitle?`<p style="${c}">${s.subtitle.text}</p>`:""}
      </div>
    `}renderSectionTitle(s,t,r){const i=this.getStyleString(r?.section_heading),l=s.level||1,c=l<=2?`h${l+1}`:"h4";return`<${c} style="${i}">${s.text}</${c}>`}renderFieldRow(s,t,r){return!s.fields||s.fields.length===0?"":`<div style="display: flex; border: 1px solid #ddd; margin-bottom: 8px;">${s.fields.map(l=>{const c=this.resolveSource(l.source,t),m=this.formatValue(c,l.format,t),p=l.width||`${100/s.fields.length}%`,o=l.style?this.getStyleString(r?.[l.style]):"";return`
        <div style="flex: 0 0 ${p}; padding: 8px;">
          <div style="font-size: 9px; font-weight: bold; color: #666;">${l.label}</div>
          <div style="font-size: 10px; ${o}">${m||"—"}</div>
        </div>
      `}).join("")}</div>`}renderTextBlock(s,t,r){const i=this.resolveSource(s.source,t),l=this.getStyleString(r?.text_block);return`
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; font-weight: bold; color: #666; margin-bottom: 4px;">${s.label}</div>
        <div style="border: 1px solid #ddd; padding: 10px; min-height: 40px; ${l}">
          ${i||'<span style="color: #999;">Not specified</span>'}
        </div>
      </div>
    `}renderTable(s,t,r){const i=this.resolveSource(s.source,t);if(!i||!Array.isArray(i)||i.length===0)return`
        <div style="margin-bottom: 12px;">
          <div style="font-size: 9px; font-weight: bold; color: #666;">${s.label}</div>
          <div style="padding: 10px; color: #999; font-style: italic;">
            ${s.emptyMessage||"No data"}
          </div>
        </div>
      `;const l=this.getStyleString(r?.table_header),c=this.getStyleString(r?.table_cell),m=s.columns.map(o=>`<th style="width: ${o.width||"auto"}; ${l}">${o.header}</th>`).join(""),p=i.map(o=>`<tr>${s.columns.map(v=>{const b=o[v.source]??"",a=this.formatValue(b,v.format,t);return`<td style="${c}">${a}</td>`}).join("")}</tr>`).join("");return`
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; font-weight: bold; color: #666; margin-bottom: 4px;">${s.label}</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr>${m}</tr></thead>
          <tbody>${p}</tbody>
        </table>
      </div>
    `}renderSignatureBlock(s,t,r){return s.parties?`<div style="display: flex; gap: 20px; margin-top: 20px;">${s.parties.map(l=>{const c=l.fields.map(m=>{if(m.type==="signature_line")return`
            <div style="margin-top: 20px; border-top: 1px solid #333; width: 200px;">
              <span style="font-size: 9px;">Signature</span>
            </div>
          `;const p=this.resolveSource(m.source,t),o=m.format?this.formatValue(p,m.format,t):p||m.default||"";return`
          <div style="margin-bottom: 8px;">
            <span style="font-size: 9px; color: #666;">${m.label}:</span>
            <span style="font-size: 10px; margin-left: 8px;">${o||"________________"}</span>
          </div>
        `}).join("");return`
        <div style="flex: 1; padding: 15px; border: 1px solid #ddd;">
          <div style="font-weight: bold; margin-bottom: 5px;">${l.title}</div>
          ${l.subtitle?`<div style="font-size: 9px; color: #666; margin-bottom: 10px;">${l.subtitle}</div>`:""}
          ${c}
        </div>
      `}).join("")}</div>`:""}renderPageBreak(){return'<div style="page-break-after: always;"></div>'}resolveSource(s,t){if(!s||typeof s!="string")return s;const r=s.split(".");let i=t;for(const l of r){if(i==null)return null;i=i[l]}return i}formatValue(s,t,r){if(s==null)return"";if(!t)return String(s);switch(t){case"date":return this.formatDate(s);case"datetime":return this.formatDateTime(s);case"currency":return this.formatCurrency(s);case"currency_with_sign":return this.formatCurrencyWithSign(s);case"days_with_sign":return this.formatDaysWithSign(s);case"variation_type_label":return this.getVariationTypeLabel(s);default:return String(s)}}formatDate(s){return s?new Date(s).toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}):""}formatDateTime(s){return s?new Date(s).toLocaleString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):""}formatCurrency(s){return`£${(parseFloat(s)||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}`}formatCurrencyWithSign(s){const t=parseFloat(s)||0;return`${t>=0?"+":""}£${Math.abs(t).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}`}formatDaysWithSign(s){const t=parseInt(s)||0;return`${t>=0?"+":""}${t} days`}getVariationTypeLabel(s){return{scope_extension:"Scope Extension",scope_reduction:"Scope Reduction",time_extension:"Time Extension",cost_adjustment:"Cost Adjustment",combined:"Combined"}[s]||s}getStyleString(s){if(!s)return"";const t={fontSize:"font-size",fontWeight:"font-weight",fontFamily:"font-family",color:"color",backgroundColor:"background-color",textAlign:"text-align",marginTop:"margin-top",marginBottom:"margin-bottom",padding:"padding",borderBottom:"border-bottom",paddingBottom:"padding-bottom",lineHeight:"line-height"};return Object.entries(s).map(([r,i])=>{const l=t[r]||r,c=typeof i=="number"&&!["lineHeight"].includes(r)?`${i}px`:i;return`${l}: ${c}`}).join("; ")}wrapHtmlDocument(s,t,r){const i=t.metadata||{},l=t.styles?.page||{};return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${i.document_title||"Document"}</title>
  <style>
    @page {
      size: ${i.page_size||"A4"} ${i.orientation||"portrait"};
      margin: ${i.margins?.top||20}mm ${i.margins?.right||20}mm ${i.margins?.bottom||20}mm ${i.margins?.left||20}mm;
    }
    body {
      font-family: ${l.fontFamily||r.font_family||"Arial"}, sans-serif;
      font-size: ${l.fontSize||10}pt;
      line-height: ${l.lineHeight||1.4};
      color: ${l.color||r.secondary_color||"#1a1a1a"};
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
  ${s}
</body>
</html>
    `.trim()}}const M=new Me;function Le({variation:n,onClose:s}){const{currentProject:t}=$(),r=h.useRef(null),i=q[n.variation_type];function l(){const c=r.current,m=window.open("","_blank");m.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${n.certificate_number||"Variation Certificate"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1d1d1f;
            padding: 40px;
          }
          .cert-header {
            text-align: center;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .cert-header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #0d9488;
            margin-bottom: 8px;
          }
          .cert-number {
            font-family: monospace;
            font-size: 14px;
            color: #86868b;
          }
          .cert-section {
            margin-bottom: 24px;
          }
          .cert-section h2 {
            font-size: 14px;
            font-weight: 600;
            color: #1d1d1f;
            border-bottom: 1px solid #e5e5e7;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .cert-row {
            display: flex;
            padding: 6px 0;
          }
          .cert-label {
            width: 150px;
            font-weight: 500;
            color: #86868b;
          }
          .cert-value {
            flex: 1;
            color: #1d1d1f;
          }
          .cert-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .cert-table th,
          .cert-table td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #e5e5e7;
          }
          .cert-table th {
            background: #f5f5f7;
            font-weight: 600;
          }
          .cert-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e7;
          }
          .cert-sig-block h3 {
            font-size: 12px;
            font-weight: 600;
            color: #86868b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          .cert-sig-name {
            font-size: 14px;
            font-weight: 600;
            color: #1d1d1f;
          }
          .cert-sig-date {
            font-size: 11px;
            color: #86868b;
          }
          .cert-footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e7;
            font-size: 11px;
            color: #86868b;
            text-align: center;
          }
          .impact-positive { color: #34c759; }
          .impact-negative { color: #ff3b30; }
          @media print {
            body { padding: 20px; }
            .cert-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${c.innerHTML}
      </body>
      </html>
    `),m.document.close(),m.focus(),setTimeout(()=>{m.print()},250)}return e.jsx("div",{className:"vcm-overlay",onClick:s,children:e.jsxs("div",{className:"vcm-modal",onClick:c=>c.stopPropagation(),children:[e.jsxs("div",{className:"vcm-header",children:[e.jsxs("div",{className:"vcm-header-left",children:[e.jsx(L,{size:20}),e.jsx("h2",{children:"Variation Certificate"})]}),e.jsxs("div",{className:"vcm-header-actions",children:[e.jsxs("button",{className:"vcm-btn vcm-btn-secondary",onClick:l,children:[e.jsx(Z,{size:16}),"Print / Save PDF"]}),e.jsx("button",{className:"vcm-close",onClick:s,children:e.jsx(ee,{size:20})})]})]}),e.jsx("div",{className:"vcm-content",children:e.jsxs("div",{className:"vcm-certificate",ref:r,children:[e.jsxs("div",{className:"cert-header",children:[e.jsx("h1",{children:"Variation Certificate"}),e.jsx("div",{className:"cert-number",children:n.certificate_number})]}),e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Project Details"}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Project:"}),e.jsx("span",{className:"cert-value",children:t?.name||"Unknown Project"})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Reference:"}),e.jsx("span",{className:"cert-value",children:t?.reference||"-"})]})]}),e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Variation Details"}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Reference:"}),e.jsx("span",{className:"cert-value",children:n.variation_ref})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Title:"}),e.jsx("span",{className:"cert-value",children:n.title})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Type:"}),e.jsx("span",{className:"cert-value",children:i?.label||n.variation_type})]}),n.description&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Description:"}),e.jsx("span",{className:"cert-value",children:n.description})]}),n.reason&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Reason:"}),e.jsx("span",{className:"cert-value",children:n.reason})]}),n.contract_terms_reference&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Contract Ref:"}),e.jsx("span",{className:"cert-value",children:n.contract_terms_reference})]})]}),e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Impact Summary"}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Cost Impact:"}),e.jsxs("span",{className:`cert-value ${n.total_cost_impact>=0?"impact-positive":"impact-negative"}`,children:[n.total_cost_impact>0?"+":"",D(n.total_cost_impact||0)]})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Schedule Impact:"}),e.jsxs("span",{className:`cert-value ${n.total_days_impact>=0?"impact-positive":"impact-negative"}`,children:[n.total_days_impact>0?"+":"",n.total_days_impact||0," days"]})]}),n.impact_summary&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Summary:"}),e.jsx("span",{className:"cert-value",children:n.impact_summary})]})]}),n.affected_milestones&&n.affected_milestones.length>0&&e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Affected Milestones"}),e.jsxs("table",{className:"cert-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Milestone"}),e.jsx("th",{children:"Original Cost"}),e.jsx("th",{children:"New Cost"}),e.jsx("th",{children:"Original End"}),e.jsx("th",{children:"New End"})]})}),e.jsx("tbody",{children:n.affected_milestones.map((c,m)=>e.jsxs("tr",{children:[e.jsxs("td",{children:[c.milestone?.milestone_ref||"New",": ",c.milestone?.name||c.new_milestone_data?.name]}),e.jsx("td",{children:D(c.original_baseline_cost)}),e.jsx("td",{children:D(c.new_baseline_cost)}),e.jsx("td",{children:A(c.original_baseline_end)}),e.jsx("td",{children:A(c.new_baseline_end)})]},m))})]})]}),e.jsxs("div",{className:"cert-signatures",children:[e.jsxs("div",{className:"cert-sig-block",children:[e.jsx("h3",{children:"Supplier PM"}),n.supplier_signed_at?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"cert-sig-name",children:n.supplier_signer?.full_name||"Supplier PM"}),e.jsxs("div",{className:"cert-sig-date",children:["Signed: ",_(n.supplier_signed_at)]})]}):e.jsx("div",{className:"cert-sig-pending",children:"Not signed"})]}),e.jsxs("div",{className:"cert-sig-block",children:[e.jsx("h3",{children:"Customer PM"}),n.customer_signed_at?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"cert-sig-name",children:n.customer_signer?.full_name||"Customer PM"}),e.jsxs("div",{className:"cert-sig-date",children:["Signed: ",_(n.customer_signed_at)]})]}):e.jsx("div",{className:"cert-sig-pending",children:"Not signed"})]})]}),e.jsxs("div",{className:"cert-footer",children:[e.jsxs("p",{children:["Certificate generated on ",_(n.applied_at||new Date().toISOString())]}),e.jsx("p",{children:n.certificate_number})]})]})})]})})}function Oe(n={}){const{projectId:s}=$(),[t,r]=h.useState([]),[i,l]=h.useState(!0),[c,m]=h.useState(null),p=h.useCallback(async()=>{if(!s){r([]),l(!1);return}l(!0),m(null);try{const o=await J.getTemplatesForProject(s,n);r(o||[])}catch(o){m(o.message||"Failed to load templates")}finally{l(!1)}},[s,n.templateType,n.activeOnly]);return h.useEffect(()=>{p()},[p]),{templates:t,loading:i,error:c,refresh:p}}function Be(n){const{projectId:s}=$(),[t,r]=h.useState(null),[i,l]=h.useState(!0),[c,m]=h.useState(null),p=h.useCallback(async()=>{if(!s||!n){r(null),l(!1);return}l(!0),m(null);try{const o=await J.getDefaultTemplate(s,n);r(o)}catch(o){m(o.message||"Failed to load template")}finally{l(!1)}},[s,n]);return h.useEffect(()=>{p()},[p]),{template:t,loading:i,error:c,refresh:p}}function We(){const[n,s]=h.useState(!1),[t,r]=h.useState(null),i=h.useCallback(async(m,p)=>{s(!0),r(null);try{return await M.renderToHtml(m,p)}catch(o){throw r(o.message||"Failed to render document"),o}finally{s(!1)}},[]),l=h.useCallback(async(m,p)=>{s(!0),r(null);try{return await M.renderToDocx(m,p)}catch(o){throw r(o.message||"Failed to generate DOCX"),o}finally{s(!1)}},[]),c=h.useCallback(async(m,p)=>{s(!0),r(null);try{return await M.renderToPdf(m,p)}catch(o){throw r(o.message||"Failed to generate PDF"),o}finally{s(!1)}},[]);return{rendering:n,error:t,renderToHtml:i,renderToDocx:l,renderToPdf:c,clearError:()=>r(null)}}function He(n,s){const{template:t,loading:r,error:i}=Be(Q.VARIATION_CR),{rendering:l,error:c,renderToHtml:m}=We(),[p,o]=h.useState(null),[f,v]=h.useState([]),b=h.useCallback(async()=>{if(!t||!n)return null;try{const a={variation:{...n,creator:{full_name:n.initiator_name||n.creator?.full_name||"Unknown"},affected_milestones:(n.affected_milestones||[]).map(g=>({ref:g.milestone?.milestone_ref||"NEW",name:g.milestone?.name||g.new_milestone_data?.name||"Unknown",original_end:g.original_baseline_end,new_end:g.new_baseline_end,days_diff:Ue(g.original_baseline_end,g.new_baseline_end)}))},project:s||{}},N=await m(t,a);return o(N.html),v(N.warnings||[]),N}catch(a){throw a}},[t,n,s,m]);return{template:t,html:p,warnings:f,loading:r,rendering:l,error:i||c,generatePreview:b,hasTemplate:!!t}}function Ue(n,s){if(!n||!s)return 0;const t=new Date(n),i=new Date(s).getTime()-t.getTime();return Math.round(i/(1e3*60*60*24))}function Ge({variation:n,onClose:s}){const{currentProject:t}=$(),r=h.useRef(null),{templates:i}=Oe({templateType:Q.VARIATION_CR}),{template:l,html:c,warnings:m,loading:p,rendering:o,error:f,generatePreview:v,hasTemplate:b}=He(n,t),[a,N]=h.useState(null),[g,E]=h.useState(!1);h.useEffect(()=>{l&&n&&v()},[l,n]),h.useEffect(()=>{if(c&&r.current){const u=r.current,j=u.contentDocument||u.contentWindow.document;j.open(),j.write(c),j.close()}},[c]);function C(){if(!r.current)return;const u=r.current;u.contentWindow.focus(),u.contentWindow.print()}function P(){if(!c)return;const u=window.open("","_blank");u.document.write(c),u.document.close(),u.focus()}function I(u){u.target===u.currentTarget&&s()}return h.useEffect(()=>{function u(j){j.key==="Escape"&&s()}return document.addEventListener("keydown",u),()=>document.removeEventListener("keydown",u)},[s]),e.jsx("div",{className:"crdm-overlay",onClick:I,children:e.jsxs("div",{className:"crdm-modal",onClick:u=>u.stopPropagation(),children:[e.jsxs("div",{className:"crdm-header",children:[e.jsxs("div",{className:"crdm-header-left",children:[e.jsx(z,{size:20,className:"crdm-header-icon"}),e.jsxs("div",{children:[e.jsx("h2",{children:"Change Request Document"}),e.jsxs("span",{className:"crdm-subtitle",children:[n?.variation_ref," - ",n?.title]})]})]}),e.jsxs("div",{className:"crdm-header-actions",children:[i.length>1&&e.jsxs("div",{className:"crdm-template-selector",children:[e.jsxs("button",{className:"crdm-btn crdm-btn-ghost",onClick:()=>E(!g),children:[l?.name||"Select Template",e.jsx($e,{size:16})]}),g&&e.jsx("div",{className:"crdm-dropdown",children:i.map(u=>e.jsxs("button",{className:`crdm-dropdown-item ${u.id===l?.id?"active":""}`,onClick:()=>{N(u.id),E(!1)},children:[u.name,u.is_default&&e.jsx("span",{className:"crdm-badge",children:"Default"})]},u.id))})]}),e.jsxs("button",{className:"crdm-btn crdm-btn-secondary",onClick:P,disabled:!c||o,title:"Open in new window",children:[e.jsx(Ee,{size:16}),"Open"]}),e.jsxs("button",{className:"crdm-btn crdm-btn-primary",onClick:C,disabled:!c||o,children:[e.jsx(Z,{size:16}),"Print / Save PDF"]}),e.jsx("button",{className:"crdm-close",onClick:s,children:e.jsx(ee,{size:20})})]})]}),e.jsxs("div",{className:"crdm-content",children:[(p||o)&&e.jsxs("div",{className:"crdm-loading",children:[e.jsx(O,{size:24,className:"crdm-spinner"}),e.jsx("span",{children:p?"Loading template...":"Generating document..."})]}),f&&e.jsxs("div",{className:"crdm-error",children:[e.jsx(Y,{size:24}),e.jsxs("div",{children:[e.jsx("strong",{children:"Error"}),e.jsx("p",{children:f})]})]}),!p&&!b&&!f&&e.jsxs("div",{className:"crdm-empty",children:[e.jsx(z,{size:48}),e.jsx("h3",{children:"No CR Template Found"}),e.jsxs("p",{children:["No Change Request template has been configured for this project.",e.jsx("br",{}),"Please contact your administrator to set up a template."]})]}),m.length>0&&e.jsxs("div",{className:"crdm-warnings",children:[e.jsx(Y,{size:16}),e.jsxs("div",{children:[e.jsx("strong",{children:"Warnings:"}),e.jsx("ul",{children:m.map((u,j)=>e.jsx("li",{children:u},j))})]})]}),c&&!p&&!o&&e.jsx("div",{className:"crdm-preview",children:e.jsx("iframe",{ref:r,className:"crdm-iframe",title:"CR Document Preview",sandbox:"allow-same-origin"})})]}),e.jsxs("div",{className:"crdm-footer",children:[e.jsxs("span",{className:"crdm-footer-info",children:["Template: ",l?.name||"None"," (v",l?.version||1,")"]}),e.jsx("span",{className:"crdm-footer-hint",children:'Use "Print / Save PDF" to save as a PDF file'})]})]})})}function ss(){const{id:n}=Ce(),s=Te(),{user:t,profile:r}=_e(),{projectId:i}=$(),{showSuccess:l,showError:c,showWarning:m}=Ne(),{canCreateVariation:p,canDeleteVariation:o,canSignAsSupplier:f,canSignAsCustomer:v}=ye(),b=t?.id;r?.full_name||t?.email;const[a,N]=h.useState(null),[g,E]=h.useState(!0),[C,P]=h.useState(!1),[I,u]=h.useState(!1),[j,B]=h.useState(""),[se,F]=h.useState(!1),[te,W]=h.useState(!1),[ae,H]=h.useState(!1);h.useEffect(()=>{n&&k()},[n]);async function k(){try{const d=await w.getWithDetails(n);if(!d){c("Variation not found"),s("/variations");return}N(d)}catch{c("Failed to load variation")}finally{E(!1)}}function ne(){s("/variations")}function re(){s(`/variations/${n}/edit`)}async function ie(){try{await w.submitForApproval(n,a.impact_summary||""),l("Variation submitted for approval"),k()}catch{c("Failed to submit variation")}}async function U(d){P(!0);try{await w.signVariation(n,d,b),l(`Signed as ${d==="supplier"?"Supplier PM":"Customer PM"}`),(await w.getWithDetails(n)).status===x.APPROVED&&(await w.applyVariation(n),l("Variation applied to baselines")),k()}catch{c("Failed to sign variation")}finally{P(!1)}}async function le(){if(!j.trim()){m("Please provide a reason for rejection");return}try{await w.rejectVariation(n,b,j),l("Variation rejected"),u(!1),B(""),k()}catch{c("Failed to reject variation")}}async function ce(){try{await w.deleteDraftVariation(n),l(`Variation ${a.variation_ref} deleted`),s("/variations")}catch(d){c(d.message||"Failed to delete variation")}}function de(d){return{[x.DRAFT]:"draft",[x.SUBMITTED]:"submitted",[x.AWAITING_CUSTOMER]:"awaiting",[x.AWAITING_SUPPLIER]:"awaiting",[x.APPROVED]:"approved",[x.APPLIED]:"applied",[x.REJECTED]:"rejected"}[d]||"draft"}function oe(){if(!a)return{};const d=a.status===x.DRAFT,T=a.status===x.SUBMITTED,G=a.status===x.AWAITING_CUSTOMER,X=a.status===x.AWAITING_SUPPLIER,pe=a.status===x.APPLIED,ue=d&&p,xe=d&&p,ge=d&&o,fe=f&&(T||X)&&!a.supplier_signed_at,je=v&&(T||G)&&!a.customer_signed_at,ve=(f||v)&&(T||G||X),be=pe&&a.certificate_number;return{canEdit:ue,canSubmit:xe,canDelete:ge,canSupplierSign:fe,canCustomerSign:je,canReject:ve,canViewCertificate:be}}if(g)return e.jsx(we,{message:"Loading variation...",size:"large",fullPage:!0});if(!a)return null;const me=Se[a.status],he=q[a.variation_type],y=oe();return e.jsxs("div",{className:"variation-detail-page",children:[e.jsx("header",{className:"vd-header",children:e.jsxs("div",{className:"vd-header-content",children:[e.jsxs("div",{className:"vd-header-left",children:[e.jsx("button",{className:"vd-back-btn",onClick:ne,children:e.jsx(Pe,{size:20})}),e.jsxs("div",{children:[e.jsxs("div",{className:"vd-header-ref",children:[e.jsx("span",{className:"vd-ref",children:a.variation_ref}),e.jsx("span",{className:`vd-status-badge ${de(a.status)}`,children:me?.label||a.status})]}),e.jsx("h1",{children:a.title})]})]}),e.jsxs("div",{className:"vd-header-actions",children:[y.canDelete&&e.jsxs("button",{className:"vd-btn vd-btn-danger-outline",onClick:()=>H(!0),children:[e.jsx(ke,{size:18}),"Delete"]}),y.canEdit&&e.jsxs("button",{className:"vd-btn vd-btn-secondary",onClick:re,children:[e.jsx(Re,{size:18}),"Edit Draft"]}),y.canSubmit&&e.jsxs("button",{className:"vd-btn vd-btn-primary",onClick:ie,children:[e.jsx(Ae,{size:18}),"Submit for Approval"]}),a.status!==x.DRAFT&&e.jsxs("button",{className:"vd-btn vd-btn-secondary",onClick:()=>W(!0),children:[e.jsx(z,{size:18}),"Generate CR"]}),y.canViewCertificate&&e.jsxs("button",{className:"vd-btn vd-btn-secondary",onClick:()=>F(!0),children:[e.jsx(L,{size:18}),"View Certificate"]})]})]})}),e.jsx("div",{className:"vd-content",children:e.jsxs("div",{className:"vd-grid",children:[e.jsxs("div",{className:"vd-main",children:[e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Variation Details"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-info-grid",children:[e.jsxs("div",{className:"vd-info-item",children:[e.jsx("label",{children:"Type"}),e.jsx("span",{className:"vd-type-badge",children:he?.label||a.variation_type})]}),e.jsxs("div",{className:"vd-info-item",children:[e.jsx("label",{children:"Created"}),e.jsx("span",{children:_(a.created_at)})]}),a.contract_terms_reference&&e.jsxs("div",{className:"vd-info-item full-width",children:[e.jsx("label",{children:"Contract Terms Reference"}),e.jsx("span",{children:a.contract_terms_reference})]})]}),a.description&&e.jsxs("div",{className:"vd-description",children:[e.jsx("label",{children:"Description"}),e.jsx("p",{children:a.description})]}),a.reason&&e.jsxs("div",{className:"vd-description",children:[e.jsx("label",{children:"Reason for Change"}),e.jsx("p",{children:a.reason})]})]})]}),e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Impact Summary"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-impact-grid",children:[e.jsxs("div",{className:"vd-impact-item",children:[e.jsx("div",{className:"vd-impact-icon cost",children:e.jsx(ze,{size:20})}),e.jsxs("div",{className:"vd-impact-details",children:[e.jsx("span",{className:"vd-impact-label",children:"Cost Impact"}),e.jsxs("span",{className:`vd-impact-value ${a.total_cost_impact>=0?"positive":"negative"}`,children:[a.total_cost_impact>0?"+":"",D(a.total_cost_impact||0)]})]})]}),e.jsxs("div",{className:"vd-impact-item",children:[e.jsx("div",{className:"vd-impact-icon time",children:e.jsx(V,{size:20})}),e.jsxs("div",{className:"vd-impact-details",children:[e.jsx("span",{className:"vd-impact-label",children:"Schedule Impact"}),e.jsxs("span",{className:`vd-impact-value ${a.total_days_impact>=0?"positive":"negative"}`,children:[a.total_days_impact>0?"+":"",a.total_days_impact||0," days"]})]})]})]}),a.impact_summary&&e.jsx("div",{className:"vd-impact-text",children:e.jsx("p",{children:a.impact_summary})})]})]}),e.jsxs("div",{className:"vd-card",children:[e.jsxs("div",{className:"vd-card-header",children:[e.jsx("h2",{children:"Affected Milestones"}),e.jsxs("span",{className:"vd-card-count",children:[a.affected_milestones?.length||0," milestone",(a.affected_milestones?.length||0)!==1?"s":""]})]}),e.jsx("div",{className:"vd-card-body",children:!a.affected_milestones||a.affected_milestones.length===0?e.jsxs("div",{className:"vd-empty-state",children:[e.jsx(Ie,{size:24}),e.jsx("p",{children:"No milestones affected"})]}):e.jsx("div",{className:"vd-milestones-list",children:a.affected_milestones.map(d=>e.jsxs("div",{className:"vd-milestone-item",children:[e.jsxs("div",{className:"vd-milestone-header",children:[e.jsx("span",{className:"vd-milestone-ref",children:d.milestone?.milestone_ref||"New Milestone"}),e.jsx("span",{className:"vd-milestone-name",children:d.milestone?.name||d.new_milestone_data?.name||""}),d.is_new_milestone&&e.jsx("span",{className:"vd-new-badge",children:"NEW"})]}),e.jsxs("div",{className:"vd-milestone-changes",children:[d.original_baseline_cost!==d.new_baseline_cost&&e.jsxs("div",{className:"vd-change-row",children:[e.jsx("span",{className:"vd-change-label",children:"Cost:"}),e.jsx("span",{className:"vd-change-from",children:D(d.original_baseline_cost)}),e.jsx("span",{className:"vd-change-arrow",children:"→"}),e.jsx("span",{className:"vd-change-to",children:D(d.new_baseline_cost)})]}),d.original_baseline_end!==d.new_baseline_end&&e.jsxs("div",{className:"vd-change-row",children:[e.jsx("span",{className:"vd-change-label",children:"End Date:"}),e.jsx("span",{className:"vd-change-from",children:A(d.original_baseline_end)}),e.jsx("span",{className:"vd-change-arrow",children:"→"}),e.jsx("span",{className:"vd-change-to",children:A(d.new_baseline_end)})]})]}),d.change_rationale&&e.jsx("div",{className:"vd-milestone-rationale",children:e.jsx("em",{children:d.change_rationale})})]},d.id))})})]}),a.deliverable_changes&&a.deliverable_changes.length>0&&e.jsxs("div",{className:"vd-card",children:[e.jsxs("div",{className:"vd-card-header",children:[e.jsx("h2",{children:"Deliverable Changes"}),e.jsxs("span",{className:"vd-card-count",children:[a.deliverable_changes.length," change",a.deliverable_changes.length!==1?"s":""]})]}),e.jsx("div",{className:"vd-card-body",children:e.jsx("div",{className:"vd-deliverables-list",children:a.deliverable_changes.map(d=>e.jsxs("div",{className:`vd-deliverable-item ${d.change_type}`,children:[e.jsx("span",{className:`vd-change-type-badge ${d.change_type}`,children:d.change_type==="add"?"ADD":d.change_type==="remove"?"REMOVE":"MODIFY"}),e.jsx("span",{className:"vd-deliverable-name",children:d.deliverable?.name||d.new_data?.name||d.original_data?.name||"Unknown"}),d.removal_reason&&e.jsx("span",{className:"vd-removal-reason",children:d.removal_reason})]},d.id))})})]})]}),e.jsxs("div",{className:"vd-sidebar",children:[e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Authorisation"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-signatures",children:[e.jsxs("div",{className:`vd-signature-block ${a.supplier_signed_at?"signed":""}`,children:[e.jsxs("div",{className:"vd-signature-header",children:[e.jsx(K,{size:16}),e.jsx("span",{children:"Supplier PM"})]}),a.supplier_signed_at?e.jsxs("div",{className:"vd-signature-details",children:[e.jsx(R,{size:18,className:"vd-sign-icon signed"}),e.jsxs("div",{children:[e.jsx("div",{className:"vd-signer-name",children:a.supplier_signer?.full_name||"Supplier PM"}),e.jsx("div",{className:"vd-sign-date",children:_(a.supplier_signed_at)})]})]}):e.jsxs("div",{className:"vd-signature-pending",children:[e.jsx(V,{size:16}),e.jsx("span",{children:"Awaiting signature"})]}),y.canSupplierSign&&e.jsxs("button",{className:"vd-btn vd-btn-sign",onClick:()=>U("supplier"),disabled:C,children:[C?e.jsx(O,{size:16,className:"spinning"}):e.jsx(R,{size:16}),"Sign as Supplier PM"]})]}),e.jsxs("div",{className:`vd-signature-block ${a.customer_signed_at?"signed":""}`,children:[e.jsxs("div",{className:"vd-signature-header",children:[e.jsx(K,{size:16}),e.jsx("span",{children:"Customer PM"})]}),a.customer_signed_at?e.jsxs("div",{className:"vd-signature-details",children:[e.jsx(R,{size:18,className:"vd-sign-icon signed"}),e.jsxs("div",{children:[e.jsx("div",{className:"vd-signer-name",children:a.customer_signer?.full_name||"Customer PM"}),e.jsx("div",{className:"vd-sign-date",children:_(a.customer_signed_at)})]})]}):e.jsxs("div",{className:"vd-signature-pending",children:[e.jsx(V,{size:16}),e.jsx("span",{children:"Awaiting signature"})]}),y.canCustomerSign&&e.jsxs("button",{className:"vd-btn vd-btn-sign",onClick:()=>U("customer"),disabled:C,children:[C?e.jsx(O,{size:16,className:"spinning"}):e.jsx(R,{size:16}),"Sign as Customer PM"]})]})]}),y.canReject&&e.jsxs("button",{className:"vd-btn vd-btn-reject",onClick:()=>u(!0),children:[e.jsx(Fe,{size:16}),"Reject Variation"]}),a.status===x.REJECTED&&e.jsxs("div",{className:"vd-rejection-info",children:[e.jsx(Ve,{size:18}),e.jsxs("div",{children:[e.jsx("strong",{children:"Rejected"}),e.jsx("p",{children:a.rejection_reason}),e.jsxs("span",{className:"vd-rejection-date",children:["by ",a.rejector?.full_name||"Unknown"," on ",_(a.rejected_at)]})]})]})]})]}),a.status===x.APPLIED&&e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Certificate"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-certificate-info",children:[e.jsx(L,{size:24}),e.jsxs("div",{children:[e.jsx("div",{className:"vd-cert-number",children:a.certificate_number}),e.jsxs("div",{className:"vd-cert-date",children:["Applied ",_(a.applied_at)]})]})]}),e.jsxs("button",{className:"vd-btn vd-btn-secondary full-width",onClick:()=>F(!0),children:[e.jsx(z,{size:16}),"View Certificate"]})]})]})]})]})}),I&&e.jsx("div",{className:"vd-modal-overlay",onClick:()=>u(!1),children:e.jsxs("div",{className:"vd-modal",onClick:d=>d.stopPropagation(),children:[e.jsxs("div",{className:"vd-modal-header",children:[e.jsx("h3",{children:"Reject Variation"}),e.jsx("button",{className:"vd-modal-close",onClick:()=>u(!1),children:"×"})]}),e.jsxs("div",{className:"vd-modal-body",children:[e.jsx("p",{children:"Please provide a reason for rejecting this variation."}),e.jsx("textarea",{className:"vd-reject-textarea",value:j,onChange:d=>B(d.target.value),placeholder:"Enter rejection reason...",rows:4})]}),e.jsxs("div",{className:"vd-modal-footer",children:[e.jsx("button",{className:"vd-btn vd-btn-secondary",onClick:()=>u(!1),children:"Cancel"}),e.jsx("button",{className:"vd-btn vd-btn-danger",onClick:le,children:"Reject Variation"})]})]})}),se&&e.jsx(Le,{variation:a,onClose:()=>F(!1)}),te&&e.jsx(Ge,{variation:a,onClose:()=>W(!1)}),e.jsx(De,{isOpen:ae,title:"Delete Draft Variation",message:`Are you sure you want to delete ${a?.variation_ref}?

"${a?.title}"

This action cannot be undone.`,confirmLabel:"Delete",confirmVariant:"danger",onConfirm:ce,onCancel:()=>H(!1)})]})}export{ss as default};
