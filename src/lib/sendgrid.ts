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
            line-height: 1.6; 
            background-color: #f5f5f5;
            padding: 40px 20px;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .email-container { 
            background: #f5f5f0;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 60px 30px;
            text-align: center;
            border-radius: 0 0 32px 32px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3);
            position: relative;
          }
          .app-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto;
          }
          .content-container { 
            background: #f8fafc;
            padding: 40px 30px;
            margin: 30px;
            border-radius: 32px;
          }
          .greeting { 
            color: #1e293b;
            font-size: 18px;
            margin-bottom: 16px;
          }
          .message { 
            color: #475569;
            font-size: 15px;
            margin-bottom: 12px;
          }
          .code-box { 
            background: white;
            border: 2px dashed #3b82f6;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
            border-radius: 16px;
          }
          .code { 
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
          }
          .expiry-notice { 
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
            color: #92400e;
            font-size: 14px;
          }
          .footer { 
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #94a3b8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Header with App Icon -->
            <div class="header">
              <img src="https://i.imgur.com/YOUR_IMAGE_ID.png" alt="Blotter Management System" style="width: 120px; height: 120px; margin-bottom: 16px;" />
              <h1 style="color: white; font-size: 24px; font-weight: 600; margin: 0;">Blotter Management System</h1>
            </div>
            
            <!-- Content Container -->
            <div class="content-container">
              <p class="greeting">Hello${username ? ` <strong>${username}</strong>` : ''},</p>
              <p class="message">Thank you for registering with <strong>Blotter Management System</strong>!</p>
              <p class="message">Please use the following verification code to complete your registration:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="expiry-notice">
                <strong>⏱️ Important:</strong> This code will expire in <strong>10 minutes</strong>.
              </div>
              
              <p class="message">If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>© 2025 Blotter Management System. All rights reserved.</p>
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
            line-height: 1.6; 
            background-color: #f5f5f5;
            padding: 40px 20px;
          }
          .email-wrapper { max-width: 600px; margin: 0 auto; }
          .email-container { 
            background: #f5f5f0;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 60px 30px;
            text-align: center;
            border-radius: 0 0 32px 32px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3);
            position: relative;
          }
          .app-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto;
          }
          .content-container { 
            background: #f8fafc;
            padding: 40px 30px;
            margin: 30px;
            border-radius: 32px;
          }
          .greeting { 
            color: #1e293b;
            font-size: 18px;
            margin-bottom: 16px;
          }
          .message { 
            color: #475569;
            font-size: 15px;
            margin-bottom: 12px;
          }
          .code-box { 
            background: white;
            border: 2px dashed #ef4444;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
            border-radius: 16px;
          }
          .code { 
            font-size: 36px;
            font-weight: bold;
            color: #dc2626;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
          }
          .warning { 
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
            color: #991b1b;
            font-size: 14px;
          }
          .footer { 
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #94a3b8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Header with App Icon -->
            <div class="header">
              <svg class="app-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer Shield (White) -->
                <path fill="#ffffff" d="M50,10 L30,17 L30,40 Q30,60 50,70 Q70,60 70,40 L70,17 Z" />
                <!-- Inner Shield (Dark Navy) -->
                <path fill="#0f172a" d="M50,14 L34,20 L34,40 Q34,57 50,66 Q66,57 66,40 L66,20 Z" />
                <!-- Badge Star (White) -->
                <path fill="#ffffff" d="M50,30 L47.5,38 L40,40 L47.5,42 L50,50 L52.5,42 L60,40 L52.5,38 Z" />
                <!-- Accent Lines (White) -->
                <path stroke="#ffffff" stroke-width="1" d="M40,25 L60,25 M40,28 L60,28" fill="none" />
              </svg>
            </div>
            
            <!-- Content Container -->
            <div class="content-container">
              <p class="greeting">Hello${username ? ` <strong>${username}</strong>` : ''},</p>
              <p class="message">We received a request to reset your password for your <strong>Blotter Management System</strong> account.</p>
              <p class="message">Please use the following code to reset your password:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
              </div>
              
              <p class="message">Your password will remain unchanged if you don't use this code.</p>
            </div>
            
            <div class="footer">
              <p>© 2025 Blotter Management System. All rights reserved.</p>
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
