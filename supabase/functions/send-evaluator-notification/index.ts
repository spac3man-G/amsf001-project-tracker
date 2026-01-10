// supabase/functions/send-evaluator-notification/index.ts
// Sends evaluator module notification emails via Resend
//
// Environment variables required:
// - RESEND_API_KEY: Your Resend API key
//
// Request body:
// {
//   notificationType: string,
//   recipient: { email: string, name: string },
//   data: { ... template-specific data ... },
//   evaluationProjectId?: string
// }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "noreply@progressive.gg";
const FROM_NAME = "Evaluator by Progressive";

// Brand colors
const BRAND_COLOR = "#6366f1"; // Indigo for Evaluator
const BRAND_COLOR_DARK = "#4f46e5";
const SUCCESS_COLOR = "#10b981";
const WARNING_COLOR = "#f59e0b";
const DANGER_COLOR = "#ef4444";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

interface TemplateConfig {
  subject: (data: Record<string, unknown>) => string;
  getHtml: (data: Record<string, unknown>) => string;
  getText: (data: Record<string, unknown>) => string;
}

const EMAIL_TEMPLATES: Record<string, TemplateConfig> = {
  // Requirement approval needed
  requirement_approval_needed: {
    subject: (data) => `Action Required: ${data.requirementCount || 'Requirements'} need your approval - ${data.evaluationName}`,
    getHtml: (data) => getApprovalNeededHtml(data),
    getText: (data) => getApprovalNeededText(data),
  },

  // Requirement approved
  requirement_approved: {
    subject: (data) => `Requirement Approved: ${data.requirementTitle} - ${data.evaluationName}`,
    getHtml: (data) => getRequirementApprovedHtml(data),
    getText: (data) => getRequirementApprovedText(data),
  },

  // Q&A question submitted
  qa_question_submitted: {
    subject: (data) => `New Question from ${data.vendorName} - ${data.evaluationName}`,
    getHtml: (data) => getQAQuestionHtml(data),
    getText: (data) => getQAQuestionText(data),
  },

  // Q&A answer published
  qa_answer_published: {
    subject: (data) => `Your Question Has Been Answered - ${data.evaluationName}`,
    getHtml: (data) => getQAAnswerHtml(data),
    getText: (data) => getQAAnswerText(data),
  },

  // Security review due
  security_review_due: {
    subject: (data) => `Security Review Due in ${data.daysLeft} days - ${data.vendorName}`,
    getHtml: (data) => getSecurityReviewHtml(data),
    getText: (data) => getSecurityReviewText(data),
  },

  // Phase gate ready
  phase_gate_ready: {
    subject: (data) => `Phase Gate Ready: ${data.phaseName} - ${data.evaluationName}`,
    getHtml: (data) => getPhaseGateHtml(data),
    getText: (data) => getPhaseGateText(data),
  },

  // Workshop reminder
  workshop_reminder: {
    subject: (data) => data.daysLeft === 0
      ? `Workshop TODAY: ${data.workshopName}`
      : `Workshop in ${data.daysLeft} day${data.daysLeft !== 1 ? 's' : ''}: ${data.workshopName}`,
    getHtml: (data) => getWorkshopReminderHtml(data),
    getText: (data) => getWorkshopReminderText(data),
  },

  // Deadline reminder
  deadline_reminder: {
    subject: (data) => data.daysLeft === 0
      ? `Deadline TODAY: ${data.deadlineTitle}`
      : `${data.daysLeft} day${data.daysLeft !== 1 ? 's' : ''} until deadline: ${data.deadlineTitle}`,
    getHtml: (data) => getDeadlineReminderHtml(data),
    getText: (data) => getDeadlineReminderText(data),
  },

  // Score anomaly detected
  anomaly_detected: {
    subject: (data) => `Score Anomaly Detected - ${data.vendorName} - ${data.evaluationName}`,
    getHtml: (data) => getAnomalyDetectedHtml(data),
    getText: (data) => getAnomalyDetectedText(data),
  },
};

// ============================================================================
// BASE TEMPLATE WRAPPER
// ============================================================================

