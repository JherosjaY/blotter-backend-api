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

export async function sendEmail(options: EmailOptions) {
  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
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
            background-color: #0f172a;
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .header {
            background: #0f172a;
            padding: 40px 20px;
            text-align: center;
            border-radius: 32px 32px 0 0;
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1877F2 0%, #3B82F6 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            box-shadow: 0 8px 24px rgba(24, 119, 242, 0.4);
          }
          .content-card {
            background: #1e293b;
            padding: 40px 30px;
            border-radius: 0 0 32px 32px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
          .greeting { font-size: 18px; color: #ffffff; margin-bottom: 20px; font-weight: 500; }
          .message { color: #94a3b8; margin-bottom: 15px; font-size: 15px; }
          .code-container {
            background: #0f172a;
            border: 2px solid #1877F2;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 12px rgba(24, 119, 242, 0.2);
          }
          .code-label { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
          .code {
            font-size: 36px;
            font-weight: 700;
            color: #1877F2;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 20px rgba(24, 119, 242, 0.5);
          }
          .expiry {
            background: rgba(245, 158, 11, 0.15);
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #fbbf24;
          }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
          .footer-note { color: #64748b; font-size: 13px; margin-top: 20px; font-style: italic; }
          .brand-name { color: #1877F2; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo"><svg width="80" height="80" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(54, 54)">
              <path fill="#ffffff" d="M0,-30 L-20,-23 L-20,0 Q-20,20 0,30 Q20,20 20,0 L20,-23 Z" />
              <path fill="#0f172a" d="M0,-26 L-16,-20 L-16,0 Q-16,17 0,26 Q16,17 16,0 L16,-20 Z" />
              <path fill="#ffffff" d="M0,-10 L-2.5,-2 L-10,0 L-2.5,2 L0,10 L2.5,2 L10,0 L2.5,-2 Z" />
            </g>
          </svg></div>
          </div>
          <div class="content-card">
            <div class="greeting">Hello${username ? ` <strong>${username}</strong>` : ''}! 👋</div>
            <p class="message">Thank you for registering with <span class="brand-name">Blotter Management System</span>.</p>
            <p class="message">To complete your registration, please enter the verification code below in the app:</p>
            <div class="code-container">
              <div class="code-label">Verification Code</div>
              <div class="code">${code}</div>
            </div>
            <div class="expiry">⏱️ <strong>Important:</strong> This code will expire in 10 minutes.</div>
            <p class="footer-note">If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 <span class="brand-name">Blotter Management System</span></p>
            <p>All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `, <strong>${username}</strong>` : ''},</p>
            <p>Thank you for registering with <strong>Blotter Management System</strong>!</p>
            <p>Please use the following verification code to complete your registration:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>� 2025 Blotter Management System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`? Verification email sent to ${to}`);
  } catch (error) {
    console.error('? SendGrid error:', error);
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
            background-color: #0f172a;
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .header {
            background: #0f172a;
            padding: 40px 20px;
            text-align: center;
            border-radius: 32px 32px 0 0;
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1877F2 0%, #3B82F6 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            box-shadow: 0 8px 24px rgba(24, 119, 242, 0.4);
          }
          .content-card {
            background: #1e293b;
            padding: 40px 30px;
            border-radius: 0 0 32px 32px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
          .greeting { font-size: 18px; color: #ffffff; margin-bottom: 20px; font-weight: 500; }
          .message { color: #94a3b8; margin-bottom: 15px; font-size: 15px; }
          .code-container {
            background: #0f172a;
            border: 2px solid #1877F2;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 12px rgba(24, 119, 242, 0.2);
          }
          .code-label { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
          .code {
            font-size: 36px;
            font-weight: 700;
            color: #1877F2;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 20px rgba(24, 119, 242, 0.5);
          }
          .expiry {
            background: rgba(245, 158, 11, 0.15);
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #fbbf24;
          }
          .security-notice {
            background: rgba(239, 68, 68, 0.15);
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #fca5a5;
          }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
          .footer-note { color: #64748b; font-size: 13px; margin-top: 20px; font-style: italic; }
          .brand-name { color: #1877F2; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo"><svg width="80" height="80" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(54, 54)">
              <path fill="#ffffff" d="M0,-30 L-20,-23 L-20,0 Q-20,20 0,30 Q20,20 20,0 L20,-23 Z" />
              <path fill="#0f172a" d="M0,-26 L-16,-20 L-16,0 Q-16,17 0,26 Q16,17 16,0 L16,-20 Z" />
              <path fill="#ffffff" d="M0,-10 L-2.5,-2 L-10,0 L-2.5,2 L0,10 L2.5,2 L10,0 L2.5,-2 Z" />
            </g>
          </svg></div>
          </div>
          <div class="content-card">
            <div class="greeting">Hello${username ? ` <strong>${username}</strong>` : ''}! 👋</div>
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
      </body>
      </html>
    `, <strong>${username}</strong>` : ''},</p>
            <p>We received a request to reset your password for your <strong>Blotter Management System</strong> account.</p>
            <p>Please use the following code to reset your password:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              <strong>?? Important:</strong> This code will expire in <strong>10 minutes</strong>.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <div class="footer">
              <p>� 2025 Blotter Management System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`? Password reset email sent to ${to}`);
  } catch (error) {
    console.error('? SendGrid error:', error);
    throw new Error('Failed to send password reset email');
  }
}
