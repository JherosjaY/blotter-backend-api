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