function wrapHtml(content: string, previewText: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Evaluator Notification</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preview text -->
  <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>

  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 8px 16px; background-color: ${BRAND_COLOR}; border-radius: 6px; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">evaluator</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Evaluator by Progressive<br>
                <a href="https://tracker.progressive.gg" style="color: ${BRAND_COLOR_DARK}; text-decoration: none;">tracker.progressive.gg</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1; text-align: center;">
                You received this email because you are part of an evaluation project.<br>
                <a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function createButton(text: string, url: string, color: string = BRAND_COLOR): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" class="button" style="display: inline-block; padding: 14px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">${text}</a>
    </div>
  `;
}

function createInfoBox(items: Array<{ label: string; value: string }>): string {
  return `
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table role="presentation" style="width: 100%;">
        ${items.map((item, i) => `
          <tr>
            <td style="padding: ${i > 0 ? '8px' : '0'} 0 0;">
              <span style="font-size: 12px; color: #64748b;">${item.label}</span><br>
              <span style="font-size: 14px; font-weight: 600; color: #1e293b;">${item.value}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
}

// ============================================================================
// TEMPLATE IMPLEMENTATIONS
// ============================================================================

function getApprovalNeededHtml(data: Record<string, unknown>): string {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">Requirements Need Your Approval</h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      <strong>${data.requirementCount}</strong> requirement${(data.requirementCount as number) !== 1 ? 's have' : ' has'} been submitted for your review in the <strong>${data.evaluationName}</strong> evaluation.
    </p>
    ${createInfoBox([
      { label: 'Evaluation Project', value: data.evaluationName as string },
      { label: 'Pending Approvals', value: `${data.requirementCount} requirement${(data.requirementCount as number) !== 1 ? 's' : ''}` },
      { label: 'Stakeholder Area', value: data.stakeholderArea as string || 'All Areas' },
    ])}
    <p style="margin: 16px 0 0; font-size: 14px; color: #64748b;">
      Please review these requirements and provide your approval or feedback.
    </p>
    ${createButton('Review Requirements', data.reviewUrl as string)}
  `;
  return wrapHtml(content, `${data.requirementCount} requirements need your approval`);
}

function getApprovalNeededText(data: Record<string, unknown>): string {
  return `
Requirements Need Your Approval

${data.requirementCount} requirement${(data.requirementCount as number) !== 1 ? 's have' : ' has'} been submitted for your review.

Evaluation: ${data.evaluationName}
Pending: ${data.requirementCount} requirement${(data.requirementCount as number) !== 1 ? 's' : ''}
Area: ${data.stakeholderArea || 'All Areas'}

Review requirements: ${data.reviewUrl}

---
Evaluator by Progressive
  `.trim();
}

function getRequirementApprovedHtml(data: Record<string, unknown>): string {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">
      <span style="color: ${SUCCESS_COLOR};">✓</span> Requirement Approved
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      <strong>${data.approverName}</strong> has approved a requirement in the <strong>${data.evaluationName}</strong> evaluation.
    </p>
    ${createInfoBox([
      { label: 'Requirement', value: data.requirementTitle as string },
      { label: 'Category', value: data.categoryName as string || 'General' },
      { label: 'Approved By', value: data.approverName as string },
      { label: 'Approved At', value: data.approvedAt as string },
    ])}
    ${data.comments ? `<p style="margin: 16px 0; padding: 12px; background: #f0fdf4; border-radius: 6px; font-size: 14px; color: #166534;"><strong>Comment:</strong> ${data.comments}</p>` : ''}
    ${createButton('View Requirement', data.viewUrl as string, SUCCESS_COLOR)}
  `;
  return wrapHtml(content, `Requirement "${data.requirementTitle}" has been approved`);
}

function getRequirementApprovedText(data: Record<string, unknown>): string {
  return `
Requirement Approved

${data.approverName} has approved a requirement.

Requirement: ${data.requirementTitle}
Category: ${data.categoryName || 'General'}
Approved By: ${data.approverName}
${data.comments ? `Comment: ${data.comments}` : ''}

View requirement: ${data.viewUrl}

---
Evaluator by Progressive
  `.trim();
}

function getQAQuestionHtml(data: Record<string, unknown>): string {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">New Question from Vendor</h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      <strong>${data.vendorName}</strong> has submitted a question that requires your response.
    </p>
    ${createInfoBox([
      { label: 'Vendor', value: data.vendorName as string },
      { label: 'Category', value: data.questionCategory as string || 'General' },
      { label: 'Submitted', value: data.submittedAt as string },
    ])}
    <div style="background-color: #fef3c7; border-left: 4px solid ${WARNING_COLOR}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e;">Question:</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #78350f; line-height: 1.5;">${data.questionText}</p>
    </div>
    ${createButton('Answer Question', data.answerUrl as string, WARNING_COLOR)}
  `;
  return wrapHtml(content, `${data.vendorName} has a question for you`);
}

function getQAQuestionText(data: Record<string, unknown>): string {
  return `
New Question from ${data.vendorName}

${data.vendorName} has submitted a question that requires your response.

Category: ${data.questionCategory || 'General'}
Submitted: ${data.submittedAt}

Question:
${data.questionText}

Answer question: ${data.answerUrl}

---
Evaluator by Progressive
  `.trim();
}

function getQAAnswerHtml(data: Record<string, unknown>): string {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">Your Question Has Been Answered</h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      The evaluation team has responded to your question for the <strong>${data.evaluationName}</strong> evaluation.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 12px; color: #64748b;">Your Question:</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #475569; line-height: 1.5;">${data.questionText}</p>
    </div>
    <div style="background-color: #f0fdf4; border-left: 4px solid ${SUCCESS_COLOR}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 12px; color: #166534;">Answer:</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #14532d; line-height: 1.5;">${data.answerText}</p>
    </div>
    ${data.isSharedWithAllVendors ? `<p style="margin: 16px 0 0; font-size: 13px; color: #64748b;"><em>This answer has been shared with all participating vendors.</em></p>` : ''}
    ${createButton('View in Portal', data.portalUrl as string, SUCCESS_COLOR)}
  `;
  return wrapHtml(content, `Your question has been answered`);
}

function getQAAnswerText(data: Record<string, unknown>): string {
  return `
Your Question Has Been Answered

The evaluation team has responded to your question.

Your Question:
${data.questionText}

Answer:
${data.answerText}

${data.isSharedWithAllVendors ? 'This answer has been shared with all participating vendors.' : ''}

View in portal: ${data.portalUrl}

---
Evaluator by Progressive
  `.trim();
}

function getSecurityReviewHtml(data: Record<string, unknown>): string {
  const urgencyColor = (data.daysLeft as number) <= 1 ? DANGER_COLOR : (data.daysLeft as number) <= 3 ? WARNING_COLOR : BRAND_COLOR;
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">
      <span style="color: ${urgencyColor};">🔒</span> Security Review Due
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      The security review for <strong>${data.vendorName}</strong> is due in <strong style="color: ${urgencyColor};">${data.daysLeft} day${(data.daysLeft as number) !== 1 ? 's' : ''}</strong>.
    </p>
    ${createInfoBox([
      { label: 'Vendor', value: data.vendorName as string },
      { label: 'Assessment Stage', value: data.stageName as string },
      { label: 'Due Date', value: data.dueDate as string },
      { label: 'Evaluation', value: data.evaluationName as string },
    ])}
    ${data.pendingItems ? `
      <p style="margin: 16px 0 8px; font-size: 14px; font-weight: 600; color: #1e293b;">Pending Items:</p>
      <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
        ${(data.pendingItems as string[]).map(item => `<li style="margin: 4px 0;">${item}</li>`).join('')}
      </ul>
    ` : ''}
    ${createButton('Review Security Assessment', data.reviewUrl as string, urgencyColor)}
  `;
  return wrapHtml(content, `Security review for ${data.vendorName} due in ${data.daysLeft} days`);
}

function getSecurityReviewText(data: Record<string, unknown>): string {
  return `
Security Review Due

The security review for ${data.vendorName} is due in ${data.daysLeft} day${(data.daysLeft as number) !== 1 ? 's' : ''}.

Vendor: ${data.vendorName}
Stage: ${data.stageName}
Due Date: ${data.dueDate}
Evaluation: ${data.evaluationName}

${data.pendingItems ? `Pending Items:\n${(data.pendingItems as string[]).map(item => `- ${item}`).join('\n')}` : ''}

Review: ${data.reviewUrl}

---
Evaluator by Progressive
  `.trim();
}

function getPhaseGateHtml(data: Record<string, unknown>): string {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">
      <span style="color: ${SUCCESS_COLOR};">🎯</span> Phase Gate Ready
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      The <strong>${data.phaseName}</strong> phase gate for <strong>${data.stakeholderArea}</strong> has reached the participation threshold and is ready for sign-off.
    </p>
    ${createInfoBox([
      { label: 'Phase', value: data.phaseName as string },
      { label: 'Stakeholder Area', value: data.stakeholderArea as string },
      { label: 'Participation', value: `${data.participationScore}% (threshold: ${data.threshold}%)` },
      { label: 'Evaluation', value: data.evaluationName as string },
    ])}
    <p style="margin: 16px 0 0; font-size: 14px; color: #64748b;">
      As the stakeholder lead, please review the accumulated input and provide your sign-off to proceed.
    </p>
    ${createButton('Review & Sign Off', data.signOffUrl as string, SUCCESS_COLOR)}
  `;
  return wrapHtml(content, `${data.phaseName} phase gate ready for sign-off`);
}

function getPhaseGateText(data: Record<string, unknown>): string {
  return `
Phase Gate Ready

The ${data.phaseName} phase gate is ready for sign-off.

Phase: ${data.phaseName}
Area: ${data.stakeholderArea}
Participation: ${data.participationScore}% (threshold: ${data.threshold}%)
Evaluation: ${data.evaluationName}

Review & sign off: ${data.signOffUrl}

---
Evaluator by Progressive
  `.trim();
}

function getWorkshopReminderHtml(data: Record<string, unknown>): string {
  const isToday = (data.daysLeft as number) === 0;
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">
      ${isToday ? '📅 Workshop Today' : '📅 Upcoming Workshop'}
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      ${isToday
        ? `Reminder: <strong>${data.workshopName}</strong> is scheduled for <strong>today</strong>.`
        : `<strong>${data.workshopName}</strong> is scheduled in <strong>${data.daysLeft} day${(data.daysLeft as number) !== 1 ? 's' : ''}</strong>.`
      }
    </p>
    ${createInfoBox([
      { label: 'Workshop', value: data.workshopName as string },
      { label: 'Date & Time', value: data.dateTime as string },
      { label: 'Location', value: data.location as string || 'TBD' },
      { label: 'Duration', value: data.duration as string || 'TBD' },
    ])}
    ${data.agenda ? `
      <p style="margin: 16px 0 8px; font-size: 14px; font-weight: 600; color: #1e293b;">Agenda:</p>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">${data.agenda}</p>
    ` : ''}
    ${createButton('View Workshop Details', data.workshopUrl as string)}
  `;
  return wrapHtml(content, `Workshop ${isToday ? 'today' : `in ${data.daysLeft} days`}: ${data.workshopName}`);
}

function getWorkshopReminderText(data: Record<string, unknown>): string {
  const isToday = (data.daysLeft as number) === 0;
  return `
${isToday ? 'Workshop Today' : 'Upcoming Workshop'}

${isToday
  ? `Reminder: ${data.workshopName} is scheduled for today.`
  : `${data.workshopName} is scheduled in ${data.daysLeft} day${(data.daysLeft as number) !== 1 ? 's' : ''}.`
}

Workshop: ${data.workshopName}
Date & Time: ${data.dateTime}
Location: ${data.location || 'TBD'}
Duration: ${data.duration || 'TBD'}

${data.agenda ? `Agenda:\n${data.agenda}` : ''}

View details: ${data.workshopUrl}

---
Evaluator by Progressive
  `.trim();
}

function getDeadlineReminderHtml(data: Record<string, unknown>): string {
  const isToday = (data.daysLeft as number) === 0;
  const urgencyColor = isToday ? DANGER_COLOR : (data.daysLeft as number) <= 3 ? WARNING_COLOR : BRAND_COLOR;
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">
      <span style="color: ${urgencyColor};">⏰</span> ${isToday ? 'Deadline Today' : 'Upcoming Deadline'}
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      ${isToday
        ? `The deadline for <strong>${data.deadlineTitle}</strong> is <strong style="color: ${DANGER_COLOR};">today</strong>.`
        : `<strong>${data.deadlineTitle}</strong> is due in <strong style="color: ${urgencyColor};">${data.daysLeft} day${(data.daysLeft as number) !== 1 ? 's' : ''}</strong>.`
      }
    </p>
    ${createInfoBox([
      { label: 'Deadline', value: data.deadlineTitle as string },
      { label: 'Due Date', value: data.dueDate as string },
      { label: 'Type', value: data.deadlineType as string },
      { label: 'Evaluation', value: data.evaluationName as string },
    ])}
    ${data.description ? `<p style="margin: 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">${data.description}</p>` : ''}
    ${createButton('View Details', data.actionUrl as string, urgencyColor)}
  `;
  return wrapHtml(content, `${isToday ? 'Deadline today' : `${data.daysLeft} days until deadline`}: ${data.deadlineTitle}`);
}

function getDeadlineReminderText(data: Record<string, unknown>): string {
  const isToday = (data.daysLeft as number) === 0;
  return `
${isToday ? 'Deadline Today' : 'Upcoming Deadline'}

${isToday
  ? `The deadline for ${data.deadlineTitle} is today.`
  : `${data.deadlineTitle} is due in ${data.daysLeft} day${(data.daysLeft as number) !== 1 ? 's' : ''}.`
}

Deadline: ${data.deadlineTitle}
Due Date: ${data.dueDate}
Type: ${data.deadlineType}
Evaluation: ${data.evaluationName}

${data.description ? `Details: ${data.description}` : ''}

View details: ${data.actionUrl}

---
Evaluator by Progressive
  `.trim();
}

function getAnomalyDetectedHtml(data: Record<string, unknown>): string {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b;">
      <span style="color: ${WARNING_COLOR};">⚠️</span> Score Anomaly Detected
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
      An unusual scoring pattern has been detected for <strong>${data.vendorName}</strong> that may require review.
    </p>
    ${createInfoBox([
      { label: 'Vendor', value: data.vendorName as string },
      { label: 'Category', value: data.categoryName as string },
      { label: 'Anomaly Type', value: data.anomalyType as string },
      { label: 'Variance', value: data.variance as string },
    ])}
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Details:</strong></p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #78350f; line-height: 1.5;">${data.anomalyDetails}</p>
    </div>
    <p style="margin: 16px 0 0; font-size: 14px; color: #64748b;">
      Consider reviewing this vendor's scores or scheduling a reconciliation session.
    </p>
    ${createButton('Review Scores', data.reviewUrl as string, WARNING_COLOR)}
  `;
  return wrapHtml(content, `Score anomaly detected for ${data.vendorName}`);
}

function getAnomalyDetectedText(data: Record<string, unknown>): string {
  return `
Score Anomaly Detected

An unusual scoring pattern has been detected for ${data.vendorName}.

Vendor: ${data.vendorName}
Category: ${data.categoryName}
Type: ${data.anomalyType}
Variance: ${data.variance}

Details: ${data.anomalyDetails}

Review scores: ${data.reviewUrl}

---
Evaluator by Progressive
  `.trim();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check for API key
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { notificationType, recipient, data, evaluationProjectId } = await req.json();

    // Validate required fields
    if (!notificationType || !recipient?.email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: notificationType, recipient.email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get template
    const template = EMAIL_TEMPLATES[notificationType];
    if (!template) {
      return new Response(
        JSON.stringify({ error: `Unknown notification type: ${notificationType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email content
    const subject = template.subject(data);
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [recipient.email],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: "notification_type", value: notificationType },
          { name: "evaluation_project_id", value: evaluationProjectId || "none" },
        ],
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Evaluator notification email sent:", {
      type: notificationType,
      to: recipient.email,
      messageId: resendData.id,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending evaluator notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
