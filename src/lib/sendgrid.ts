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

// Helper to read logo file
async function getLogoAttachment() {
  try {
    const logoFile = Bun.file('src/logo.png');
    if (await logoFile.exists()) {
      const buffer = await logoFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        content: base64,
        filename: 'logo.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'logo'
      };
    }
  } catch (e) {
    console.error('Error reading logo file:', e);
  }
  return null;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const logoAttachment = await getLogoAttachment();
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
              <img src="https://res.cloudinary.com/do9ty8tem/image/upload/v1767312230/email_logo.png" alt="BMS Logo" class="app-logo">
              <h1 class="app-title">Blotter Management System</h1>
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
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    throw new Error('Failed to send verification email');
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
              <img src="https://res.cloudinary.com/do9ty8tem/image/upload/v1767312230/email_logo.png" alt="BMS Logo" class="app-logo">
              <h1 class="app-title">Blotter Management System</h1>
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
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${to}`);
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    throw new Error('Failed to send password reset email');
  }
}
