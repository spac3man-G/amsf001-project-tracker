// supabase/functions/send-invitation/index.ts
// Sends invitation emails via Resend
// 
// Environment variables required:
// - RESEND_API_KEY: Your Resend API key
//
// Request body:
// {
//   email: string,
//   orgName: string,
//   orgDisplayName?: string,
//   inviterName: string,
//   role: string,
//   acceptUrl: string
// }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "noreply@progressive.gg";
const FROM_NAME = "Tracker by Progressive";

// Brand colors
const BRAND_COLOR = "#87CEEB"; // Light blue from logo
const BRAND_COLOR_DARK = "#5BA3C6"; // Darker blue for hover/accents

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email HTML template
function getEmailHtml(params: {
  orgName: string;
  orgDisplayName?: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}): string {
  const displayName = params.orgDisplayName || params.orgName;
  const roleDisplay = params.role === 'org_admin' ? 'Administrator' : 'Member';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <!-- Logo/Brand -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; padding: 8px 16px; background-color: ${BRAND_COLOR}; border: 3px solid ${BRAND_COLOR}; border-radius: 6px; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">progressive</span>
              </div>
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1e293b;">You're Invited!</h1>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Join your team on Tracker</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                <strong>${params.inviterName}</strong> has invited you to join <strong>${displayName}</strong> as ${roleDisplay === 'Administrator' ? 'an' : 'a'} <strong>${roleDisplay}</strong>.
              </p>
              
              <!-- Organisation Info Box -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 4px 0;">
                      <span style="font-size: 12px; color: #64748b;">Organisation</span><br>
                      <span style="font-size: 15px; font-weight: 600; color: #1e293b;">${displayName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 4px;">
                      <span style="font-size: 12px; color: #64748b;">Your Role</span><br>
                      <span style="display: inline-block; margin-top: 4px; padding: 4px 10px; background-color: #dbeafe; color: #1d4ed8; border-radius: 4px; font-size: 13px; font-weight: 600;">${roleDisplay}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${params.acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: #64748b;">
                This invitation will expire in <strong>7 days</strong>. If you didn't expect this invitation, you can safely ignore this email.
              </p>
              
              <!-- Link fallback -->
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${params.acceptUrl}" style="color: ${BRAND_COLOR_DARK}; word-break: break-all;">${params.acceptUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Tracker by Progressive<br>
                <a href="https://tracker.progressive.gg" style="color: ${BRAND_COLOR_DARK}; text-decoration: none;">tracker.progressive.gg</a>
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

// Plain text version
function getEmailText(params: {
  orgName: string;
  orgDisplayName?: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}): string {
  const displayName = params.orgDisplayName || params.orgName;
  const roleDisplay = params.role === 'org_admin' ? 'Administrator' : 'Member';
  
  return `
You're Invited!

${params.inviterName} has invited you to join ${displayName} as ${roleDisplay === 'Administrator' ? 'an' : 'a'} ${roleDisplay}.

Organisation: ${displayName}
Your Role: ${roleDisplay}

Accept your invitation by clicking this link:
${params.acceptUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Tracker by Progressive
https://tracker.progressive.gg
  `.trim();
}

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
    const { email, orgName, orgDisplayName, inviterName, role, acceptUrl } = await req.json();

    // Validate required fields
    if (!email || !orgName || !inviterName || !acceptUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email content
    const emailParams = { orgName, orgDisplayName, inviterName, role, acceptUrl };
    const htmlContent = getEmailHtml(emailParams);
    const textContent = getEmailText(emailParams);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: `You've been invited to join ${orgDisplayName || orgName}`,
        html: htmlContent,
        text: textContent,
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

    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
