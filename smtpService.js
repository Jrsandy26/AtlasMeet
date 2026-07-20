import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
/**
 * Creates and configures the Nodemailer transporter.
 */
function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // TLS
        auth: {
            user: process.env.SMTP_EMAIL || 'noreply.atlasmeet@gmail.com',
            pass: process.env.SMTP_PASSWORD || 'ijhc drqh qyjd tflp',
        },
    });
}
/**
 * Sends a corporate-branded 2-Step Verification OTP email.
 */
export async function sendOtpEmail(email, otp) {
    const transporter = getTransporter();
    const subject = 'AtlasMeet Security - 2-Step Verification Code Required';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AtlasMeet Security</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px 40px 10px; background-color: #f1f5f9;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
              
              <!-- Corporate Brand Header -->
              <tr>
                <td align="center" style="padding: 32px 20px 20px 20px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);">
                  <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px; font-family: monospace;">A</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">AtlasMeet Security</h1>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 16px 0; font-weight: 600; font-size: 16px; color: #0f172a;">2-Step Authentication Verification</p>
                  <p style="margin: 0 0 20px 0;">Hello,</p>
                  <p style="margin: 0 0 20px 0;">To complete your login process and access the AtlasMeet web workspace, please input the following 2-step verification security code:</p>
                  
                  <!-- OTP Code Display -->
                  <div style="background-color: #f8fafc; border: 1px dashed #c084fc; padding: 20px; text-align: center; border-radius: 12px; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e1b4b; font-family: monospace;">${otp}</span>
                  </div>
                  
                  <p style="margin: 0 0 12px 0;">This authorization code is valid for **10 minutes** from transmission. For your account security, do not share this code with anyone, including support staff.</p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="margin: 0; font-size: 12px; color: #64748b; font-style: italic;">
                    <strong>Security Alert:</strong> If you did not request this login or do not recognize this attempt, please reset your password immediately and contact your system administrator.
                  </p>
                </td>
              </tr>
              
              <!-- Corporate Footer -->
              <tr>
                <td style="padding: 24px 32px 32px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>AtlasMeet Global Ltd.</strong></p>
                  <p style="margin: 0 0 12px 0;">Corporate Security Operations Center (SOC) &bull; London, UK</p>
                  <p style="margin: 0;">This email is auto-generated. Please do not reply directly to this address.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
    return transporter.sendMail({
        from: `"AtlasMeet Security SOC" <${process.env.SMTP_EMAIL || 'noreply.atlasmeet@gmail.com'}>`,
        to: email,
        subject,
        html,
    });
}
/**
 * Sends a corporate-branded Password Reset verification email.
 */
export async function sendResetEmail(email, username, code) {
    const transporter = getTransporter();
    const subject = 'AtlasMeet Security - Password Reset Authorization';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AtlasMeet Recovery</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px 40px 10px; background-color: #f1f5f9;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
              
              <!-- Corporate Brand Header -->
              <tr>
                <td align="center" style="padding: 32px 20px 20px 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                  <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px; font-family: monospace;">A</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">AtlasMeet Recovery</h1>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 16px 0; font-weight: 600; font-size: 16px; color: #0f172a;">Password Reset Request Generated</p>
                  <p style="margin: 0 0 20px 0;">Hello <strong>${username}</strong>,</p>
                  <p style="margin: 0 0 20px 0;">A request to reset the login password for your AtlasMeet account was initiated. Please copy and present the verification code below to your Administrator or submit it directly:</p>
                  
                  <!-- Recovery Code Display -->
                  <div style="background-color: #f8fafc; border: 1px dashed #f87171; padding: 20px; text-align: center; border-radius: 12px; margin: 24px 0;">
                    <span style="font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #7f1d1d; font-family: monospace;">${code}</span>
                  </div>
                  
                  <p style="margin: 0 0 12px 0;"><strong>Please Note:</strong> This security code requires approval from the primary system administrator inside the Monitoring Console before you can submit your new password.</p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="margin: 0; font-size: 12px; color: #64748b; font-style: italic;">
                    If you did not generate this request, you can safely ignore this email. Your current password remains active and secure.
                  </p>
                </td>
              </tr>
              
              <!-- Corporate Footer -->
              <tr>
                <td style="padding: 24px 32px 32px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>AtlasMeet Global Ltd.</strong></p>
                  <p style="margin: 0 0 12px 0;">Corporate Security Operations Center (SOC) &bull; London, UK</p>
                  <p style="margin: 0;">This email is auto-generated. Please do not reply directly to this address.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
    return transporter.sendMail({
        from: `"AtlasMeet Security SOC" <${process.env.SMTP_EMAIL || 'noreply.atlasmeet@gmail.com'}>`,
        to: email,
        subject,
        html,
    });
}
/**
 * Sends a corporate workspace invitation email containing the invite link.
 */
