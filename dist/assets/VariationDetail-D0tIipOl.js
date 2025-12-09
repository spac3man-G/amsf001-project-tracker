import{a as U,T as $,j as e,u as me,c as he,d as xe,x as h,L as pe,S as je,y as t}from"./index-M8lHJAcC.js";import{r as c,i as ve,d as ge}from"./vendor-react-BUTV5ZEl.js";import{C as ue}from"./ConfirmDialog-sPwqGFhS.js";import{a as p,f as b,b as r}from"./formatters-BTbCMDgc.js";import{ai as y,av as Ne,c as fe,ac as be,T as _e,aP as we,i as Ce,Q as ye,p as C,Y as Se,U as M,aO as f,R as F,X as Pe,A as De,F as Ae}from"./vendor-icons-Hb5rh3SC.js";import"./vendor-supabase-6faYzd5A.js";function ke({variation:i,onClose:d}){const{currentProject:j}=U(),g=c.useRef(null),S=$[i.variation_type];function o(){const n=g.current,l=window.open("","_blank");l.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${i.certificate_number||"Variation Certificate"}</title>
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
        ${n.innerHTML}
      </body>
      </html>
    `),l.document.close(),l.focus(),setTimeout(()=>{l.print()},250)}return e.jsx("div",{className:"vcm-overlay",onClick:d,children:e.jsxs("div",{className:"vcm-modal",onClick:n=>n.stopPropagation(),children:[e.jsxs("div",{className:"vcm-header",children:[e.jsxs("div",{className:"vcm-header-left",children:[e.jsx(y,{size:20}),e.jsx("h2",{children:"Variation Certificate"})]}),e.jsxs("div",{className:"vcm-header-actions",children:[e.jsxs("button",{className:"vcm-btn vcm-btn-secondary",onClick:o,children:[e.jsx(Ne,{size:16}),"Print / Save PDF"]}),e.jsx("button",{className:"vcm-close",onClick:d,children:e.jsx(fe,{size:20})})]})]}),e.jsx("div",{className:"vcm-content",children:e.jsxs("div",{className:"vcm-certificate",ref:g,children:[e.jsxs("div",{className:"cert-header",children:[e.jsx("h1",{children:"Variation Certificate"}),e.jsx("div",{className:"cert-number",children:i.certificate_number})]}),e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Project Details"}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Project:"}),e.jsx("span",{className:"cert-value",children:j?.name||"Unknown Project"})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Reference:"}),e.jsx("span",{className:"cert-value",children:j?.reference||"-"})]})]}),e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Variation Details"}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Reference:"}),e.jsx("span",{className:"cert-value",children:i.variation_ref})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Title:"}),e.jsx("span",{className:"cert-value",children:i.title})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Type:"}),e.jsx("span",{className:"cert-value",children:S?.label||i.variation_type})]}),i.description&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Description:"}),e.jsx("span",{className:"cert-value",children:i.description})]}),i.reason&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Reason:"}),e.jsx("span",{className:"cert-value",children:i.reason})]}),i.contract_terms_reference&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Contract Ref:"}),e.jsx("span",{className:"cert-value",children:i.contract_terms_reference})]})]}),e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Impact Summary"}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Cost Impact:"}),e.jsxs("span",{className:`cert-value ${i.total_cost_impact>=0?"impact-positive":"impact-negative"}`,children:[i.total_cost_impact>0?"+":"",p(i.total_cost_impact||0)]})]}),e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Schedule Impact:"}),e.jsxs("span",{className:`cert-value ${i.total_days_impact>=0?"impact-positive":"impact-negative"}`,children:[i.total_days_impact>0?"+":"",i.total_days_impact||0," days"]})]}),i.impact_summary&&e.jsxs("div",{className:"cert-row",children:[e.jsx("span",{className:"cert-label",children:"Summary:"}),e.jsx("span",{className:"cert-value",children:i.impact_summary})]})]}),i.affected_milestones&&i.affected_milestones.length>0&&e.jsxs("div",{className:"cert-section",children:[e.jsx("h2",{children:"Affected Milestones"}),e.jsxs("table",{className:"cert-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Milestone"}),e.jsx("th",{children:"Original Cost"}),e.jsx("th",{children:"New Cost"}),e.jsx("th",{children:"Original End"}),e.jsx("th",{children:"New End"})]})}),e.jsx("tbody",{children:i.affected_milestones.map((n,l)=>e.jsxs("tr",{children:[e.jsxs("td",{children:[n.milestone?.milestone_ref||"New",": ",n.milestone?.name||n.new_milestone_data?.name]}),e.jsx("td",{children:p(n.original_baseline_cost)}),e.jsx("td",{children:p(n.new_baseline_cost)}),e.jsx("td",{children:b(n.original_baseline_end)}),e.jsx("td",{children:b(n.new_baseline_end)})]},l))})]})]}),e.jsxs("div",{className:"cert-signatures",children:[e.jsxs("div",{className:"cert-sig-block",children:[e.jsx("h3",{children:"Supplier PM"}),i.supplier_signed_at?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"cert-sig-name",children:i.supplier_signer?.full_name||"Supplier PM"}),e.jsxs("div",{className:"cert-sig-date",children:["Signed: ",r(i.supplier_signed_at)]})]}):e.jsx("div",{className:"cert-sig-pending",children:"Not signed"})]}),e.jsxs("div",{className:"cert-sig-block",children:[e.jsx("h3",{children:"Customer PM"}),i.customer_signed_at?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"cert-sig-name",children:i.customer_signer?.full_name||"Customer PM"}),e.jsxs("div",{className:"cert-sig-date",children:["Signed: ",r(i.customer_signed_at)]})]}):e.jsx("div",{className:"cert-sig-pending",children:"Not signed"})]})]}),e.jsxs("div",{className:"cert-footer",children:[e.jsxs("p",{children:["Certificate generated on ",r(i.applied_at||new Date().toISOString())]}),e.jsx("p",{children:i.certificate_number})]})]})})]})})}function Me(){const{id:i}=ve(),d=ge(),{user:j,profile:g}=me(),{projectId:S}=U(),{showSuccess:o,showError:n,showWarning:l}=he(),{canCreateVariation:P,canDeleteVariation:O,canSignAsSupplier:D,canSignAsCustomer:A}=xe(),k=j?.id;g?.full_name||j?.email;const[s,L]=c.useState(null),[W,G]=c.useState(!0),[u,R]=c.useState(!1),[B,v]=c.useState(!1),[_,z]=c.useState(""),[Y,w]=c.useState(!1),[X,T]=c.useState(!1);c.useEffect(()=>{i&&N()},[i]);async function N(){try{const a=await h.getWithDetails(i);if(!a){n("Variation not found"),d("/variations");return}L(a)}catch{n("Failed to load variation")}finally{G(!1)}}function J(){d("/variations")}function H(){d(`/variations/${i}/edit`)}async function Q(){try{await h.submitForApproval(i,s.impact_summary||""),o("Variation submitted for approval"),N()}catch{n("Failed to submit variation")}}async function E(a){R(!0);try{await h.signVariation(i,a,k),o(`Signed as ${a==="supplier"?"Supplier PM":"Customer PM"}`),(await h.getWithDetails(i)).status===t.APPROVED&&(await h.applyVariation(i),o("Variation applied to baselines")),N()}catch{n("Failed to sign variation")}finally{R(!1)}}async function q(){if(!_.trim()){l("Please provide a reason for rejection");return}try{await h.rejectVariation(i,k,_),o("Variation rejected"),v(!1),z(""),N()}catch{n("Failed to reject variation")}}async function K(){try{await h.deleteDraftVariation(i),o(`Variation ${s.variation_ref} deleted`),d("/variations")}catch(a){n(a.message||"Failed to delete variation")}}function Z(a){return{[t.DRAFT]:"draft",[t.SUBMITTED]:"submitted",[t.AWAITING_CUSTOMER]:"awaiting",[t.AWAITING_SUPPLIER]:"awaiting",[t.APPROVED]:"approved",[t.APPLIED]:"applied",[t.REJECTED]:"rejected"}[a]||"draft"}function ee(){if(!s)return{};const a=s.status===t.DRAFT,x=s.status===t.SUBMITTED,V=s.status===t.AWAITING_CUSTOMER,I=s.status===t.AWAITING_SUPPLIER,ie=s.status===t.APPLIED,ne=a&&P,te=a&&P,ce=a&&O,le=D&&(x||I)&&!s.supplier_signed_at,re=A&&(x||V)&&!s.customer_signed_at,de=(D||A)&&(x||V||I),oe=ie&&s.certificate_number;return{canEdit:ne,canSubmit:te,canDelete:ce,canSupplierSign:le,canCustomerSign:re,canReject:de,canViewCertificate:oe}}if(W)return e.jsx(pe,{message:"Loading variation...",size:"large",fullPage:!0});if(!s)return null;const se=je[s.status],ae=$[s.variation_type],m=ee();return e.jsxs("div",{className:"variation-detail-page",children:[e.jsx("header",{className:"vd-header",children:e.jsxs("div",{className:"vd-header-content",children:[e.jsxs("div",{className:"vd-header-left",children:[e.jsx("button",{className:"vd-back-btn",onClick:J,children:e.jsx(be,{size:20})}),e.jsxs("div",{children:[e.jsxs("div",{className:"vd-header-ref",children:[e.jsx("span",{className:"vd-ref",children:s.variation_ref}),e.jsx("span",{className:`vd-status-badge ${Z(s.status)}`,children:se?.label||s.status})]}),e.jsx("h1",{children:s.title})]})]}),e.jsxs("div",{className:"vd-header-actions",children:[m.canDelete&&e.jsxs("button",{className:"vd-btn vd-btn-danger-outline",onClick:()=>T(!0),children:[e.jsx(_e,{size:18}),"Delete"]}),m.canEdit&&e.jsxs("button",{className:"vd-btn vd-btn-secondary",onClick:H,children:[e.jsx(we,{size:18}),"Edit Draft"]}),m.canSubmit&&e.jsxs("button",{className:"vd-btn vd-btn-primary",onClick:Q,children:[e.jsx(Ce,{size:18}),"Submit for Approval"]}),m.canViewCertificate&&e.jsxs("button",{className:"vd-btn vd-btn-secondary",onClick:()=>w(!0),children:[e.jsx(y,{size:18}),"View Certificate"]})]})]})}),e.jsx("div",{className:"vd-content",children:e.jsxs("div",{className:"vd-grid",children:[e.jsxs("div",{className:"vd-main",children:[e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Variation Details"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-info-grid",children:[e.jsxs("div",{className:"vd-info-item",children:[e.jsx("label",{children:"Type"}),e.jsx("span",{className:"vd-type-badge",children:ae?.label||s.variation_type})]}),e.jsxs("div",{className:"vd-info-item",children:[e.jsx("label",{children:"Created"}),e.jsx("span",{children:r(s.created_at)})]}),s.contract_terms_reference&&e.jsxs("div",{className:"vd-info-item full-width",children:[e.jsx("label",{children:"Contract Terms Reference"}),e.jsx("span",{children:s.contract_terms_reference})]})]}),s.description&&e.jsxs("div",{className:"vd-description",children:[e.jsx("label",{children:"Description"}),e.jsx("p",{children:s.description})]}),s.reason&&e.jsxs("div",{className:"vd-description",children:[e.jsx("label",{children:"Reason for Change"}),e.jsx("p",{children:s.reason})]})]})]}),e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Impact Summary"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-impact-grid",children:[e.jsxs("div",{className:"vd-impact-item",children:[e.jsx("div",{className:"vd-impact-icon cost",children:e.jsx(ye,{size:20})}),e.jsxs("div",{className:"vd-impact-details",children:[e.jsx("span",{className:"vd-impact-label",children:"Cost Impact"}),e.jsxs("span",{className:`vd-impact-value ${s.total_cost_impact>=0?"positive":"negative"}`,children:[s.total_cost_impact>0?"+":"",p(s.total_cost_impact||0)]})]})]}),e.jsxs("div",{className:"vd-impact-item",children:[e.jsx("div",{className:"vd-impact-icon time",children:e.jsx(C,{size:20})}),e.jsxs("div",{className:"vd-impact-details",children:[e.jsx("span",{className:"vd-impact-label",children:"Schedule Impact"}),e.jsxs("span",{className:`vd-impact-value ${s.total_days_impact>=0?"positive":"negative"}`,children:[s.total_days_impact>0?"+":"",s.total_days_impact||0," days"]})]})]})]}),s.impact_summary&&e.jsx("div",{className:"vd-impact-text",children:e.jsx("p",{children:s.impact_summary})})]})]}),e.jsxs("div",{className:"vd-card",children:[e.jsxs("div",{className:"vd-card-header",children:[e.jsx("h2",{children:"Affected Milestones"}),e.jsxs("span",{className:"vd-card-count",children:[s.affected_milestones?.length||0," milestone",(s.affected_milestones?.length||0)!==1?"s":""]})]}),e.jsx("div",{className:"vd-card-body",children:!s.affected_milestones||s.affected_milestones.length===0?e.jsxs("div",{className:"vd-empty-state",children:[e.jsx(Se,{size:24}),e.jsx("p",{children:"No milestones affected"})]}):e.jsx("div",{className:"vd-milestones-list",children:s.affected_milestones.map(a=>e.jsxs("div",{className:"vd-milestone-item",children:[e.jsxs("div",{className:"vd-milestone-header",children:[e.jsx("span",{className:"vd-milestone-ref",children:a.milestone?.milestone_ref||"New Milestone"}),e.jsx("span",{className:"vd-milestone-name",children:a.milestone?.name||a.new_milestone_data?.name||""}),a.is_new_milestone&&e.jsx("span",{className:"vd-new-badge",children:"NEW"})]}),e.jsxs("div",{className:"vd-milestone-changes",children:[a.original_baseline_cost!==a.new_baseline_cost&&e.jsxs("div",{className:"vd-change-row",children:[e.jsx("span",{className:"vd-change-label",children:"Cost:"}),e.jsx("span",{className:"vd-change-from",children:p(a.original_baseline_cost)}),e.jsx("span",{className:"vd-change-arrow",children:"→"}),e.jsx("span",{className:"vd-change-to",children:p(a.new_baseline_cost)})]}),a.original_baseline_end!==a.new_baseline_end&&e.jsxs("div",{className:"vd-change-row",children:[e.jsx("span",{className:"vd-change-label",children:"End Date:"}),e.jsx("span",{className:"vd-change-from",children:b(a.original_baseline_end)}),e.jsx("span",{className:"vd-change-arrow",children:"→"}),e.jsx("span",{className:"vd-change-to",children:b(a.new_baseline_end)})]})]}),a.change_rationale&&e.jsx("div",{className:"vd-milestone-rationale",children:e.jsx("em",{children:a.change_rationale})})]},a.id))})})]}),s.deliverable_changes&&s.deliverable_changes.length>0&&e.jsxs("div",{className:"vd-card",children:[e.jsxs("div",{className:"vd-card-header",children:[e.jsx("h2",{children:"Deliverable Changes"}),e.jsxs("span",{className:"vd-card-count",children:[s.deliverable_changes.length," change",s.deliverable_changes.length!==1?"s":""]})]}),e.jsx("div",{className:"vd-card-body",children:e.jsx("div",{className:"vd-deliverables-list",children:s.deliverable_changes.map(a=>e.jsxs("div",{className:`vd-deliverable-item ${a.change_type}`,children:[e.jsx("span",{className:`vd-change-type-badge ${a.change_type}`,children:a.change_type==="add"?"ADD":a.change_type==="remove"?"REMOVE":"MODIFY"}),e.jsx("span",{className:"vd-deliverable-name",children:a.deliverable?.name||a.new_data?.name||a.original_data?.name||"Unknown"}),a.removal_reason&&e.jsx("span",{className:"vd-removal-reason",children:a.removal_reason})]},a.id))})})]})]}),e.jsxs("div",{className:"vd-sidebar",children:[e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Authorisation"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-signatures",children:[e.jsxs("div",{className:`vd-signature-block ${s.supplier_signed_at?"signed":""}`,children:[e.jsxs("div",{className:"vd-signature-header",children:[e.jsx(M,{size:16}),e.jsx("span",{children:"Supplier PM"})]}),s.supplier_signed_at?e.jsxs("div",{className:"vd-signature-details",children:[e.jsx(f,{size:18,className:"vd-sign-icon signed"}),e.jsxs("div",{children:[e.jsx("div",{className:"vd-signer-name",children:s.supplier_signer?.full_name||"Supplier PM"}),e.jsx("div",{className:"vd-sign-date",children:r(s.supplier_signed_at)})]})]}):e.jsxs("div",{className:"vd-signature-pending",children:[e.jsx(C,{size:16}),e.jsx("span",{children:"Awaiting signature"})]}),m.canSupplierSign&&e.jsxs("button",{className:"vd-btn vd-btn-sign",onClick:()=>E("supplier"),disabled:u,children:[u?e.jsx(F,{size:16,className:"spinning"}):e.jsx(f,{size:16}),"Sign as Supplier PM"]})]}),e.jsxs("div",{className:`vd-signature-block ${s.customer_signed_at?"signed":""}`,children:[e.jsxs("div",{className:"vd-signature-header",children:[e.jsx(M,{size:16}),e.jsx("span",{children:"Customer PM"})]}),s.customer_signed_at?e.jsxs("div",{className:"vd-signature-details",children:[e.jsx(f,{size:18,className:"vd-sign-icon signed"}),e.jsxs("div",{children:[e.jsx("div",{className:"vd-signer-name",children:s.customer_signer?.full_name||"Customer PM"}),e.jsx("div",{className:"vd-sign-date",children:r(s.customer_signed_at)})]})]}):e.jsxs("div",{className:"vd-signature-pending",children:[e.jsx(C,{size:16}),e.jsx("span",{children:"Awaiting signature"})]}),m.canCustomerSign&&e.jsxs("button",{className:"vd-btn vd-btn-sign",onClick:()=>E("customer"),disabled:u,children:[u?e.jsx(F,{size:16,className:"spinning"}):e.jsx(f,{size:16}),"Sign as Customer PM"]})]})]}),m.canReject&&e.jsxs("button",{className:"vd-btn vd-btn-reject",onClick:()=>v(!0),children:[e.jsx(Pe,{size:16}),"Reject Variation"]}),s.status===t.REJECTED&&e.jsxs("div",{className:"vd-rejection-info",children:[e.jsx(De,{size:18}),e.jsxs("div",{children:[e.jsx("strong",{children:"Rejected"}),e.jsx("p",{children:s.rejection_reason}),e.jsxs("span",{className:"vd-rejection-date",children:["by ",s.rejector?.full_name||"Unknown"," on ",r(s.rejected_at)]})]})]})]})]}),s.status===t.APPLIED&&e.jsxs("div",{className:"vd-card",children:[e.jsx("div",{className:"vd-card-header",children:e.jsx("h2",{children:"Certificate"})}),e.jsxs("div",{className:"vd-card-body",children:[e.jsxs("div",{className:"vd-certificate-info",children:[e.jsx(y,{size:24}),e.jsxs("div",{children:[e.jsx("div",{className:"vd-cert-number",children:s.certificate_number}),e.jsxs("div",{className:"vd-cert-date",children:["Applied ",r(s.applied_at)]})]})]}),e.jsxs("button",{className:"vd-btn vd-btn-secondary full-width",onClick:()=>w(!0),children:[e.jsx(Ae,{size:16}),"View Certificate"]})]})]})]})]})}),B&&e.jsx("div",{className:"vd-modal-overlay",onClick:()=>v(!1),children:e.jsxs("div",{className:"vd-modal",onClick:a=>a.stopPropagation(),children:[e.jsxs("div",{className:"vd-modal-header",children:[e.jsx("h3",{children:"Reject Variation"}),e.jsx("button",{className:"vd-modal-close",onClick:()=>v(!1),children:"×"})]}),e.jsxs("div",{className:"vd-modal-body",children:[e.jsx("p",{children:"Please provide a reason for rejecting this variation."}),e.jsx("textarea",{className:"vd-reject-textarea",value:_,onChange:a=>z(a.target.value),placeholder:"Enter rejection reason...",rows:4})]}),e.jsxs("div",{className:"vd-modal-footer",children:[e.jsx("button",{className:"vd-btn vd-btn-secondary",onClick:()=>v(!1),children:"Cancel"}),e.jsx("button",{className:"vd-btn vd-btn-danger",onClick:q,children:"Reject Variation"})]})]})}),Y&&e.jsx(ke,{variation:s,onClose:()=>w(!1)}),e.jsx(ue,{isOpen:X,title:"Delete Draft Variation",message:`Are you sure you want to delete ${s?.variation_ref}?

"${s?.title}"

This action cannot be undone.`,confirmLabel:"Delete",confirmVariant:"danger",onConfirm:K,onCancel:()=>T(!1)})]})}export{Me as default};
