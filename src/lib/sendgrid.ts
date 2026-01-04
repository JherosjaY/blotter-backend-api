import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL!;
const FROM_NAME = process.env.SENDGRID_FROM_NAME!;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Helper to get logo attachment with hardcoded base64 to avoid file system issues on Render
function getLogoAttachment() {
  // Hardcoded Base64 of Email_Logo.png (80x80)
  const logoBase64 = "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";

  return {
    content: logoBase64,
    filename: 'logo.png',
    type: 'image/png',
    disposition: 'inline',
    content_id: 'logo'
  };
}

export async function sendEmail(options: EmailOptions) {
  try {
    const logoAttachment = getLogoAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      attachments: attachments
    });

    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}

// Email Templates
export const EmailTemplates = {
  // Welcome email for new users
  welcome: (name: string, verificationLink: string) => ({
    subject: 'Welcome to Blotter Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1877F2;">Welcome, ${name}!</h2>
        <p>Thank you for registering with the Blotter Management System.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #1877F2; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 14px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  }),

  // Password reset email
  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1877F2;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #1877F2; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  }),

  // Report notification for officers
  reportNotification: (officerName: string, reportId: string, incidentType: string) => ({
    subject: `New Report Assigned: ${incidentType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1877F2;">New Report Assigned</h2>
        <p>Hi Officer ${officerName},</p>
        <p>A new report has been assigned to you:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Report ID:</strong> ${reportId}</p>
          <p><strong>Incident Type:</strong> ${incidentType}</p>
        </div>
        <p>Please review and take appropriate action.</p>
      </div>
    `,
  }),

  // Hearing schedule notification
  hearingScheduled: (name: string, hearingDate: string, location: string) => ({
    subject: 'Hearing Scheduled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1877F2;">Hearing Scheduled</h2>
        <p>Dear ${name},</p>
        <p>A hearing has been scheduled for your case:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Date & Time:</strong> ${hearingDate}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>Please make sure to attend on time.</p>
      </div>
    `,
  }),
};

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  username?: string
): Promise<void> {
  // ❌ TEMPORARILY REMOVED: Logo attachment causing base64 encoding error
  // const logoAttachment = getLogoAttachment();
  // const attachments = [logoAttachment];

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Email Verification Code - Blotter Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .email-container { 
            background: #ffffff;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: #0f172a;
            padding: 40px 20px;
            text-align: center;
            border-radius: 32px 32px 0 0;
          }
          .app-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 16px auto;
            display: block;
          }
          .app-title {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 1px;
            text-transform: uppercase;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          .content-card { 
            background: #1e293b;
            padding: 40px 30px;
            border-radius: 0 0 32px 32px;
          }
          .greeting { 
            color: #ffffff;
            font-size: 18px;
            margin-bottom: 16px;
            font-weight: 500;
          }
          .message { 
            color: #94a3b8;
            font-size: 15px;
            margin-bottom: 12px;
          }
          .code-container { 
            background: #0f172a;
            border: 2px solid #3b82f6;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
            border-radius: 16px;
          }
          .code-label {
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .code { 
            font-size: 36px;
            font-weight: bold;
            color: #3b82f6;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
          }
          .expiry { 
            background: rgba(245, 158, 11, 0.15);
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
            color: #fbbf24;
            font-size: 14px;
          }
          .footer { 
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 13px;
          }
          .brand-name {
            color: #3b82f6;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <h1 class="app-title">🛡️ Blotter Management System</h1>
            </div>
            <div class="content-card">
              <p class="greeting">Hello${username ? ` <strong>${username}</strong>` : ''}! 👋</p>
              <p class="message">Thank you for registering with <span class="brand-name">Blotter Management System</span>.</p>
              <p class="message">To complete your registration, please enter the verification code below in the app:</p>
              <div class="code-container">
                <div class="code-label">Verification Code</div>
                <div class="code">${code}</div>
              </div>
              <div class="expiry">⏱️ <strong>Important:</strong> This code will expire in 10 minutes.</div>
              <p class="message">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 <span class="brand-name">Blotter Management System</span></p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    // ❌ REMOVED: attachments field causing base64 encoding error
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (error: any) {
    console.error('❌ SendGrid error:', error);
    console.error('❌ SendGrid error response:', JSON.stringify(error.response?.body, null, 2));
    throw new Error(error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send verification email');
  }
}


/**
 * Send password reset code email
 */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  username?: string
): Promise<void> {
  // ❌ REMOVED: Logo attachment causing SendGrid 400 error
  // const logoAttachment = getLogoAttachment();
  // const attachments = [logoAttachment];

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Password Reset Code - Blotter Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .email-container { 
            background: #ffffff;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: #0f172a;
            padding: 40px 20px;
            text-align: center;
            border-radius: 32px 32px 0 0;
          }
          .app-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 16px auto;
            display: block;
          }
          .app-title {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .content-card { 
            background: #1e293b;
            padding: 40px 30px;
            border-radius: 0 0 32px 32px;
          }
          .greeting { 
            color: #ffffff;
            font-size: 18px;
            margin-bottom: 16px;
            font-weight: 500;
          }
          .message { 
            color: #94a3b8;
            font-size: 15px;
            margin-bottom: 12px;
          }
          .code-container { 
            background: #0f172a;
            border: 2px solid #ef4444;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
            border-radius: 16px;
          }
          .code-label {
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .code { 
            font-size: 36px;
            font-weight: bold;
            color: #ef4444;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
          }
          .expiry { 
            background: rgba(245, 158, 11, 0.15);
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
            color: #fbbf24;
            font-size: 14px;
          }
          .security-notice {
            background: rgba(239, 68, 68, 0.15);
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
            color: #fca5a5;
            font-size: 14px;
          }
          .footer { 
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 13px;
          }
          .brand-name {
            color: #3b82f6;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <!-- Logo removed due to SendGrid error -->
              <h1 class="app-title">🛡️ BLOTTER MANAGEMENT SYSTEM</h1>
            </div>
            <div class="content-card">
              <p class="greeting">Hello${username ? ` <strong>${username}</strong>` : ''}! 👋</p>
              <p class="message">We received a request to reset your password for <span class="brand-name">Blotter Management System</span>.</p>
              <p class="message">Please use the following code to reset your password:</p>
              <div class="code-container">
                <div class="code-label">Password Reset Code</div>
                <div class="code">${code}</div>
              </div>
              <div class="expiry">⏱️ <strong>Important:</strong> This code will expire in 10 minutes.</div>
              <div class="security-notice">
                🔒 <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>© 2025 <span class="brand-name">Blotter Management System</span></p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    // ❌ REMOVED: attachments field causing SendGrid 400 error
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${to}`);
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Send officer credentials email
 */
export async function sendOfficerCredentialsEmail(
  to: string,
  officerName: string,
  username: string,
  password: string,
  rank: string,
  badgeNumber: string
): Promise<void> {
  // ❌ REMOVED: Logo attachment causing SendGrid 400 error
  // const logoAttachment = getLogoAttachment();
  // const attachments = [logoAttachment];

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Officer Account Created - Blotter Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .email-container { 
            background: #ffffff;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: #0f172a;
            padding: 40px 20px;
            text-align: center;
            border-radius: 32px 32px 0 0;
          }
          .app-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 16px auto;
            display: block;
          }
          .app-title {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .content-card { 
            background: #1e293b;
            padding: 40px 30px;
            border-radius: 0 0 32px 32px;
          }
          .greeting { 
            color: #ffffff;
            font-size: 18px;
            margin-bottom: 16px;
            font-weight: 500;
          }
          .message { 
            color: #94a3b8;
            font-size: 15px;
            margin-bottom: 12px;
          }
          .credentials-container { 
            background: #0f172a;
            border: 2px solid #10b981;
            padding: 24px;
            margin: 30px 0;
            border-radius: 16px;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #334155;
          }
          .credential-row:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .credential-value { 
            font-size: 16px;
            font-weight: bold;
            color: #10b981;
            font-family: 'Courier New', monospace;
          }
          .security-notice {
            background: rgba(245, 158, 11, 0.15);
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
            color: #fbbf24;
            font-size: 14px;
          }
          .footer { 
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 13px;
          }
          .brand-name {
            color: #3b82f6;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <!-- Logo removed due to SendGrid error -->
              <h1 class="app-title">🛡️ BLOTTER MANAGEMENT SYSTEM</h1>
            </div>
            <div class="content-card">
              <p class="greeting">Welcome, <strong>${officerName}</strong>! 👮</p>
              <p class="message">Your officer account has been successfully created in the <span class="brand-name">Blotter Management System</span>.</p>
              <p class="message">Below are your login credentials:</p>
              <div class="credentials-container">
                <div class="credential-row">
                  <span class="credential-label">Rank</span>
                  <span class="credential-value">${rank}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">Badge Number</span>
                  <span class="credential-value">${badgeNumber}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">Username</span>
                  <span class="credential-value">${username}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">Temporary Password</span>
                  <span class="credential-value">${password}</span>
                </div>
              </div>
              <div class="security-notice">
                🔒 <strong>Important:</strong> You will be required to change your password upon first login. Please keep these credentials secure and do not share them with anyone.
              </div>
              <p class="message">You can now log in to the mobile app using these credentials.</p>
            </div>
            <div class="footer">
              <p>© 2025 <span class="brand-name">Blotter Management System</span></p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    // ❌ REMOVED: attachments field causing SendGrid 400 error
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Officer credentials email sent to ${to}`);
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    throw new Error('Failed to send officer credentials email');
  }
}