export async function sendInviteEmail(email, orgName, inviteLink) {
    const transporter = getTransporter();
    const subject = `You are invited to join ${orgName} on AtlasMeet`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AtlasMeet Workspace Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px 40px 10px; background-color: #f1f5f9;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
              
              <!-- Corporate Brand Header -->
              <tr>
                <td align="center" style="padding: 32px 20px 20px 20px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
                  <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px; font-family: monospace;">A</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">AtlasMeet Invitation</h1>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 16px 0; font-weight: 600; font-size: 16px; color: #0f172a;">Workspace Invitation Received</p>
                  <p style="margin: 0 0 20px 0;">Hello,</p>
                  <p style="margin: 0 0 20px 0;">You have been invited to join the organization <strong>${orgName}</strong> on the AtlasMeet corporate meeting intelligence platform.</p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteLink}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">Accept Invitation & Join</a>
                  </div>
                  
                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:</p>
                  <p style="margin: 0 0 12px 0; font-size: 11px; word-break: break-all; font-family: monospace;"><a href="${inviteLink}" style="color: #6366f1;">${inviteLink}</a></p>
                </td>
              </tr>
              
              <!-- Corporate Footer -->
              <tr>
                <td style="padding: 24px 32px 32px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>AtlasMeet Global Ltd.</strong></p>
                  <p style="margin: 0 0 12px 0;">Corporate Security Operations Center (SOC) &bull; London, UK</p>
                  <p style="margin: 0;">This email is auto-generated. Please do not reply directly to this address.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
    return transporter.sendMail({
        from: `"AtlasMeet Security SOC" <${process.env.SMTP_EMAIL || 'noreply.atlasmeet@gmail.com'}>`,
        to: email,
        subject,
        html,
    });
}
/**
 * Sends meeting summary and transcript logs via email.
 */
export async function sendMeetingLogEmail(email, username, title, dateTime, transcript, summary, audioBase64) {
    const transporter = getTransporter();
    const subject = `AtlasMeet Log Data - ${title}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AtlasMeet Meeting Logs</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px 40px 10px; background-color: #f1f5f9;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
              
              <!-- Corporate Brand Header -->
              <tr>
                <td align="center" style="padding: 32px 20px 20px 20px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);">
                  <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px; font-family: monospace;">A</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">AtlasMeet Log Export</h1>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 16px 0; font-weight: 600; font-size: 16px; color: #0f172a;">Hello ${username},</p>
                  <p style="margin: 0 0 20px 0;">Here is the compiled log data, transcript details, and AI summary for your meeting. The audio, transcript text, and formatted meeting minutes are attached to this email.</p>
                  
                  <table border="0" cellpadding="8" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                    <tr>
                      <td width="30%" style="color: #64748b; font-weight: bold; font-size: 12px;">Meeting Title:</td>
                      <td style="color: #0f172a; font-weight: bold; font-size: 12px;">${title}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-weight: bold; font-size: 12px;">Date & Time:</td>
                      <td style="color: #334155; font-size: 12px;">${dateTime}</td>
                    </tr>
                  </table>
                  
                  <!-- AI Summary section -->
                  <h3 style="color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; font-size: 14px;">AI Meeting Summary</h3>
                  <div style="background-color: #faf5ff; border-left: 4px solid #c084fc; padding: 16px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #581c87; white-space: pre-line; margin-bottom: 24px;">
                    ${summary || 'No summary generated for this meeting.'}
                  </div>
                  
                  <!-- Transcript Log section -->
                  <h3 style="color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; font-size: 14px;">Transcript Logs</h3>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 11px; max-height: 300px; overflow-y: auto; color: #334155; white-space: pre-line;">
                    ${transcript || 'No transcript segments recorded.'}
                  </div>
                </td>
              </tr>
              
              <!-- Corporate Footer -->
              <tr>
                <td style="padding: 24px 32px 32px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;"><strong>AtlasMeet Global Ltd.</strong></p>
                  <p style="margin: 0 0 12px 0;">Corporate Security Operations Center (SOC) &bull; London, UK</p>
                  <p style="margin: 0;">This email is auto-generated. Please do not reply directly to this address.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
    // Build attachments list
    const attachments = [];
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    if (transcript) {
        attachments.push({
            filename: `${safeTitle}_transcript.txt`,
            content: transcript
        });
    }
    if (summary) {
        // Generate valid Microsoft Word HTML structure for the docx file
        const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${title} - AI Summary Minutes</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; padding: 20px; }
          h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20pt; font-weight: bold; margin-bottom: 5px; }
          .meta-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
          .meta-table td { padding: 4px 0; font-size: 11pt; color: #4b5563; }
          .summary-content { font-size: 11pt; color: #1e293b; white-space: pre-line; }
        </style>
      </head>
      <body>
        <h1>AI Meeting Summary: ${title}</h1>
        <table class="meta-table">
          <tr><td><strong>Date & Time:</strong> ${dateTime}</td></tr>
        </table>
        <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-bottom: 20px;" />
        <div class="summary-content">
          ${summary}
        </div>
      </body>
      </html>
    `;
        attachments.push({
            filename: `${safeTitle}_minutes.docx`,
            content: '\ufeff' + wordHtml
        });
    }
    if (audioBase64) {
        attachments.push({
            filename: `${safeTitle}_audio.webm`,
            content: Buffer.from(audioBase64, 'base64')
        });
    }
    return transporter.sendMail({
        from: `"AtlasMeet Security SOC" <${process.env.SMTP_EMAIL || 'noreply.atlasmeet@gmail.com'}>`,
        to: email,
        subject,
        html,
        attachments
    });
}
