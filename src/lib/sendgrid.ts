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
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfcAAAHwCAYAAAC7cCafAAAAAXNSR0IArs4c6QAAIABJREFUeF7svQd8VFX6Pn5umZYOiJACgoVVsa3YwBaSAFICbEEFFdTd1f3t/nXVry7FFtuC6KprQSkiq7gWFClKaCoqgiJY2AUFkSakIiUJyZRb/p/33Htm7tzMZCZTkinv9YNp95x7zvOeuc953/MWjuCFCCACiAAigAggAimFAJdSs8HJIAKIACKACCACiABBcsdFgAggAogAIoAIpBgCSO4pJlCcDiKACCACiAAigOSOawARQAQQAUQAEUgxBJDcU0ygOB1EABFABBABRADJHdcAIoAIIAKIACKQYggguaeYQHE6iAAigAggAogAkjuuAUQAEUAEEAFEIMUQQHJPMYHidBABRAARQAQQASR3XAOIACKACCACiECKIYDknmICxekgAogAIoAIIAJI7rgGEAFEABFABBCBFEMAyT3FBIrTQQQQAUQAEUAEkNxxDSACiAAigAggAsERAJ5Ukw0gJPdkkxiOFxFABBABRAARCIEAkjsuEUQAEUAEEAFEIMUQQHJPMYHidBABRAARQAQQASR3XAOIACKACCACiECKIYDknmICxekgAogAIoAIIAJI7rgGEAFEABFABBCBFEMAyT3FBIrTQQQQAUQAEUAEkNxxDSACiAAigAggApEhkLAx8EjukQkUWyECiAAigAggAgmLAJJ7wooGB4YIIAKIACKACESGAJJ7ZLhhK0QAEUAEEAFEIGERQHJPWNHgwBABRAARQAQQgcgQQHKPDDdshQggAogAIoAIJCwCSO4JKxocGCKACCACiAAiEBkCSO6R4YatEAFEABFABBCBhEUAyT1hRYMDQwQQAUQAEUAEIkMAyT0y3LAVIoAIIAKIACKQsAgguSesaHBgiAAigAggAohAZAgguUeGG7ZCBBABRAARQAQSFgEk94QVDQ4MEUAEEAFEABGIDAEk98hww1aIACKACCACiEDCIoDknrCiwYEhAogAIoAIIAKRIYDkHhlu2AoRQAQQAUQAEUhYBJDcE1Y0ODBEABFABBABRCAyBJDcI8MNWyECiAAigAggAgmLAJJ7wooGB4YIIAKIACKACESGAJJ7ZLhhK0QAEUAEEAFEIGERQHJPWNHgwBABRAARQAQQgcgQQHKPDDdshQggAogAIoAIJCwCSO4JKxocGCKACCACiAAiEBkCSO6R4YatEAFEABFABBCBhEUAyT1hRYMDQwQQAUQAEUAEIkMAyT0y3LAVIoAIIAKIACKQsAgguSesaHBgiAAigAggAohAZAgguUeGG7ZCBBABRAARQAQSFgEk94QVDQ4MEUAEEAFEABGIDAEk98hwS6dWsEbUdJowzhURQAQQgWRHAMk92SWI40cEEAFEABFABEwIILnjkkAEEAFEABFABFIMAST3FBMoTgcRSBME8LgoTQSN04wMAST3yHDDVogAIoAIIAKIQMIigOSesKLBgSECiAAigAggAkERaNN6heSOKwcRQAQQAUQAEUgxBJDcU0ygOB1EABFABBABRADJHdcAIoAIIAKIACKQYggguaeYQHE6iAAigAikMQIYRaELH8k9jT8FOHVEABFABBCB1EQAyT015YqzQgQQAUQAEUhjBJDc01j4OHVEABFABBCB1EQAyT015YqzQgQQAUQAEUhjBJDc01j4OHVEABFABBCB1EQgluSOXoqpuUZwVogAIoAIIAJJhkAsyT3Jpo7DRQQQAUQAEUAEUhMBJPfUlCvOChEIBwGeEMIPGEC4lpYzue3bt6uEEPin6P/C6QPvQQQQgQREAMk9AYWCQ0IE4oVARUUF37179xNHjRp+BaeqRdm5eXnNTU0Wu90uut1uRRAEd7PT2fDii7N+OHiwZvPChQur4zUW7BcRQATihwCSe/ywxZ4RgURAgCsuJsKYMRVZNtuJPQYPvvx3PXv0GCKKYv+s7OwcZ0uLYHc4iMft5ixWq0pUlSMcp0hud53L7f7pxx0752/fuu2zzzdvrtu+fZZz3ToiJcKkcAyIACLQNgJI7rhCEIEUReCWW26x/H7syIvOPOvsYbzAn33iiT0ukSSpCyHEZrPbicvpJPDV43YTi9VKiKoSl8tFrFYr4Xge/q7yPN/Mc1ztocOHP/G4XDvXrV1X+fJrr21bt24dknyKrhucVmoggOSeGnLEWSACZBwhQn1xH8uttz7Y02aznX7lFaV/yMnJPpfjuD4cxwlwvs5g4riwPvqqoig0CobjOIXneY8sSQerq6vf/+a77977/vsff5w7d+4vu3btcutn9SgFRACjphJkDYT1CU+QseIwEAFEIAAC48aNE3r37tLlT3/467isnJyzc3JyL8rOzj7d7XLZRFEUgcgZmasq+MuFf4EGTy8VLPYq1egJIbLk8TQ6Xe6v3C3ObXv37Pt0wcKF65977rlDSPLhY4t3IgLxRADJPZ7oYt+IQJwQKC4uFm+//aZcQcjrcsopfYf1Kuo1KSc3p58iy9m8IHD6GTolZWLQ0oGgjQQf6gXgdru9ZnoTwVPKB6J3OZ2/qKq6d8fOHU/t3v3jf/859cEDBTt2NC8iRI7T9LFbRAARCIFAqM82AogIIAIJhEBFRYU4ZszIiwsKioa5na4zMrMyz8rLy+vLcZyFmd09Ho92hh7gMpM7H8o838bfFVkm8Cw4t4fQOY/b7fJInoONxxo/bna2bP33v+cs3r59T+2iRYuQ5BNoDeFQ0gMBJPf0kDPOMokRGD58uO3WWyeemJPT7ezevfuO7dolr6xL166FsiSJROXhM8wJokjcLhcRrRbC87xmQuc4oigK/crM8grRzes6aXMhrPRsMwD9wCUIgrd/+J0gaK8QVVGoM57d4VCdLS2KxWJpbGlu2XO04djS3Tt3fXaksfHH2bPvrqusxPP5JF6KOPQkQgDJPYmEhUNNKwS4iooKx4QJ15R073ZCqcvlPiuva5fzbDZbnuTxiIxoZUklosVCQIsGUic8R2RZU5QZwfuduZs+8aHIHfoJ5HzHSJ/jVEJN9xYwHBDvZoIXwH+PKERVZafT2eByOf8nycq2qqoD7y9c+Ob6mTNnNqaVNHGyiEAHI4Dk3sGA4+MQgWAIwDn6jBkP9xME65ndT+x5UUHPHsWiKPY5fvx4F4fDwQuiyMmSxDGypmfnKk+ASGVF9mroQO6gYcN9sqpp7sGuUORuPJ+HftmGwaKTuSx76LPgamlpIQ6Hg34veTyU6OF+MNvLLrcqWK2w62h0t7Ts2r//5/eanE3b9+498N2jjz56cMuWLR5cGYgAIhA7BJDcY4cl9oQIRIIAaOhcv379zrr00oG/LcjvOUIQxLMVRbGoqgqu6Rxo5EDgNB7dYtE0ZatV05KJQD3Y3R431dxFUaTn4HAf1eB5zSQP/1FtnvrA+a5wyN2o+TPtnPUAxgJJ0kLe4dkwNiB7RvhgrocLxihLElElmYg2qyq7PTJvEZtcTvfmmrq6Fc8+++zbTz/99MFIAMQ2iAAi0BoBJHdcFYhAxyPATf3rX7uOuWHCgO7dTjgrJ69rcV5e3uWiKGYzpzhVVbm2wtbY38KMV9cINpTzXJg4BBtXOP3DZkLlCNE3FSrhFNiMuERRqK8/dPjT2uqDn/Kibfu0adO+W7ZsWROG1oUpFLwNETAhgOSOSwIR6DgEuNmzZzsGXz5ocNdueTd2O7HnpW631F0UrTxcQJrMAY6en+vn5u2NTQ82nXDINxwooiH3Vv2rMtPqVUEUwe7vcrY49x1rbPhs06Yv3vj6661fVVRUNIczLrwHEUAEfAggueNqQATiiAAkmBl6xRW9Lx9SMiAnJ/t8h90+PCcn51RVVTN5nuc4HnzjvInjvGfaMCRG9ObhRUr2iUjuHreTWG02euQA5n1HRgZpPn5czcjMVNwuVzPHkT3NLc73D9XWf/Xaf/6z+aGHHqrCinVxXLDYdcoggOSeMqLEiSQSAhCP3rdv3x6DBl1yTbeuXctycrIHejzuDKi+JkkSD0QriFYiSb5QNaatM42dOcZFMy+/hDUJYJY3zwW87dnlzXEPznnNzZToFVlWm5ublczMzGPNzc3fbP9++ysbNny5dsmSJb+sW7cOHPTal3IvGjCxLSKQRAgguSeRsHCoiY1AeXl5xuS77jq/sE/vs3Nzci7v0rXrlYQQKNTiAGcy0Eyp57getqZp0lpMulkb9/OIj2LaCU/uhJ65UysFYANe9syBkIb36Z74OgSq5PHIosXS5Gxpqayrr//v8eNNm1999fXNM2bMOIpEH8VCwaYphwCSe8qJFCfUgQhwDz44zlJQMMDBcdl9fzv2tzc7MrNKLaLY22Kx2FwulwUSu+Tk5tIhQRU2SDYDRAbe7prXu70VsRvj0yM1wRPqHU83DaDZ0s95IprliX7mbvSqh2Q8YKoHoocYfrjo76xWb357j9utWKxWcMWvbmlu3vLpZ58/+913323evHlzM2bE68BPAD4qYRFAck9Y0eDAEhQBbty4cZYJEyYUDBhw3iUOq+ViUbBckdMltx8vCHZfghkLK7JCydztlmh4GoSIgabKSAu0U0bmLHwM5s3O26PVvKNtH0gGsXSokyW3FwtnSwtkuKMJeQAjIHOwclCsaI58ukWhQ/Jq9VqZWsVmtx93Op3fNzc3rzp69Mimd9557+uffvqpfs6cORg/n6AfJBxWfBFAco8vvth7iiDw4IMPWrdv39719tv/cvrp/c4YnZmVOdBms53Bq0qmLMu8YLPyoF0CgUNMt+TRksooqqrHnGvpYOECcgRzM8Sm2yyaNupvqveBFshc3x5IoyL3IMU7Y0nucOYOWruRxOlmh+f9CByK31BNXhS92rvRbE9T74oiaPKyIsu1kizvPnL48Kc7f9j50dbt23+srKysr6ysxNK07Vk8eG9SI4DkntTiw8HHGwHIGvf4o4+ed9KpJw/r0aPHX1VF6crxPDCy/tnRkrSwi/3a5+Xl84SnxM4+cTQ/DeSYMVVpM2wAqJ4agRNcIEJvy7xvPN83tw11LBDJ+Ix4KYqWACfYFap/L5x6KVvjeFVVlVRV9Vgs4r5Dvxxe8cUXG5a/++7SLxYsWODC8/l4f3Kw/85GAMm9syWAz080BLgZM2bkdO3atej8c8+9wGK3lZ5zztkD3C5XH6vV6lAUhQOtG7RNWttc9S94lmzkbjzfZ1aF9iTICUy+QVT+AJJWTfi1dzEYX2Bs3EaCBydGURRlQRAgLGFf8/Hm3QcO/rxo8+avtm7YsOmnF1544QiG1rUXdbw/GRBAck8GKeEY445ARUUF39TUdMLNN0+6tEeP/PK83JwSVVVzeJ7PkWVZAMIwllEF5zg4EzbWSvdp76C3+2vs5gkwDZ4nnH999Tho7m1r7b7jAjO5h2c5aHueoQQXyjIQqr3Z8sHmwNoxb3uj6V/yeDyixdLc1Ni07mDVgXf+9a/HPvj++6rGdevWtW1GCDUY/Dsi0D4Ewt8Ft69fejeSewSgYZPUQGDAgAGWaXfdVZCZm9v7zLPOLO7WrdtQm93RjxA1D97/doeDZwVQwHvb76IOXv7EHIjcQbMNRGCJSO5mzZdp9cZ5t9bUoyP3UCspFPkDufvj7t8jaO4QWgdRCszawmLoVUVROZ4/evTokR/dbunzL774crkgSPveeWd5FZruQ0kG/57oCCC5J7qEcHyxRoC75ZZbxJtvvvmc/B7dh/Y6qc8Et9tZJAiiXZZlG5RcA40cSAE8tlmVMyAZCGsDhy6m0cLvBMHiO0eH3TLkTtfPf82ar/Z7/zN6jhPiqrmbwWttcvcfj5EoqeOfngY3mBBg/PG8QpG7ebNhvh/Gr5vm/bL/wZi1JEEcFLSBiEGInweHu5/q6urXVlcfWD5hwsTPt2/fDr/DCxFIOgSQ3JNOZDjgSBB4++23u9ps/Mn9+p3ev3u37sXdup9wpaooPWVFscmyDJXXOPB0ByJgGisQOcsSB79nZVTZ8+FvnKCRPbtCV1nzP6PvSHIPtOmgbgMBNiPwO/bPO7cAzn2dTe7mtRCI7GGTZtMtL7BBg+8Z4UMoHmj1cDlbWlS73a7Ksiw3NTUdbGlu+d+xxoYle/bs2zp58uTtW7duhRz3mBEvkg8gtulwBJDcOxxyfGBHIQDn6DabLXfUqOEXnnTSSX8SBfFyR0ZGDlFVG+E4SA1HVMJrdc9lmb7wgcBphjSe92rq7O+M7DWNXauXrgY72dJZ3kf2uoZsIFKKQ4w1d/hAQ/hdoMus1Wpe8tq9Zsc69rtA+e39CTSwWT7cw8RQmnkka8U4PuOxCHxv1OI1ywQhittDeJ3gZY+HCCyuXlUlRVGcLper1ulsWXHsWOOHTzz99IezZs2CanV4IQIJjQCSe0KLBwfXBgIB+QPO0Zubm0+YPn16/wsuOP/KE7p1+40gCD1EUewGZ+SyJIHlncaZUycrRatDzl76QGaMvBnB0Rhs/eXPND/4G9XcQZuFmukqR1RONXw1j1yva64TqU/Vb79Z3lAyNTwSh6MAlScqkelXKLNK9xUcpyqKIquq7FIJ/wvPqV05TrBznMqrKseDJztPC9vA/TwhPJw56O1VbVOkkXPk5+7RknsgvwB9bnSOIE/YiBlJnf2O1r0XLURRPPrUOFpvnhMFwikqUWCFyQp8VUSOVzyydFj2SDuPNjZ8vPOHnV94FGXXo48+uhsd8fA9lYgIILknolRwTO1GAKqvjRgxovtllw28tkePnsMsonih3eHIUhTFStk86NV+YmptxlYIB+TJaV8VIuvJX4M/1ZfQpvXQKGm2MWIZLAegdRNIkqNtRsDrXjsf952he1O6giWZE4jkaiGizUGIIkmKJLl4q9XpPNbw7f59+9Y2HG34LrdLbr+CXr1GZGZmnKNyXDbhVJvHLYnWDDshsko5XAHSUyBrnFXPGifQ1LAQSUCT9ugJaeCIg5KrlgKXfm8+76cmfSXw5sBoUdBQDOwbEO6xQLBNBNuggAEDxmqsN083UfS3mucxWEQ4bdYeKE1LCNl5+Jf65TV1tcsfffTx7zDtbbs/ttggjggguccRXOw6vgj8/e83Z5dfdf2ZJ+afeHpOXt7wDEfmr3NycwoJIXa3y8ULgsDRWPQ2k8FER+5Gb202WyORBDKQG/ca3lw4Jqi83vQcDynXvGZzIHCgGDhQACIVeaB1jlohNI1UO2IASwOtsmYRKSO7nU7Zard7Go8d22+z2nbs2Lbtg6++2vI1Ic1Vsxa8Xb9lyxapuLhYGDt2SLdsPrtnYd/e5w8cePEVObldzjve1Ng3My/XQRRFVFQVSs/rRM0RrWQtoZoxI3AgdqNVg/0+4LEATebTWgYdRe6+Z2ubJHb5Nl/+PhKGtQQ3qzxPPKoiH5YlefNPe3Z/ePBg1X+feurZbz744AOIn8cLEeg0BJDcOw16fHAECHB33313xgUXXNBTEMilZSWlV1isVkgD2xsIXVEUEUiNvZhpClPFa4IO8rjoyD2QUaAtU3NbRgSzNz38zEzIGqlrFxA7e4YiyTS9rVc7VhR65ABx+FBlTXF73KqqHnY5m9cfPdawubr64KbllWu2PPTQQ42hnMPGjRvnmHr33ed173nCRRk2+8V5XbpczolCN47n7c6WFg7ywMuSQi0GbBNlBDlQfnyzRQIsHYGu4F7wraMNwllHocz/gYhd69f3PO+6MhiCFFmrYqfA+YYsQzGbQ/v27ln30+59q3fs2LZh796qqpkzZ8IZPTrihSMovCdmCCC5xwxK7ChOCHBnnnmm5d57782/+MILxxT1Lpxos9l7y5KUIQiCQ2dyOPylRAj/KNnoJuJWmnurk/rYk7sRh0DaajCczOROiRxMwfrZNtuo8KJABE4bN/MRgO9p4RmtE9nlcjULgrj94P59K5a8v+LfO3fuPDxr1qwW+FsEcuJnz66wy3Jer5IrS4f16NlzdF7XvAs8bneGxWoXFFnmYUPB6rEzvwSv9m54IDV1G09J6MF26yv4JsisYYcXiheM3IPJx6y5ByJ2ij+QuyCALwf1uve43arFalVVhbgVRW5SVbK/qaHh31u3fbfmrrum7NqyZQsWsolgAWKT9iOA5N5+zLBFByFQUVFxwsCBF555zlnnlNvsGRd16dL1IsIRq8fjAZO7pjHJWi1w6r2uxXV5s8ZBYRGWQS44WXQcubet5Zs0Uh1jncO1nwxzAzM8lIxlIV5UM+Q4mRD+SHX1wXddLve3K1Ys//T991fvrqyshPPhmFzjxo2z3nTTTaeefvppgzIdGb/O69LlKlEUe/GCABVdOK+DGxC4oU49PbcO4PoQ/Cw8OGmbtexwPPPb0twDae2txxrcAkST47C5wUZMT02sf1VURXHLsrS1tqZ27fGW4x+9++7Sb0899ZujV1+9KJKNVkzkiJ2kPgJI7qkv46SaYfmAARmPzp9fWpjf87fdup8wUpFlG8/zmarC8RzPc1BJDZLM+By3NK93uLzaOg3x0sKeWPpR9ncjGBoRhaf5+beD5wV2hDODHcybm93nI5bA5O50NlOzu276pc1YqB4URuF4XnG2tNRxHLdjz949C9et+3zNRx99VL9o0SLQEONqCoZKeVlZWXmjRo34zYnduw/Jysq6yGqznUgIEY8cPix06drVK5tAA2kLm7bkEtyEHnyphzLLB2rpT/CBHfpgA8OsQ5D5DjZb8CwaO6+qmpc+HJto2fDk5uONxy0Wy9Gm402r6urqX503b8G3Tz755PGk+pDiYJMCAST3pBBTag+yoqLC7vF4etz6p5tLbQ775V27ditzu9w9bTabIIgiXaNOp5tq50B0xnro4M1sNE0HInGGXqBz3MjI3ZDy1PAJCqSZhkpq4+fdrnlj6xfbsOiWBerODSFt1DLhkmXZKUmerw/+fPBTRSXfzJ3/4ld79tTWdpLHNv/ss89mDRtWViII/Nn5PXuOysjM7ON2ubpwHGcBXNi/ViuZN72C9DN4nxlc23z5OSkawu+Y412oT0hb3vLm/o19BdPgvWuK0KMQ7TgIjkX0S5Z9yXG0zafh7J7nFY/b7Xa53PsbGo99un//vjVr1366xWptrJs8eSb4QuCFCESNAJJ71BBiB5EgAKVU//a3vxWde9avSgvyC26wZWae5XI6s2z2DKuqKF4vd3gpwz+ItzY6aLklD7FZbURVJEO8tabVsrN3M6H4e6lrBN3Z5E7rmRuTznhN2Tq509AzKEVH4CyiWZHlfQcO/Lzmyw2bX/vsyy93PvfcczEzuUcix0BtQKO/8Nxz+1006KI/ZGVnX8wRrj8v8Fae5y08zwt+cjC/gcIgd42MtYadTu407l87gmDZDGnteclFNXZWc97jdtJwQb3uPN0I6PXpVY/H47RYrR63y7V33/79C//zn4WVVVWHds+ZMwd8JOJqfYmVzLGfxEMAyT3xZJKyI6qoqBAzMzO7Xnjhr0/p1+fkkdm5OQMdWVnnE6JmgIanWdZ17afV+aymwTJva0aIPh9yf+0uEIiBz92jO3OnsdG6ZmrUAJnGTk20Bo0O7qFaHgf+AjLhNcOE33k6/NjS3KRarVZVEMQWoqqHa6tq1jQ2HlvX0HDsx4rHHt+6fPlySIWa0NfAgQMdf/nLn84477zz+2dn51xYWFg4TBTFfEJIlrOlhdgdDg7SvwJGEOVAzfQ8TwnQanNQfOACIlQkthmD8DueOu/RyAiBheWFhiKw9m42t4cKnfR/DmwytKUaLCug6VhdTyDE1opmkNHGAKVpCSEep8u568jhIxsbGps+2LTp043r1887MmcOOuKFljDeYUQAyR3XQ7wR4MrLyx3TH3nk8twuucVFvXtfTQjp0XT0iC0rL1cEL2Mj6SYbudNwOz2RjKZJaiZoiD5nF2h0cAHJA8HIHu0clmWKoxqclvRFbWluViwWiypahGMup/Obqv0HPq78oPLt+oaGvRUVFclckpSbPXt2t8sGXvy7/ILC4ZlZmRdyHNdNEDiRekeqKnUQZNX3GhuaSHZOjm/jQzTfCsAb1ow3/I4qzaGV2+D3tCb3tsIVzR8WX54Cg1Od4aZW9eoN5E43Lvomj0V5GErUqpIkSYIgHD165MhrB6qqPvjww082NjQ0uCoqKoI4AMT7o4z9JxMCSO7JJK3kGSs3a/r0PHuXLvnnnn/eZTm5eSUnn3LyAEJIkaqqFkEUeUWWOWbGZK9m80vV/2d/DVvLG+Zvlg30AjeeeQf21tbIuD2Xn0MXZG0zkDtNKeMXBy17C5P4TLda4heP00ksDruWG01RZEmSGlRF2bF3//6P3W7Plk2bNmxb+c/n9yxKocpkkEmwb9++Pa753e/Ot2dlnN2rV0GZ1WI9i+f5LhbIuMMJpKW5mXNkZGjpgVnqX4YpK7WrRwuYS/Ey2QQ6gglHxr524Vl0wtlYaM8N7pDHxkUzDJrXoqpCimCJ40h1w7HGz6uqqj/f/sPWz375pbHq1ltvPRy843Bmi/ekMgLte6ulMhI4t6gRgBd3v379Cv7851uuyspwjMvr2u0SRZbtECblcbtpFlhvZTU9Dj3Qy9g8EO2FG5rcje18Zvu2l7gxQ1y4JG98odNUs/oLmWrteslXdg/Ml8V/0/FBMntdHyU8rxJOccseqbbxeOPyHTt2vvXWW+9uefrpp53pctZ622232Yovu2TQZcXF47vk5ZVwnFAo0rR6BOLnOaOTGpjpNf8LX9Kc1o52GrhMJuGTr3+7cPPlB/Pcb/3cIKV19TA64zxZCCGLJmCRH/TzI4qK5PG4RIv47fz5r7zM8+KHGzduPDhnzhyMn4/6DZZaHSC5p5Y8O2U2N9xwQ+bVY8f+6tcXnD8sMydnVF5e3tmKLGfQqC3Ih6pfPuciN63GxkLajFnLWlVR09sG1roh33nbSziUt7o5/Ws4BO9H7gqE22nmVaqfGXK9074YmQuCZmqA5Owc55GczkNNzc2bf66ufvvAgf377r//4W+2bNkPblSaAAAgAElEQVSSrg5U/NixY3PuuOOOM7KzM37Vu6j3kOyc7CsIId1sdrsNiv0QrYwLtYLQM3lwToP0ula7d82bCRXwbw+5R+aTEfjMHgYVzrO1egCBy+6yiTELFz220MNAJUmSrVaxxdlyfGtVdc36jRs/f2fevH9/v27dOqxY1ylvwcR7KJJ74skkaUYEFdhmP/fc6Wece86dAsf91mK1ZIKWzkgcJtJ8/DjJyMzUvmYA31O1imriENIG2daMVzByN2pj7H768oyA3P1fuv4WgfaRu/5ih4IxOpEYLQa0L8gVy3GyDJFPTtduTiXfHms6tnvLd9+8tfmdZXsqFiwALR0vAwK33HKL5dRTT+193XXjf+fxuM8+6aQ+v5Yl92kCeJxJEj2iZ6FnbHMWDpGaQWYya1vmoczz/ulpzZvFgEdFBtN7q3Wjkz0bq9PpJHa7toGhIaB6emUtl79CBLDk8zz8cLi+vu6ddevW/uPqqydVo7keP1JI7rgGIkKgT58+9sWLF//p9F+deoPD4TiTEOLw2s7BgUy0aKE+enUwIHN4ITHTPHsoOzsPZsY0n5lDXLtfW05gBUkDziOQ5t4WuQfaRJg79rXXSF1RfX5ucOauKIqqeCTINe6yWCzVR44c2bl39543ao/Uf7Pt0y/2VW7a1IJlQkMvOzjm6dKFZJVdMaZ30cm9S885++xyURT72+z2PJezRbTZHVCaVvNVD8Opzm8TGbafRTByZ3nxgpjbW5X1Y174vlFAD1AUiDlhGo8SWO4GFkUAxA5aO1yM8GXZQyDaAHaQiqKqgiC0cIT/7LPP179YUjJkWboc7YReSel5B5J7eso9qlkPHz7cNmTIkGtv///++rBgEXu5XS2c1WqjpUB5XiCyDHm2tRcROEVRD3GF0AQ05lzo8DdzeJs2OP2lSa3YLKZZX66stKreti3NKxJyD0Xw9CyU5lOFuWnnwHDxPK9yHOfyuD2NLcePb2lpaf56584fP1224tX1Tz75GmYhi2rVEe7mm2/OuvPO20dkZTku7tql2zkWi+Uch8ORSwixaCSv1Z0P5TsfjnXGN9S2yB02FVqCmtZn/FqIntlBz7ynMP5MPwt6G7NDIPxM68/rnyHN0RBqKFAnDzpcyOkvCBZJEMT9b771+vUTJkz6Ig0Jnu26wllt7bm3M/oL55lB70Fyjwq+9GsM2tTDDz94c98+faeIotgH6n+yetfsq7/Hb9tmzWAOdV5NLKDZXaubHuqiWnXQ+GNGAb566GBZAO2InnHCQTrQBcSiM1Op/iamIVlQZlWWCQfh2bKscKJ4vKWpqcrpdn+6cf3nr//vh1275s6d+8uuXbs01QqvWCHADxw40PbXv97cLSenW78B5543/sSeJ14q8mIR4VS7LCkCbxF5RpLUAQ+cGj2ahkzTwoKJW/IQi2ihxGg0z4NZnaYt5nm6BuBURbsCvypV0+7RmN8g1CYxFoBIEpT11aoC0k20R4FkOXJTY+NXn3z80f+NGjt2Qyyeg30kHwJI7u2TWax3eu17egLcvWTJG70uv7xsQZe8vGJQk0LVKw/pdazoPZhIvG1y9wEBL1Pj+9XPOS9McmcV1ozweiuw8byvfColekFLA0v3NIpHdjkPHG9sXH+48ej2LZu+Wv3+qle+X7BgHZ6jd9BavfHGG+3jxo497YLzzxnW4nL1696jx+CM7KyCxoZGW3ZOjqAnyyFut75xUzUtG/4D50ej7LVYcy0TImzwWA7/RCZ3BjNsSIDkJbfmNC9aLHJNddUnq9euvXrSpEm/dJA48DEJhACSewIJI9GHAlr7U0/NfKyosNdfjx8/npmZlcUxEjSO3d/sGULDDkHuXnMn9U1rrT9x1CzqO3MNZXI1HwFAPXReD9GDDQWYPqEPSBVKNTzqkW2lD4AXqKqqsqIoVYqiHPxhx/dv7t35w5qPP1918L//fb153TqSzElmEn35hRqf8Pjjf8/odeIZhb++4Lzf9O7TZwThuD42m62bIAgWPc8wJPulmrlFtNH+aGEXUSN0+AffGy+zg5x5EMHO+kOtw1CTCffvXo1dlqnVSZX1aoGaE17zzh93/v2+++57qZNqDoQ7DbwvDggguccB1FTt8sUXX+xz8003LrfarP3pibOhpGpHkHsgXM3kDve09WI1h91R0z1oaeCBbfrqdQhUVfAE9Hhc7s01tTVbXG7XhkWLFq+bNm0aaESYLSzBFnxFRQW/d++3OdOmTS+x222/7ta161UWm/UMjuPskN8YzO2SpJUJNq4XRpSM6KlpXqCZA4NenU3uLMkPbFJoDgnCabXltYgCtaGhYf3jT8y8ecaMGbsSTEw4nDgjgOQeZ4BTqHvuxx9/uPnUU0978nhTUx5oOFDeUgngpRxzzd1wGNLKCRlO1ZmDmw52e7Qm+iKEVyJkQJVl5vAni1YrHNJ6XC7nL02NTZu2fb/ttZ07f/py8eLFRysrK/EcPTkWNnfqqada77jjzz3POOPsUwYNGnSLRRAHChaxJ1iuYR/oLVKkZ75rdYwUwgtfab0g/TYMHQETrHcgd9iUWMGPwOgbwnGufT/v/78+ffrMQt+PjpBG4jwDyT1xZJHQI7n77rsz7/zbbU+f0L37H6w2G8u80THkbkDG/C5lubvNXvHBCJ45T1GNDf5Hbf0ckVwuItpskATeSVT10C919R85nc6tx5obtr7yymtfPvnkk1CoBR3jEnqVtj24cePGZV177e8vHDBgwKUW0XJWQWFBGSEEvO1pNjwtWQxY8H3RGaFC7IDcA6219mwwo4GUOQ6y3PTU0VOPUKFZ71RVPXLk6CdTpk0ZilnsokE6+doiuSefzDplxDfccEPfV19dsFbyePqqqsrBOXQszPKhvOVDvSQh/atfrewg2rsWumZY7ppGphKVV4isHHe2tHzfcvx4TbPk/nT9x5+8P//11w+uXr0aMsah2b1TVlxcHyr8/e9/z/jVr04++dKBA0f16NGzJK9LlwJCCPxzEI6zsLz2vop+gX1Hgq3fVjnig04ndNRHW0gY4+HpfRAZp/sP0LFzHOTqP/DMY4+eN236dHSsi+uySqzOkdwTSx4JO5r33nv7ojGjf/MRx/MZ1JSpE2W0ZvnoyF3RQ90MWcLCI3dgdokoqst93PnDoUOH3tr388+rlvz733szevc+jlW3EnYZxmNg/PTpU3IvvXRI3169el2Ul5P7u+ycnEsEUbQSVbX6NPe2yZ1agoybx6iT5IQ3VeozQr38tYyPsIn1JY7SSgkrilJz7z13D5zxzDN7w+sV70oFBJDcU0GKHTCHpUvfvXR0+ZhVhJBMo1YSymwZytvYPHSzpu41t5u0bi35jUJcHjex2+A9rHs7CyJxe9zUoQgcp8C6QEOfeF6VINiZkAZVVfe5jjf/uP/nn19fv+ajDWu//PIIehMHXETpFvrJVVTc2eWSC0oHXjzo4mtFi+XUzIyMvh6PO89qtVolSeKARMF8D5Yr6q8hWr0RFeCAScPndEc9VqKWIQtr1hhiqa31wPXog1oE2vis0/4CHBzJklR7/9QHSqb/c/r2DnhV4CMSBAEk9wQRRKIPY9nixVeWjx39PiEki5K77mgU6hA6XHIPekZuPEPUk8kYX5AQae+WXEQET2HdsQiwhAQllOQ5XhEEwaOqSuORw0cXNzY0rHrhX8//94c9ew4uX748XQu1JPpy6/TxlZeXZ5SUDOo5cuTYX/fo3q08MytntCxLdlEU7XAsxTR1XrBohWxsWmgdC52k8fV2O/VJYUTtM/FDqgRWzlYLuYzFFYjcYTyqqtZMf3zGsIqKiq2xeA72kRwIILknh5w6fZRLl747eHT5mCWEkBzjYFqRu0nXC0XuQUld75im3NRjzuG5oB3RkB+d6Fucx+nPrEoYvMmsNpvsanEeVxTluxZX846mhubt7yxe/K7FYqm7/fbbXZ0OJg4gqRAYN26cdfDgwadfdtmg3xUW5p9lt9lO4Xn+VLvDYfO0uEULxJTLspYe1mGnG1/q6MYyG4LG7ktRTOfOtHiO8xVOamW1amdVO7rhMGfSU1Wonlf96D8eG/7II498l1TA42CjQgDJPSr40qfxkiXvlo0ZPWYxISS7TXI3QRIVucPLTXcOAk0HXn7G80SqMdkttPSnXmDDJQhCIyGk6tN1H8/63/Ydn65cuXLfgAEDnHiOnj5rNY4z5cvKyrKvvfZ3Jw8bMnRMl67drs7MzO5LZNlKBKjPRmlbS4xjsVAtnlZxM1mc6DER81kxuGuGch4NZ15mcofPjyTJtQ9UPDB8xowZ34TTR4rek25HTEESJqeodHFakSOgkzto7pnxJPdWhV70IwBW4hOeLbvd9OXIWyyKLLs9gig2HTt2bJvH5d7x40+73/3ssyUbJk+eCSSPFyIQNwQefPDBnJsmTvx9psNRmpObc6bVaj2ZCEImkWVeUhUOCN5saWKDAcMUpL/liX/JY7MPS3sJ3+yjovuc1D704AOjHnrssc1xAwM7TjgEUHNPOJEk5oCWLHln2JjRY9+NNbkbZ0s1GpOdHypdQbIcOOdXFUXlwLwpCHAXHCY2Hm04unL37l1LDhyo3jrv4Yerlm/ZgufoibmEUnVU/Lji4oz/m/Fwb7sl8/x+p51ykyMr+0JCVAipA20e3rH0PcusTzTXAhwxyRIRef8MeDEjd4Y2VJNzuWofeaii/JEZM75KVSHgvFojgOSOqyIsBDqC3GEgrZLRsHNLQhTJ5fLwPL9Tkjxf79v3864ff9j+9sqPP9733HPP4Tl6WFLEm+KNQEVFRUbBiScO+u3Vv7+S57hTbDbbJVartUAQRVFRFIFWqYM1zXN6ZsW249wj1twN5N7Y0FD34uyXxkyePBlKwOKVJggguaeJoKOd5tKli68aXT76nVhr7uaQH53cvfo7R4hHkeUWWZbrjx49tmDHD9vXrv3kk+/ff//9li1btmglsPBCBBIMgeLiYvH2m2/u2uess07P79F9ZPceJ/5WEMQTVUVxyIoi0mMlnucC+aS0l9D9rF8BwlcURalfvbJyzPDy8o0JBhMOJ44IILnHEdxU6vr995cMGzFi1LuqqtIzd2Ma17bmaX5RMTJnX1m9dahmBR7vkscjcYrqFkSxseX48f/Jkrzr0JEjH69cs+bjjz766BeMR0+lVZUec4FqiqNGjcorHzlyvECUC0SL9ayM7OwiRZHzIGqTFwRerzhIIz/gs6EXfjEA5NPw2yZ//4SKcBTgdrsP7dv385gzzjgDa7unx5Kjs0RyTyNhRzPVDz5YetXw4SPfiYbcAyW8gYhhHo4mtZAd2SZaahqOHlu2+6efPvhs3brv3liy5JeNGzeC2R3TwEYjQGzb6QgAye/YscM+ffr0wpMLC/ucdvqv7vEo8nk2u72bLMv0XQwme2a6Z2f02sD9zffBCb71x0SWpUM//PD9mLPP/jWSe+hVkDJe9UjuoYWNdxBCjJo7e7GEyk4XDnBA7i2Q8MNqg7Ah547tP/xzx65dj48ZMwa93cMBEO9JWgTWr15dcNaFA57NzMr6LeRzZiFy5mIwjNwDfd5ak7w/ueslYQ99+eXG8ksuuQzP3JN2tbR/4Eju7ccsLVsYNXfjC6W9BN/KTM9piTcglSfHcc379uy775TTTvsXauppuczSatK3lJdnTH/l5eezc3JuEASBnsMbc8UH0txDe9O31tzdbs+hhQsXjPzjH//fprQCOM0nm4jknjJmkVRaW0uXLh1SXj7yPTDLR0ruAU2JUPhCVSDoF8yRrgMHDkzt2/eUZ7C8aiqtHpxLIAQGDhzoeH/50hdy8/IoucM9tGaC7lHvT+Q+s7zx96E0d/h7c3Nz/dMznxxx30MPYZx7Gi3FRCT3NII/eab6/vtLykaMGLUk1uQOhV/AecgiiJC+011VVTWtT5+Tn0JyT561gSONDIHhw4fbFi587aW8vNyJPM/zRmdT7Ucthz0zy4f3FH/NXe+zfvr0x0fcd999SO7hgZgSd6U6uaMVIEbLdPny5UNHjhwOmntGezT3kGE9NKGHShRJBpL31NfWTuuRX/hPJPcYCQ67SVgEgNxff/3Vubm5eddrYXFaHFs4DnXBJ+VP7vD583g89Y88QnPLb0lYMHBgMUcg1ck95oCla4e65r401uQOugmcuUOaTovFIh048PO0Xr36PInknq4rLX3mXVxcbH/nnUVzu3TJu85I7oAAkDI4w7HNsbHADPs72wj4I9Y6FI4QUvf44/8Yfu+9FV+nD7oJMdNOVS6R3BNiDST+ICorK0uHDCldJghCBiu5GlIrN0wrmLZv8ryXq6trpxUWFj6B5J74awJHGB0CQO6LF7/zck5Oznggd9YbraOgh8T5PjdtZ7LzjaS1tzwhXN3MmU8Mv/fee5HcoxNZUrVGck8qcXXeYIHchw4tW8rzfGYcyV2qrq69F8m98+SMT+44BDRyf3d+Tk72tWZyZ0lsoiV3aC9Jct306Y9c9cADj6RzVbiOE2yCPAnJPUEEkejDWLFixdBhw4a8x/N8RJq70ZRoNCei5p7oksfxxQsB8Jb/4IP3X443uXs8nroZMx5Dco+XIBO0XyT3BBVMog3LSO7tjW1ncwlkmjeRu1RbWzstP78Qz9wTbQHgeGKOQHvJPbwD3NZn7oqi1D7xxIwReOYecxEmdIdI7gktnsQZnE7ui8EsHwtyZ9o7knunyzg8zuj0YabeADRyXz4PztwFQWjlLR8szr1tJFqHwimKWjt9+oyRDzzwAHrLp94yCjojJPc0EnY0U1258oOrhgwZ+k57yZ2l0qQLjTMtN4j80X+lv8hQc49GSNg2qRAAcl++fNm8vLzcmJC7tksLFArnrnvssUdHPvTQYxjnnlQrJLrBIrlHh1/atK6srBwxdGjZ25GSu8btwZcbknvaLCWcqI4AzVD3/rKXc3Nzr42n5q6qKpjlR06dipp7Oi0+JPd0knYUc+1Acp+aj0lsopAUNk0WBAKRuzG3fCzM8lBK1mKx1D3//KyRt912G2ruybI4YjBOJPcYgJgOXaxeXTmitNSnubN67pAhM5x491AlKpnmXl1dNbWwsDdmqEuHRZXmcwzmUBc4Q11gsDiVJ94ktdQyxszyireed0tzc92hmkMje59yCpJ7Gq05JPc0EnY0U9XJfRGEwhk1inDJPbhZXnsZ+ci9elphYdGThHBaLk68EIEURcDnUJc7nud9Z1bRkLuikztPFJrWWZVk+GzVPTXzqZGTMbd8iq6kIBu/tJotTjZiBJjmznFcprGT9pB7YIJvRe73Fhb2wgx1EUsKGyYLAkZveWMSm1iQO0dkCgOnqITj+foPV64dWTZ8+FfJgg2OM3oEUHOPHsO06GHNmsphgweXvssc6phZnhA+LLM8AylYiUqD5o7knhYrCicZD7M809yN5N7U1Fh/vKFlVH6vXljPPY2WHZJ7Ggk7mqnq5A6hcFksvE0j5PaRe2vtPWaaO8ZrRyNgbNvhCMSS3Olmm564a+Z4MMvDxWsn73V7f9wzum+/fl92+CTxgZ2GAJJ7p0GfXA9etWrVkLKyksUcx2VFY5Y3ttW0+Fbkfl9hYa+ZWDgmudYHjrb9CHQEuSseiYgWS/3eH/eUI7m3X0bJ3ALJPZml14FjX716xdDS0iFglqeaO7vae+ZuHjKn+80ZzPJI7h0oV3xU5yEQK3InekG5gJq7SojT6ayvOVg7uu9pp33RebPFJ3c0AkjuHY14kj4PzPIlJWWtztxjTO5yTU31fQUFvR5HzT1JFwoOO2wEYkLuRPBleQxglpfdHiKKQn19Tc3YHoV9NoQ9OLwx6RFAco9OhGlzzss0d7NZHk71Al+toQkU666qmlevfo4v1dRU34/kHt2ixNbJgUB5eXnGa68teDk7O+caloiZOapCPXcorRwqh4Qxzh3i3Y2hcIACeMurqlpfc+DA2MI+pyK5J8fSiMkokdxjAmPqd7Jy5cqyIUNK3wuf3H2YMJoPg9zlmpqa+wsKimag5p76ayrdZwiae2Xl+/M7kNw34ucqfVYdknv6yDqqma5eXVlaWlq2JBJyNz7YTPCouUclFmycxAjo5A6a+7Xx0Nw58JRXFNDcD1UfqBld1KcPnLmnSnKotLGaRrrEkdwjRS7N2unkDpp7tv/Ug5nlgxjrWxWP0bzldRMkmuXTbF2l83TjRe5A6iwUTif3+uqfq0cX9e2LDnVptOCQ3NNI2NFMddWqFSVlZUNAc4+K3NkYfBq8fygcnrlHIyVsm0wIaOS+fF52du74WGnuEOMOF5J7Mq2E+IwVyT0+uKZcr5WVlcVDh5Yt5TguJxrN3QwMhsKl3FLBCYWJQIeS+4GaMUV9+sCZO15pggCSe5oIOtpprl694srS0iHLkNyjRRLbIwIaAkDuK1Ysn5uTQzV3er4Vjbc84bhW3vJolk/f1Ybknr6yb9fMdXIHzT03zpo75pZvl2Tw5mRFIJbkbkw/i2b5ZF0RsR03knts8UzZ3oyauzG3PDs7N2atYxqIEYxg8bqsL+ZQV1tbe19+fiGmn03ZlYQTYwho5P7B3Jyc7Akcx3HGzxWLc2f3cpzgBxz7vNEEjyxDXZA4d0VR6mvAWx4d6tJq8SG5p5W4I59sW+RuJnbfC8l/eQWOc1epKRLJPXLZYMvkREA7c/9gXnZ29ngfufNEVRUSc3I/WItn7sm5TCIeNZJ7xNClV0OjWd6/KpyGQ+v4dc1r1/z7QPchuafXWsLZaggEJneOZmsMl9yh6htkpoMLvjJveWPJV9Dcq2tqynv16otV4dJo8SG5p5Gwo5lqMM09mJbuNRua4tqR3KORArZNJQR0cn85Ozv72kjN8kZyNzrUmckdzfKptHLCmwuSe3g4pf1dOrkvhzj3aDT3QNo8/I6Z5evq6u7v2bMAC8ek/YpLfQDiSe4Q5w5aPOSWVxSlruZg7dgUy1CX+gskyhkiuUcJYLo0X7XqgyvKyoYCuecEcqiLBAejFo/kHgmC2CaZEYglubflLU8d6rQz91RKP5vMou+QsScjuWNO4Q5ZGv4P0ckd4txzY0XuRi0eyb0ThIqP7FQEYnnmHoLc62ogiQ16y3eqvDv64clI7h2NET6PEBLszB0cf9j5uvmcnSXkaAtApr0juYe1zHBjGxZMyXFTB5I709wxQ11yLI2YjBLJPSYwpn4nuuYOSWzyjHWmjab1QCFxIetR6w53GAqX+msIZ+iPgMEsfw3Hcbw5zt3/8xS4QBPEuYOXvFlzNzvU1R6sHVuopZ9NlapwuJxCIIDkjkskLASMZnkgYvDM5U2e8JGQOzPNy7IM4T9SXV3dA7pDnVZRBi9EIEURCEXuxk20np22FRJI7im6OGIwLST3GICYDl2sWLHiymHDhtD0s8HC3KIld47j5Pr6euYtj+SeDgsrjecYjlneZ/lCzT2Nl0pEU0dyjwi29GtkNMsHI3cjKuHcA/eb08/q5A7pZ5Hc02+ZpdWMi4uL7UuWLGZx7q3M8jHV3KvqflN40kkb0CyfPksMyT19ZB3VTL3kzvN5KpjlA2Sfi+QBQcgd49wjARPbJBUCBs0dztyFQLnlY6a5I7kn1dqIxWCR3GOBYhr0oXvLL+F5njrUxYrcWT9w5s5xnGQwy6PjTxqsq3SeIiP3nJycawgh3sowxvSzMSN3zaEONHe80gQBJPc0EXS00wTNfciQYTTOPV7kDg51WBUuWklh+2RBAMh95crKednZWdeyeu7sqIrllo8RudfV1NaOLSrCJDbJsjZiMU4k91igmAZ9VFZWFg8bNmSJmdyZKTFSCMxx7kjukSKJ7ZINgXaRO8cHDGKjJV/h4jk9xk2zqqlEJvTlrqiEyEpdXV3NmJ5FfSFDHV5pggCSe5oIOtppglm+rNTnLe9NUGMKh4PnhIptDzQWZpavq6vDeu7RCgvbJwUC7XOoCzwl7wucY+TO7pMJJX4FiryrdbUHD47piRnqkmJdxGqQSO6xQjLF+6Fm+bKhrdLPQrx7oIsRfLhe8wZyvzc/v/AJ9OpN8QWF0yNA7u+9t3heTg6tChfCoa5tcgceZ4lsoGAMr+rBJjLUgVVraw8eHNuzLy35ir4sabL2kNzTRNDRTtOoubO+KHEHIXemwSO5R4s8tk9VBAzkPj5Qhjr/ULjQ5A53sNruJnJnmjuSe6oupgDzQnJPI2FHM9U1lZXFpUPL6Jm7sZ/2qAFtmetRc49GOtg2GRGIheZOVNWrsZvJnfrDKHBWTzV3MMtvQs09GVdKZGNGco8Mt7Rr1XHkfmhafn7+k/gSSrsllnYTjgW5sxc422QH1dxra0f37NULNHe80gQBJPc0EXS001yzprK4tKQM0s/mGPtSdM0hnP7D09yR3MPBEu9JfgR0cp+bk5M9IVqzPDseYyTPqbIGkHbmjg51yb9c2j0DJPd2Q5aeDbxn7jyfC6ZAdgG5wxWOhzySe3quHZx1YARiormbizfpj+JY9maJ5nhGck/DRYjknoZCj2TKocg9HIIPg9w9hw4dmtajR/4/0SwfiZSwTTIhYNDcwaEuMm/5UOQOmruiILkn08KI0ViR3GMEZKp3Q9PPlpTR9LPGxDVMcw9F7m0RO/Sn9+mpra2Zmp9f9BSSe6qvKJwfkPvSpe/Ny87OHh8sQ50RpUCfIeOZOwuFo59Ff82dhcJhEps0WnZI7mkk7GimCg51JUNK34uU3NsifyT3aCSDbZMVgQ4k97q6qqqxPfr02ZisWOG4248Aknv7MUvLFqtWrSgZUjZkMa3nrqiE47WlE67mzkALpH34k3vttPz8QjTLp+UqS69J+8g9Zzwhqrdgu7FwTLiaeyuHOtOZO5J7eq0tzXqDFyIQBgJrV64sKxlS+m4gb/m2iNvcdQhyh8IxU5HcwxAI3pL0CMREczeduSt6AjpzEhud3MEs357UFEmPcZJMAHg45oX0dTYAACAASURBVHJBck8S6Xf2MFevriwtKy0DcvdLYtNezT2QeR7N8p0tXXx+ZyAwfPhw25tv/oeduQcs+RpSczeQO/0c6W90P3KX5fq6mpoxPfpgVbjOkHNnPRPJvbOQT7LnxpLczZq+kdxramqmFBQUPR2PnWySQY7DTXEEdHJ/OVYOdQBXK3KHUDhC2Jk7au4pvqb8NoNpNFecahQIxMosH8hMj+QehWCwabIh4DXBxoLcg6afZVZeD7X2Irkn2yqJwXhRc48BiOnQxdq1K8tKBpe+E9gsT2tShZXIJhS5YyhcOqwmnCMgYDDLT4g0FA7I3ZuVDsq+cvSTaAiFU+E0F8k9DZccknsaCj2SKYNZvrS0DMidxrmbTeu+Pr1Ov0Eeo/htAlhfLM69qqpqalFRb4xzj0RI2CapEAiUfpZNgOd5AlXhgn3OfJ8bw6aaRrAoJnKnaWjr6moPje1RVIRm+aRaIdENFsk9OvzSpvWqVauGlJWVvI3knjYix4nGGYFAJV/bS+6EaJtpqrFT5zok9ziLrSO7j8qLHsm9I0WVxM/qQHKfUlTUGx3qknit4NDDQyAW5M5xmpM9c6QDcoeLZajjJPpzbW3tobE9i4qwnnt4okmJu5DcU0KM8Z/EmjWVw0pKyt6iSWxYDemAFeGiNssjucdfnPiEBEAAyT0BhJDCQ0ByT2HhxnJqOrmDWd5b8tWYY973LCT3WOKOfaUuAh1J7nW1h36DZ+6pu5YCzQzJPb3kHfFsV69eMbS0dMgiM7m37tCf3FtnpAvpUIeae8RSwobJhEBHkjua5ZNpZcRmrEjuscEx5XvRz9zBW96rudOzPoPnvAZCtOReM7moqOgZTGKT8ksq7SfYkeReU1M/Or9Xr01pD3oaAYDknkbCjmaqK1euLBsypHWce+zJvQo192gEhW2TBoFYkDtspmmpV++b3OdQB9HuRKKhcLVI7kmzLGI2UCT3mEGZ2h1BEpvBehIb41l765j30GfuDClmsscMdam9dnB2gREwF44xOqqa49yDY6h/3vQqjcxbnmepbWQFzGt1NTX15fm9en0VwCIWVbgVyjZxEUByT1zZJNTIdHJ/lxDiZ5Y3DlIjayT3hBIcDiZhEegEckezfMKuhtgPDMk99pimZI/MoQ7IPbCXPEuiETW5Ty4owDP3GC8irri4WKirq+NPOukkrqWlxe9z7zhwQP2REFJUVOT9/YEDB1T42eE4oO7bZ1X79+8vL1q0iNp48YoNAubc8nHV3KvrRuX37g2aO15pggCSe5oIOtpprl278qrBg0shFC679Tm71nuMNHck9/YLK6hpddy4cdZrrrnm9MsGXTba4XD09EgeXpVkTlZVXhB5nllzfYlOwfZCvSRpjmHRYpEVRZEVVd3z5ptvL6uvr99dUVFhvL39o8UWFIFwNPfW0SZm8HwZ6rS/mJLYyJBbXq2vqa4bieSeXgsPyT295B3xbCHOHULhCCGU3I3n5axTJPeI4Y1Lw6lTp3b/y5//fFd+fsGfBFHMcrtcvCiKKi8I8LnniKryiip53wGmTZvKcZyqKIoiWiwwPtntctX+cvjw7D//+S/PL1u2rDEug06jTg3kfi0hRAikuceI3NmZO5rl02h9IbmnkbCjmSpo7iUlZa00d3SoiwbV+LUtLi4W31i48E8ndD/xUdFi6ULJHC5VJS6Xi4Yw2h0Ooqpawe8g1hi6EVAVhXg8HmK12UAtrNu48csxgwYNSkWi6FDnMo3cl7ycnZ11TdzJHc3y8fuwJWjPSO4JKphEG5auub9tPnNHck80SWnjmT17du+bJt34ocVq7asqigAVxgRR1IhcUYgsywQ8snnBn9jN/hTmdoqieJqbm996sOLhW55++umWxJx9coyqbbM8RxTFZyELPqOwzPK11dV1owp6996cHMjgKGOBAJJ7LFBMgz6M6WcZodP42lblX6NyqHPX1NRMLSgowsIxUa6p+fPnn3njxElfqqqaSU/WOY4oskzLiOpmdvozkHsbmrv3b7wg0E0Bx/Oy2+ncfNvf7hw2Z86cY1EOM62bd8SZO4ENgqJWV1fXjUZyT6/lhuSeXvKOeLaM3HmO8/OWV0OGvgV5pNcAqng3CDzPe6qrq6cguUcsJm/Df8+de87EP9wEpnObsTfqJadf2sZM1/xUzRHeeMYL38M/2BDwbM+mqsTtdm+96/8ml7zwwgu/RD/S9O3BTO5GubA493DP3H0osvTOmmMdbMhUVa2tq6orR4e69FprSO6t5d2h527JstyYtzyve8t7HeoiJXfvxP3Jvaamemp+ftFTmH42upWhkzuU+LQHI3dNY2evAJMDvO5Gz0Px0ADkfvc9t5U999wr9dGNMr1bdyC511VV15f3wvSzabXgkNzTStyRT3bVqlXDy8pK3oozuUtgls/PL/wnknvksoKWr7wy++wbJ/3hC0JIRlvkbtbcmfbOON9I7ipRCacS4nK7vr3jjnuGvfTSS3XRjTK9W+vkPjc7O3uCMfsTWFRirblXVdePRnJPr/WG5J5e8o54tqtXV44oLS1704/cOdD8Qp2xh3qkn+aO5B4KrjD/3l5yZ/HRXtOw/mYwkzuc4bo97m/uuOOeq5DcwxRGkNtM5K6FJ+qRC7Ekd0VRaqtrDo3Ryd14MhPdBLB1QiOA5J7Q4kmcwQUkd6peI7knjpR8I5k3b95Zf7j5xg2qqmYzbZwSh2mwHCfoPg/+ZvlAmruiKgTI3SN5vr7jjnuGJzi5J/zxmk7uc3TNXXdt1KIX4kTucEyDV5oggOSeJoKOdpp6yddFPMfl+iWxiS25e/DMPVpJae3N5O7VyFs5zUVA7m7P15On3jniX/+aVxub0aZnL3r6WWaWjye511TXHBrbq1cvJPc0WmpI7mkk7Gimunp1ZWlpadk7PMflIblHg2THtF0wZ07/SX+8GTR3v0I/oLn7e2Azy4vveISO0ORQx/EqdayDM3eP271l8tS7RiK5RydLndxBc78Okth4N2Ax1txVRamp8pnlwxl0wls9wplEut+D5N5xKyCpPzCs5Ctq7h23YKJ5kq65b1RVNcvYT7jkzszyAsdrpK6TOzXLezybp0y9axSSezQSIsSguQO5e8+34mGWB2/53lg4JjqBJVlrJPckE1hnDXf16tVDS0sHg1mexrn7zLzaOylYPG7rJDfmGWhxuZRAOM5TX19/b48e+U+it3x0kn513ryzrr9p0heQxIbFq0OPiqEugJaEKHAonPHMXbPUqESSJXrmLkkSknt04qGt9TP32VlZWddzHMdHk1veNxzdd4LT49xl+rmqrqmtHV1QgBnqYiC2pOkCyT1pRNW5AzUnsWkvuQdPxuFH7lJ9ff00JPfoZb1gwZz+E2+4Ccg9C8k9ejzj0YNZc48fufO1tXU15fn5WPI1HnJM1D6R3BNVMgk2Lj3OHULh2q25t51lC8k9HqIGcr/h+hu/4DiOmuWZDEBzZz9HqrnLkvz1XXdPHjlr1qyaeIw9XfrsQHKvq62qLc/HJDbpsrS0z3hazRYnGzEC5lA4RhCKbr8NnSYz2KOR3CMWShsNwSx/3Y0TNwYjdx5M8rS9z6HO2F0wszw41EmyZ8uU2+8uf2bOnOp4jD2OfSaU34shFI6eucdRc091ck8oucZx/barayT3dsGVvjcHi3NHck/MNfHqq/POuv66SRsIIdnGjZdRc9dGHj65y4qsnbknL7knlLDM3vIdQO5foS9LQi2BuA4GyT2u8KZO52CWHzKk9G2OkCxjKJyP3IEk2pf8SjMLy0aHOjxzj9GSWbBgQf+JN1y3gSMkByrCsau95A6auua9TYiP3KWvp9z+f6OSUHOPEbqx6cZA7tfHW3Ovq6od3VMzy7fvQxqbqWIvnYAAknsngJ6MjwxN7u1bSt7CM63JfWqPHvmYWz7KRQLkPmni9V6HOjO5w8+aDNrW3IOQ+zdTpvzfyGeeSTqzfJSoxrZ5x5E7qa+rqi9Hco+t/BK9t/a9kRN9Nji+uCGwZs3KkaWlZW9whGQH1tzDX0pGM3EAzR3JPQZS1Mmd1nMPZJaPhtxlWd46ecpdVyG5RyeoeMW501H5hcKR+rrqQ6N7FhVBhjrU3KMTW9K0Dv+NnDRTwoHGAwEg95KS0jeZgxY8w0jygZ4ZrpeLIc4dzPJI7jEQIJD79ddP2MRxXEbbzo6BawOoOjlA4Rgma/pVUYjH7dk6Zdq9Vz3zzDPJ5lAXA2Rj1wU41C1btnROVlamXxIbyPkgCCwtMHtesBoOplK97HYvuVMLTX1ddS2Se+xElxQ9IbknhZg6f5AffrhqeHFxydtmcjePzEwk4RA8knvs5btw4fwzx4+/YTPHcY62ezeQhkFYRnL3S1qkKJDEZuvkKdOQ3KMUG2jub7315tysrEwo+epNPxsHcq+tq6oZg2b5KAWWZM2R3JNMYJ013NWrV48oLR38Vihy942PJjoNmrnOOA8k99hL9dVXXz3j+usnfE0IsbfVO2SoC6TZm8nd68mN5B4zYemaO5D7+A4idywcEzPpJX5HSO6JL6OEGOHatatGDR5c8h+O42gJUaOpNpT2HmoCSO6hEGr/3xcuXHjmhAnXbglE7kZN3JDS3I/kGbkzhzoYAd0EqJBbXvrf5ClTh6JZvv1yMbYwmOXjrbnX1FXVjEXNPTp5JVtrJPdkk1gnjddM7gZCjnpERnKvra2flp+PueWjBVXX3L8hhNjMfQUjdy+Bw9m6fmZrJHeoMU7P3D3SfydPmToMyT06KXWo5l5dOxYd6qKTV7K1RnJPNol10ngDkbs/SbQemBbHHto511Q4BhzqnkKv3ugE/corr5w+adIN38aK3Fl+ekbu9z9wz1UzZz5fFd0o07t1B56511XX1P2msLBwI36u0mfNIbmnj6yjmumqVavKy8pKXmdmeUbcjLwjTz+rmXt9VeHqpvToUfA0voSiEhcBcp848fqvzQ51/pst2Hh5/bi8D6SyNWju7A/095rm/r8pU6dd9fTTTx+MbpTp3RrJPb3lH+/ZI7nHG+EU6V8n94Ucx+Uw8y0QRVuaebiEj+Qe+0Uyf/78MydOvH4Tz/OZxt5byytIiBXPMs/7rC9Gcr//nr8Pn/nccwdiP/L06VEndxYKF09vedTc02dZ+TbpaThnnHIECKxevXp0aenghcZc5WaiCJfMzY+HdrJM09B6Dh2qR809AvmYm8yb9+JZN974hw08z1MHyGCy8tVz91WOo5stImttFJXGXMMF1hVwqFMU5X+T77hrxFOzZv0cg6GmbRcauf9nblZW9gRVVQX2+TGGwvksY/4WFt/vgxx7GeLcCSF1NbX1aJZPs5WGmnuaCTzS6erk/johhNYHb4sw2vsMRu48z3vq69Es3178At3/8ssvnztp0g2fGi0tgTV4n+bO5Gokd4HjKcnD5gsc6qCaXFNT09ZH7r1/JGru0UkqXHL3TxPse6YWnojkHp0UUrc1kntg2YaTeyV1V0WAmcVGcw8Mq5Hc6+rqJvfsWfAMnrlHt7xefvnlCyZOvH4tz/O50JPZqmLUCI1+E17tUdfcJbeH2Gyaw70kSUQURbWpofG7GTOfGPXYY4/hmXsUYjKQ+3WqqvKBNHdf99omq7UsQ2eoQ809CiElcVMk9yQWXkcOnTnUmc3ykZri2dhZe10z9KQiuRcXF4v9+vXjCnYWqNu6b1P79++vVlRU0Dd1RUUFt23bNg5+xzCBn+H7/v3ruW3butPfs7/r7QKqa/Ccs88+m9pvr7nmd4MGDbpssaIoeczT3ay5a9XeRD/SMJI73K9IMhA6bdrS0kKsFovK8dz/tmzcNH7eq6/ucbvdyt69e6V169bJATZkHMwPxsy+sjHAz/A9m3ugOZvX96JFi4DJQodfdOQHI4pnhaO5s+6Nxyf+BO9H7lrmKHqD9nsVpIJm+SiklLxNkdyTV3YdOnKd3P9jNssjuQcXw53jxjmG3HTT+ZcPvPRaR0bGyR5JEuDyeNxE4PVzbE4O9hnk4Hib41ROf19DBhnCcQKRZY967FgDOXr0GOF5TrXb7cpJJ/VWmpqaKR/zPJE5jusqipYBgiDYQ5E7JQFq4vVlq4Mzd7ggtzxo7NQkDx1LEpy5H7ZYLFuPNRxzZmRkCE6nU7DbHaSxsZHs37+f69q1K+nVqxfX1NTEgaavIeTlZPiG/SOqSu3K7B/DgpEUx/M85/G4BJ4XiNVqq/3vf//3wowZMzYvWrSopUM/AHF4mO5QNzsrK/P6YGfu7SR33yj9yb2+prZ+LIbCxUGICdwlknsCCyeRhqbHub8RDrkbnbdCkb/RFAkOdamiuf/lL3/JmjZl2i2FhQV/IxyXL3k8lKiY1sXxPOd2uRTRKgQ6q/B+LnXCpcwIplvWHjAG0rVYLCpckiSpQKQcx6myLHOCIPCyLFOV23iWzoicfQXN3XiZNXdwqAOrCmjvzFve5XKpdptdIjwH4RKcoqowNx7GpIc0qmyuAdawH5krimLWxBkeFAO9H/q7lpYW2Wq1HKirq5s7Z87Lz1RUVDgT6TPS3rEYyP2GOJvl66tr6sYUFRV9kUqWj/binW73I7mnm8QjnK9eFe4tQoi3hGiwqnBI7oRs/Wbr2DP7nzFXEMWuksfDixaLrsBqBMiDBzqcoeohZ22JxUCaVHtmF/QDfwNvdv08nP7J6XQC6dPvQ2+u/L2wvc6SRCEqUanmDhcQPCVuQgidiwq/k+jfBNHftA/3wf0wBuph38ZlnE+w29jcdMc+2MTUbtjwxaRLL710TTKTVTiau+8z1jpksR0OdYzcIYkNXmmCAJJ7mgg62mmywjFx1tyh5OuUZM9QN27cOMfcOXP/k5ubO4qoKqi8NPkL1YB10vW43cRitRJVN38Hkw/LAcCImuUWgN8DMdKNgk740D/8HbRsj8dDv4bKEAhmfuNlJnfQ3I3mepgHx/OEjV/X1L2JiOBndkYPpMzC6MzzM0dcBPNg1fwCfMRGiV4QPMebGp8/7/wLp+7atcsV7drurPYGcgeHOjGOoXCouXeWkDvxuUjunQh+Mj3aWPLV4N0esqY7m2NbGiQjLJ7npZqa6in5+UVJnX52woQJXebOnVOZkeG4kJnSg8s6WJ3uwC1CaeLQykjoZs3Z3N5ssjc/NfTmILwUw21tXlg8Pb1HPyuGDZEWksfR/xRVIZyq0FA8oshKc2PjinVrPvrTyKuvrkmmz5FxrDq5v5SVlXkDSxXINnNs4xZa3oZQRmrG0C0l3jN3+nNdfc2hMZhbPllXSmTjjje5Y0hZZHJJuFZr1669avDgKxdByVczuTOtsq1BpxO5T5w4sduLL85a4XDYLwotyPiTe1vYx4LczRuKNudseiPQc3yVEPAepCTPKdrZvn6koKg88LyP3EGLV2VFbm7+7MOPPr1p2OjRe0JjnJh3xJrctVkGJvfqmkNj8cw9MddBvEYVb3KP17ix3w5GYM2aNcNKSorfiTO5e6qrq6cUFBQldW758ePHnzB37uz3HQ7HxaE3PuGTe2gtTlsURm07kOYdqJ9w+w627EJp+IHa+T2T+dUZNHdKVTq5w/k/UWRNcyeKojpdn33yyfobBw8fvreDPwoxe1ygM/dAmnvbGpJ5/SC5x0xASd4RknuSC7Cjhh+t5h6I5JizkNEsX11dPTkVyH3OnNnLMjIcA43yCUygbZN7pKTbXrKN9Dlsfu15XsBnMZ95Ru56x0ZyB7M8qPmcIimyC8j980mlI0fu66jPQKyfA+S+aNGbL2VkZIK3PE0/G41ZHjX3WEsouftDck9u+XXY6Ns6c/cj7jbUDONL3ZhtKzXJ/aXlDofjkmBn3ExwZoe2WAo0asJtx2DCfVbQTUQQcpcViK+Hs2SVnrlTcpc9isfpWv/5519MSnbNvS1yDw/TsDT3+uqaQxgK1471nAq3IrmnghQ7YA4ffbR6xJVXDn4rmFm+Lc08kPaa6uQ+d+7sD+x2+0WdSe5mE31byyRazT3Qs7TzdP8w9mjInWeJcCS3IjndG7748rNJl5eN2t0Byz8ujxg3bpz1lVfmzc7IyJxozmEADnVI7nGBPW06RXJPG1FHN9E1a9aMLCkpfrO95B6I9M1kn4qaezByN+MRPam2bdYPjyBCx8OHs3oCEbnxd23OtQ2zPN04EIXQdD9wyR4wy2/88ovPJ11aOuKncMaWiPdo5P7y7IyMDCT3RBRQko8JyT3JBdhRw9fJ/Q2O47IDecubSSvclzrT7vR4ZilVztzbIncjVp1F7kbLSagNWLhrLJDMzc8J2lcQcoc0OlrlWZmSO31hyR5Fcjo3fvrZxkmlI5KX3LUz97de6gByx1C4cBdxCt2H5J5CwoznVFavrhxRWloGmns2c4RjptjoCco7ck9NTU1nesvHJHRT95b/wOFweEPh2oNRoHsDaeCaHLQkNMHIOphZ3Hy/UabG/kKtKePmzGyRademwUTubHyKKuhZ+CARkETJnSOK4mo6/vn6zzbcWDYqec3yoRzqwrG6tPbZ0LIWevMFKDTEsA5D4UKt5NT7O5J76sk0LjPqIHKXampqUsJbHjT3SMk9GCmyl73/S7+1WZ55XZtJ2rxpCLVJC49cfOfqgTT3sDc1RnKHmHd9FQO5w0Wd6lKQ3N96602/wjFGb/nw8PfPMAhx7kHIHRzqvkzmdL1xebGlcKdI7iks3FhObdWqVcPLykrehjP3UKQQyXP1PkFzB3JP6nruoLnPmTN7eUaG4xKGRdgkZwAvmAZvJPlg3vahHPnMMjJr7uFq7+w5zG/CPN+w503Lyfg0TkbuKgHNXSN3qF+qvbAUxdXQtH79+g03Jbvm/tZbb87Rq8LReu5xIvf6qur68l69em1Cco/k7ZScbZDck1NuHT7qNWsqh5WUlNEkNvEk96qqmslFRclN7lqGuueX2e2OQWGTWxCJBtK2/c3wgc3ygUzkbS2aQGfj4WmO2isk2L1hz9/rVK+VmvX+yGnkTnPXALnDN6qsuBqbPv/88y9uSvYzd11z91aFi5Tcffj7J7GB2gBglq+qrh+N5N7hr81OfSCSe6fCnzwPX7169dDS0sHvxpPcCSGe6uraFCH3F5ba7fZLwya3MMg9MIFqZnmjBh2oq1DjCEbuodoZnxVofGG3D+FQZyJ31XWsccOn6zfcNLS8/Mfk+RT5jxS85V9+eR5o7uAtz0WiuRPSdpy7Tu61Orl/hZp7sq6W9o8byb39mKVli1WrVg0pKyt5j+O4zHhp7hq5V08pKuqd1Oln//CHP3R99tlnljkcjkHU/0u/mPOZcQEpUPWMMlfoKzBRBg6F04mWpmg3Pt9MxuYxhU3GIYYbaLPQZpN2kruzoeHLjZ98fmPJmDE7QiOXmHcY4twnxZvca6vqRhX07r0FyT0x10I8RhXeWyUeT8Y+kwqBtWtXlg0eXLqU47iMWJK7yds6Jcj9xhtvzHv++eeWZmQ4LgNfMKNmDd8bNdxQJBiabAPX+Q7mJW9edPEidzbP0OPXR9Recj/asGndZ59PGp7E5K7nlgfNHczy8dTca2rrakcVFJz0NZJ7Ur12oxoskntU8KVPY11zXxIvctdLk4JD3dSiot5JXfJ13LhxWQsWzH/P4XBcSQixBDs3NxN9ICIM5lTnW3mBzfLMwc3YPlj/gbzcWf+hzt3bIu9ATnrmT4x3c0NtDPp5sYGBwGFQIRDtDl75cOau0ly0x48dXbfxs49vHDL66v3J+inUyX2u7lAXW3KnRzUq0TL2KjW1ddUjCwr6fIPknqyrpf3jRnJvP2Zp2WL16srSstKy5RzPO1RFIRzPE8njIbxg8eIRtpbmh6BW4tPpdBK73e6pqamemuz13G+55RZLxQP3P5FfkP9nVVWtoJXxgkAAN9jECKJIEYCfQ12hMIX+oG/wOjOSKavjzkqnGvvxJ90gZn2daCmXwtGBng5VkWU6frfLRaw2mzZ8r8ebb06wPuBeaBf2BQ8zXUBObK2JFt15UFGkqgMH5z/z3Ky7nnzyyeNh959gNzJydzjs1wuCwLVtEWsHjt55KkSSFGKxWGr27t07vG/fvt8huSfYIojjcJDc4whuKnVduXx58VWjRqyQPB4HEAd7sTN+CkVCwbAAbUyWZXgBAYl49u/ff2+fPic/mewvoY8++ujSK6649FWikpN4nocwJ4hzojAA6cFFiS/M8/ZQa4kSKZC8TrYej4diKsNGTA+xYn20h9xBYwZ5Qx+SJKmQJE60WAiRFW2zwhFts6KqpLm5mWRkZnrHEE54HchfcwsInIMeiN27kVBV4na7VavN9sv332+/7cwzz33bV8A8FEKJ9/fi4mL7smVL5zoc9uviQ+6ao6Usy9XV1dVX9erVa2vioYAjihcCSO7xQjbF+l21atUVQ4eUrpIkyQ4vd1mSKCmLFk17i5TcWdIN6EsQBEhic19hYa+ZyU7ut912m+0vf7n1d6eecuo00WI5yeN2i8Dxgih6WUxVaBFzGsHN5mtwhIPNDhzEtjqzpxsFrQ3dMIAFBdpZrFamRUsup1OwWCx2GkUWgNx9Mmtbcwdva7fbDVYVbd+gKPCzbOEFF91M8ED3usqtqgIdMtPa2WbD+FnQJqhFtdMMe97KMkZ2Z+8l+lXvk35/vKnp56rq6rnvvbf8pcmTJzcm88ds4MCBjtWrV86z2+3j40XusDGTJKnqyJEjQ/Pz87clM1449vYhgOTePrzS9m7QRAcPvnINaO5Uc2MaqJ7+NNjZcCjSB15gWqbH45EOHz78YM+eBTOSWSNjiwS8ocePH99n4EUXlOZ16XI+IZxFURXi9kh8ZoZDkmSPyBGeU4kCPKcQwoM6zIgbqF8B3Z7+R7/yKs20DnysAIdyvKKonCAKCs9xiizLQnNLi2ARLfC7AovFciHRagHo+wF/Zz5NNm2TO2juIB9RFDXt3eNRZVmu4xR1U0NjPfafeQAAIABJREFUQ51gsSgczwkWQSQwlh9++IE7/cwzOUWRFJEXBV7kveYEVYE5EllRFZkQTiLwjezWNg2c2sKpnFtRFNiwwLkFnDOAXR/o3ya5XRbRaj381Veblmzf/uP3d911V0uyfxjLy8sz/vOfhUDu18aL3PXNYtW3335bNmDAgO+THTMcf/gIILmHj1Va37lkyTsXjxnzm49kSXIA0bBzYzDLt+X0FYrcGxuPkZycHIattHv37kdPOeW0R1KB3A0Lhhs3bhxl0UWLFikVFRX0c7dt27agn7/+/fu3PoAO0ca4QO+8884BF190wQcqId2iIXfQyZkMW1paiCgIMsdx367/fOO1b7zxxj545pEjRxSYVwBri3F+fmF5DINQHyrAqH///lxVVRW3c+dOdd26dVKoNsny9yeeeCLzz3++Zb7dbh8XL3IHi5jb7T74wgsvDP773/+etDkBkkWmiTROJPdEkkYCj+XTTz88/5KLB31ssVqzgdyZc5jRoc44/FAhXuxe6tGrO4PJsiw3NjY+9dxzL0yrqKhImZd4Z4j15ZdeOvfmW/74oawoXaMhd1VW4LiEToEenfC82nS86ZsnH/lH+UMzZ1Z1xtxS5Znr16/PPvfcc+bb7bbfRUruwT5npk31gXvuueeKJ598ck+qYIfzCI0AkntojPAOQsjixYvP+M3Y0esJx+WBLRfOecE8r4KLVYArXHJ3uVqYMx1oiHJj47FXXnvtjf/v9ttvdyHwkSPw4osvnnXrLX/8RFFVIHfakTmmXfudufCI9kxV95YHszyQOvOYh4Q7TY1N3z4wecqop1966WDkI8SWmzdvzv3Vr/oBuf8mXuQuSRJszn6+//77Bz722GMorzRadkjuaSTsaKZaUlJy0ocfrvmEENJLVRSeOtOJIo1ANl9txU0b76WLj1M1jVAQ4Ksiy8qKBQv+fc2tt97aHM14073t/Pnzz5w08fr1KiFd2joaCUXu4FAHF3j20/A6VQUHra133nX3qFmzZv2c7jhHM//PPvusy3nnnfOKzW4fLUYYChdKcweZud3u/Q8//PAF06dPr49mvNg2uRBAck8ueXXaaM8446T8bf/btUJV1XPAgxs8osFj3myWDzczGpsImOV17QI0S8Xtdn/57LPPD7nnnnuSNn6504RkePArr7xy+sQbrvuCcFxu2+PxT4LD7mWaOztzpx5/EKPP88Tlcv33wclTRz3+7LNJm0AmEWS0efPmE04//bRXrFbbSIvFQuPcmYUExsdyFWhj5YNGpBgJnm3k2O/gqyzL+//xj3/8uqKi4nAizBvH0DEIILl3DM5J/5S3357f/fe/ve41t0caYrPZeC+Jm8y67SV3CIWjCrxmOgaP772vvfb6gJtuuulo0oPWiRN49dW5Z1w3YdImjuezjMNonXEuSHIUXtPY2Zk7TZbDEtKoZNv/+8tfR7300kt7O3GKSf/ozZs3559++q8W2GzWIaIoesmdhS6GRe5QJE+3rhhDHo2E39LSsruiouK8mTNnJnXoYNILvIMngOTewYAn6+Pee++9vMFXXjE7t0ve7xVZpuQOHvPGM/fWxBE6/l2LdtIIRtHeZodfeeXfv/rjH/+IWkYUi+XVV1894/rrxm8hHAfRDQEvTV5th8IJWpg91ShBPJAsx+l0bp/5yGOjHkUHrSgkRMjGjRv7nHPOWa9ZrdZLIyZ3Q62CQOTu8XjU/7+96wCPouraU7ek0YsKShFQQJCmgqColA8pIhAQ6QKhSJcuZUEQUQQEFOlFQQQUERALShARFVGkqoBYUASVmmTLtO85d/ZuNpvd7GY32Ww58//fg5CZW957M++cc895D8dxp8eMGVNn8eLFGMcS0opF18NI7tG1XkU22vXr1yd2aPfoS8VKlEjTVBXESnS5U06XUvV1+UuFU1US8EOIA1RNeJ6/tnbt63f26/f030U22RjoeO3atbX69O55SGMYn+Suk7aPV4Cb5Q5rA2p39NJU9dTx7460q9Oo0S8xAFWRTeGbb76pVbt2rY2iKNwFAXX0I8rTta4PMDi3PASpapr2Y7du3epu2bJFl0bEKy4QQHKPi2UOfZIgyLJw/rwZxYoXH5uYlEQYHdLhvAXUufcWCLnTYC2O40CR7drKlavvGjhw4PnQRx2/LTjJ/VuNYXRpOZ+XfxEb6pKH2Ah4YdhstlMX/r7Uvlq1amfjF+HQZ/799983qlnzjrd4nq8C6oWe5E7/Hgq5Mwwjq6r6gyAIDUMfMbYQTQgguUfTahXtWNmvvjow5t5775vlsNtNEOEOkqShkjtVLqXniyzLZixbtuKuIUOG4HluCOsN5N67V49vGZb1Se66/GvuVDiSMueMhSBFYZwxEZTkVVk59f0PR9s3bNgQyT2ENTp69GiLO++svpHj+NIuCUGP9rKPuoK23OXz589/XLFixbYhDBUfjUIEkNyjcNGKasjTpk3pN33atPkcz0OuO7n8FTbzZ7m7k7uzQEnGG29sqN+vXz9U0wphod98c3XNJ7v3OsSwbIJ7M7kDHvPOc3cXsXGz4E8dPXS4Q4MmTc6EMMS4f/TEiRNd7rij+jqGYcgaubvjc7vmgyN3hmGgjPKam2++eVDcAx5nACC5x9mChzLdn346+XiVKlWW8Bx/M7QD1jucueedR533FtNrdOv3OHPnM7dv39GqY8eOX4Yy1nh/dv36lbV79uhzUGOYHNHyuXHJ6ZZ3kQqtra7q5V7hIhrzPM9kZGT+eO2ff9tXvP12JPcQNtqPP57sX61ataUMw5CAhoInd5VRFE3+999/J950000vhzBUfDQKEUByj8JFK6ohnzp1qvltt1ZYYTKZbqeVv9xLlnrXmM/eYt5+TuRnGb3sKwTWsQybefr0mT7Vq9/5TlHNMxb6Xbt8ea0+/Qcc1BgF5IJdl7Mcm+vvvuqtu+LsIJuB5aCKC6lfA9HyiqL+ePr4qfa1GjRAcg9+s7AXL5wfU7psuTmU3D2bcs959+19yWnRs/Q4hTyggmdNPvXjqf61a9ddH/xQ8cloRADJPRpXrYjGvGnduuqdnkjdzDBsXSgvCiI2QPL0yovcfVn3eiocAwXCQByFMRmMtsv//WspXfaWqC/76mWZaMW3Ql/BlStX1n6qb7+DLKflzHN39uxPHtiT3GF9gOR1cldOnTh57LF69e7Do5MgV3Lz5lT+sfZrNhqMpsc1p+XurSn/ao8enhcXuev6EQzL2j//PP3JBx9s+W6QQ8XHohQBJPcoXbiiGPbkkSPLTX9hzk6N0RoaIZiORMtnX77IPS+3vaJIusXOaozNbmMMgijZrLY1fe9tMnzLyZN6PVC88o2AP3KHBvWAOh+1Aeg/O93yqia7yF2W5VMnTx1Hcs/3qmQ/YLFYEiZNHPutKBqraQwj+P74zVkc0L1OgL6GOdcv23In5K45HI6LPxz9ods999z/eQjDxUejEAEk9yhctKIa8pAhQ0q8PO/FXYIgNAZiMBiNOSQyvbygNIbRU3x8XTSgDlyIsiIzdquNsdtsuwYPHdFjy5Yt14pqrtHer5PcDzCs6qqnS972HhPzR+5UftaD3E8eP3H0sQYNMKAu2H3y/PPPl5o0adxxRVbLMqyuFORJ3PQDzL2P3OuV23LXrX2d3DMys749fPjrJx966H94hBLsYhXNcyF7+ZDci2bhorLXoUOHJs1/+cWdomhoJkkSB9a7u0Smd6LwIW/qRADInSifqSopRJOVeQNecge3vbezZ48ePVAkJcidsnz58loDnur/ZZ7kDrXaORot73TjOvujBiEld0WVGJ7jiVtekqST4JZHcg9ycRiGWbRoboV+fQd+bzYnlqZxK95jUvy9ovMm9xvXr7+/afO7AwYNGvRv8KPFJ6MRAX87JxrnhGMuJASmT59umDx54vuiIDysaZqo50NnX/kld7gf3PIQ1EWrzKnwd54/f/bs2YG3337Hh4U0lZhvFsi9f7+nvmQ5LcV9XTwt92z52cDJ3WF3nDxx6liHhg3vxzz3IHfSscOH69SuXyddU5kSdE38pY3SrnKew+dMZQS3vJvlrl7468LqHr36Dk9PT7cFOVR8LEoRQHKP0oUrimFbLBZu7JjRqxMSE7oxDGOCl5HqFDlxdyvmHJt3yz077UdPhXOVfZUd8N9Zf/351zOVq1Z/vSjmWUh9huxmy8+4wC3fr09fIHcSLe/CO1cj/hXq4BHn+miqorAOu/348ZM/PtYI5WfzsyTu97K/nv358ZtuuWWdKBqSgNw9iT3wAkwe66dRhVnysaac/+OP52+tdPt0LycywY492OfCuv+DHWQsPYfkHkurGYa5XLx4YVzZMmUskiQlQMR8MG75nC8y3dIAaVNdv1x/KV29fPmVtMHDxqMednCLSsmdYVVXKpynp0Un/bxFbDgiOMuQ9YFjE3DLO+z2Ez8fP9m+7r33ngtudHH/FHvmx5Pjqtao9pyqaAb3dFJAJq8IefffHbKenrUBcpJ75quvvTp2+PAxsfSRHPebJ1AAkNwDRQrvIwjs37+3XdOmD2ySJSlREMUcLyIKUU7y5rzeQ63J7FKiTnciKUbDqYym/GCZMfuBGTNmZCD0+UdgzbJld/XpPwAC6nJY7rk9Lb4sd71PyHCnFyV4W5b15JGjx9o2btwYJYLzvzRMzZo1DemffvRyydKlh/K8yLmvCf29oM36SlnM/h3jyAc2HG2RYk6qDMdaDBxvKYpyeeEri3qMHz8Jj7eCWKdofwTJPdpXMMzj37Vr170tHnnoQ4PRWExTVdbT6shN8HmTO70fqsO5CaqoiuzIePGlBVUmT578X5inGBPdOcn9CxpQR8kgv+TOavpHF42L4DmOyczMPLlp3RuPDhg27LeYACvMk7BYRhUfPnTCqpJlSj/OaCwbCrlTyz2b7J2xE5oC63Zh5hRLC8ucOSfDPEXsLgIQQHKPgEWIpiFs3769RquWj7xvMptvZzTNWRjU+wz0F05Q5K6piuTY9PabNXr0GIAEEsQGWbFiRZ3+/Z4Cck9296Tkl9zBLa9bhtl58basrBMTRj/z6KLly38PYmhx/8j+/Xuq169T/y1zUmI9luVDJnfPYy44OoGPZZZl/5xumXXv7Nmz/4x70OMQACT3OFz0UKa8Y8eOW1q3fORNjucf4Hk+T3Knjt28+suW2NQtDngxwcXxrOPbbw81a9SoyTehjDden3WSO7jlkwqa3CWH4/jQpwa0WblhA5blDWKDffXVVw81qldnK2cQS/iz3P03r8vPZrvvNaIcqWkKhLr+MX36c/XnzJmD3i//QMbcHUjuMbekhTuhmjVrJh3Y//mi4iVL9NFUFd4sfjrMO88dHs5BPopEyV36668/x6xYsfY1i8WSM0+rcKcYE62ven1V3X4D+h5gOS3RfULeLffcgcw0Tgssd/2sXT/bhTsdDseJUaOfaf3666+jRRjEbjn01ZdPNbyn0auappogoDEvt7y/5qEqIyg8QjYDHJ24iUJJksNxbMnEKU3HLFhg9dcO/jz2EPD3Zo69GeOMQkIAgoEO7N/3fFJy8khBFAVnmdY82swmd2/BQa6zYCAOFo7wnQFcmqL+d/m/5V26dIccXTmkQcfhw8uXL797wFP9gdz1kq/wEaZpXlIXabR8zgx4d3LXZWr1n4NnxWq1npjyzLiWC5cvvxCH0IY0ZYvFIvTv1/e1ChVv6SnLklkQDCGRO5y5A6nTYEdntgmslOOfi5eWvfb6ilH4cRzSkkXtw0juUbt0RTPw1NRUfunSV8cXS0mZJIhiMk2F8y3AERy5y5KdsTvsO6ZOndl3wYIFl4tmttHbq5PcIc/d7PKu5EnudK46ibuTuzsKEI1tt9mOT5w8pcUrr7xyMXoRKpqRjxo1qviMGdM/SzabarICb4SYlFAsd3jeXScC1gf+LssO+8+nz/SvVavOhqKZKfZa1AgguRf1CkRf/+xff53vedNNN72kyHI571Xh3N28eZM7VaYjhAIWorOqlSw7wN144sTJk2l33VUPa7vnc5/4Inf3kq85c9xzuuZd6dPOwjE5RYbUY2PHDX1k8eI1/+RzWHF/+9jBg8vOWbzgc1VRqomiyDEsnytVNFClOv13Rrfc6fowkOfOspoiQ8GYo10bNLh3f9yDHqcAILnH6cKHMu09u3ZVb9a82bsGs7kmeZP4Ed7Q+/KRT81AMJBzNKzKQOqVbjpCKo+a+cu5c89Ur15rWSjjjcdnIaBuwIABBzRNS2SdbAEfT5QEqLWXfRQCWQ1U3SxnHESOmAhVVe12+9Fnnhn38NKlS6/EI7ahzHnRopfrDhkyZCfLcRX0fa7/XujrkPt1DB9gnmp19H740+GwMQaDgRy5OBsirV67evXTw98d6fvII49gXEQoCxbFzyK5R/HiFdXQR43qW3zBvGW7VEVpxAqiGFilMR+BdSTSl5K7xsCXAiEZndwdl69c3fT00yOfQqW6/K32ihUrKvfr1y+d5/kKUOQHCAIUAGlktbt4ECELqk8KQijwKeasGwCR17wgkAhsEC0CsbqrV69unzBhUu/ly5dn5W9UePf5C7/1LlmsxCKz2VRMgWg4TXeruxO2O0r+yB3O2MkHm1PERpJIrQbtypUrb8x54cXBCzCYLm43HZJ73C598BOHc/fnZ06fdnuNGuM1jTEFRe6UTfIkd03iBf7CxIlT68ydOxfLv+ZjyVJTUw2LFi0aXapUqWdFUUxy8jdpwW63E2vQZDIRRTNCLPBRxTIMq2qMypKTXGe1XvhHEASGsGxOY2TlxvffH+lU/557Ps3HcPBWhmHS0tISpkyb9HKZ0qUHchzHg5yvRnSgfJO7L48XfQYKL8FaQltwQcCjoii2i5cuTaxY8bZFEaApj2tfRAgguRcR8NHe7fdff9mxdp06b/IGY6L/ynAwW/+Wu8Zku+WBdDRN0yTJ8d/8BS/dPWUKCnHkd8+MGzeu/OjRo8eVK1euN8dxCXa7XRRFkec4jgVCUGWw+DxadXfvOklHlWWGE0XVmpFxTdPUjR99utfSqVMnzJ3O54K88847VR5t1+oNo8F4H8uwnKIqDMtka/t7P2v3nUqq368fY4FnBSx48M7IsnL12PEfnmjQ4N6PkdzzuUgxdDuSewwtZjin8vmePXWaPdz8XVVVK2vEi5uX9eGb3CGEDi7CKc4zd3LGqMtngiv4xtGjRzvWrdvgs3DOL1b6SktLE1u0aFHv/vvvb2M2m8urqmpQFIVTFEUAVy6jKhynLwL5H3xQEUueZVVOv3hw4ZvM5v9+Only65wFC9LxiCS43XHw4BedGt3T8E1VVc3QgiiIDHjm6eWN3CFgLu8AOz2FFMgd/gRdeZvV+u/L8+c0nDJlNqo7BrdUMfEUkntMLGP4J/HOO2/c1KJFm2WJCcmPQmkxbwFBen403WJ+AupY/S2XM6BOg5xqKSMzc9aIEWNmI6kEv84NGjQQDQaDkJyczDkcDtZqtZIFkWWZTVaUXO8BgecJyT89bBgrJSZqCxYscFSoUMGBaxDcGkB++9ChQxaWKJkyUOAFg0NykN8NniNxDD4JPLd2fM7+IZyVigvRjzKGZS+MGDGq5uLFi68HN1p8KhYQQHKPhVUsgjk0aNAgIT19z1yzKWEww7JCKOROLHdwyUPEsFu0vPNlpV25cvmDOS+8POCll176uwimil0iAiEjMGTIkBILFszfp6pKTYZheLPZyKiw192i5b11khe5kypwzgwHUKmDy2G32zMzM/eULFWmXciDxgaiGgEk96hevqIbPCjVffbZHkvpUqWGawyTpEtfZm+n3Gp0fs7cWfANw/9RPyW8+ODlRa6/T5w81r9OnUa7i27G2DMiEDwCO3e+e2erVm13i6JwGxF+YlW9IA+rB8L5cr37I3c4WSEfx6oKssCM0Wi0/vb77+MrVaqyJPjR4pOxgACSeyysYtHMgfv7zz/7lilX9jlVU28Gy8HdDU9TrrJzdLPJPcdHgPPMnYRru7nl6cZ0Pu/4688/51W4tdIUDBAqmsXGXkNCgD9y5EifOnVqv8yybHEqFQt/Uovbd+t512aAaHmIlJcliaQqKpJ07qfTPw2oVasuxqiEtGTR/zCSe/SvYZHNYO7cuRVGjRrxoaqqdxqNRldQHUTt0vQcKk/rGS1PCZ4G1Pkid5BOVRVF5nj+xLhxE+6fN29eZpFNGDtGBIJAAI6wtm17d37FihUGOBwOHkRn6IewN4GanF3kTe5w5g657SRKXpLAet81bPjIfmvWoHpgEEsVU48gucfUcoZ3MhaLhRs7dvSGhITEjizLmsASgYvm3ALJ5xVQR6x7jx1I68ZQ9zx5cRkMTFZm5sUFCxc1mjJlyh/hnSX2hgiEhsDmzZtrPP74Y5tYlq3L8zxJQ6QKgXCcldcVaLS8sw3t0KFDi++5577Rrhy50IaOT0cxAkjuUbx4kTD0Q4e+eqJWrbtWmM0mEEoh537UMoG/e3PL5xg3l3MLepI7WO56fWot4/iJE4Pr1WvwFr64ImHlcQyBIvDTT8d7V6lSbTnLskbqhqcywP4sd3rmDn15P5fPToXjeV4+8/OZ7tXuuOMdPL4KdHVi9z4k99hd27DM7MCB9EYNG967yWAwVKYqaPDigv8Byftyy7sG54vcaeVXRmGcxWnk8+d/X92rV7+R6enptrBMDjtBBEJEAFTpZs2avqlEyZKPCrzA07x2kJXV41Ky9fy9deVO7t4I3t0tzzCM7f33d9712GOPnQlx2Ph4DCCA5B4Di1iUU1i6dGnZAQOeAqukg6ZpLJHU1KPcXZaGbp34yHN37kCXCA6tf0ED7RiF1qrWZFk+vmPne706dXrih6KcM/aNCASKwPjx4yvMnTt7D8Mw1fWPX46RZJkRBQORATYY9Gh5X5c/cqcKdSA6xDDMxZdfXlBn7Nix/wY6PrwvdhFAco/dtQ3LzBo3bmzetu2dheXKlesP+btgqcPZO7XaXYFznofrztHRf/ZJ7qxK3PK8IGiyJEmHvj3Us0mTZlvCMjnsBBEIDQH26Inv/lfxloprkpOTy8EelyVVr+IGddxVcKl7VmbI2aEnuXta7/R5CDq9fu36e68sXtLLYrGgZyu0dYuJp5HcY2IZi3QS3OXL/45LSUmZomlaEknLgQpizj+zU32gpGjuF5k/cldViUhqQkEMjufVc2fPzln/5sZpFovFTbizSOePnSMCXhFo06aN8bXXFloqVaryDKjNgmgN5LVDkCiQO0S459ctTzuiH8OqIpGqfQzDWH/99dcxlStXfR2XAxEgH4EIAyIQKgJbt77VsHPnrjsUWS7HC/ohOtA4UeByuuN5qNtOOnK651WWBAIznAfhEy3t7I2pKap+5q7L02qZ167tnzrjuf9hKctQVw2fL2wEoOxu9+6pa0WD2FQQBH3jO0u8Uh0IUoLPeeXQf3D+s+uD2CM2hTyiagz8syrZQaP+p9//+mNA1ao1vijseWH70YEAknt0rFNEj3LZsmVi3z69NhmMxnYOyWaAFxJYE2ChGAwmJ6V7aMyrehocuBVzeOydf3G9y1zcrwfpqZLjn9Onf+5dq24DqHiF1ntE74z4HRykifbu3ePJWyrcvFQQhESOdX70uhWCIcQdErkrjOqQGMEoag6rffcTPXv13rZtG1bri99tl2PmSO64EQoEgZMnj3asdnv1tYLIpyiqXoiE53hGcZIzqQ+e03L3Su7uR5AkF1gi5+265a5pjGy3SRrDvD195uxRc+bMwRdZgaweNlLQCKSmpiatWrl8oznR1IbneQGcVBr8nxuZQ5+sU1ue/LcX3YecxZcY14cw+XeiTa8xmixl2WyOTe06Pv40ZpIU9EoG3R688PIOqAi66cAeRHIPDCe8yw8CkyZNumPa1CmrFE1qLAhQR0YvVcnxetUrX+Tu6Zb3jC+ClyJcVmsGOaMUeE6VHY6LBw992f2BB1rtw4VBBCIRgc8/31OzUYN73xaMQm33okqU3LMDSHPKMvuIO3VNkf6ckrumqhrPc5cP7N/fu+mDD0PthSIllEhci3gdE5J7vK58Ac971KhRxS3Tp85LSk7uA5aKokLQEJyd69WqPJXqXFHAHmfunuTusNkZo8lEz9wZh93KcBxn/fnHU6Nr1WmwHF9mBbyQ2FxBIMCdOnV8QLXbq73IcFox998D2rgrz13RT5b0I6rAX8cqo1vumqoqkt12uH3Hzq327NlzrSAGj23EBgKB76bYmC/OopAQgCpxn37yyahiJYpNEAShJLjRSaW4PMldzfVS82a5Q8UrWXGQCHyILuZ4Xvnn7793P/f8i10WL15sL6QpYbOIQFAILFiwoHiP7k+8XqJkiS6cwPLkbN0ZSEeI3Kn7oJc41rvID7kTHQn4GIDoe46znj93dnrFKtVfxhiUoJYrZh9Cco/ZpQ37xNhNmzbVS+3SebskOW7RWJU1GU3OiPlsC55Gy+dMi4N8X93Cz3WpemEMg0l370sOG8kPFnj+l/fe396lS5fu34d9ptghIpAHAhs2bGjQrWunHaqqludFgSUqjRpHPnYpuVPNeHdrPVDLPft3R4ViMed++vnHtDp16oNQDl6IgAuBaCD3Ig9MwP0SGALTp09Pmjxp/Ds8LzzICazRvaQlteBzkzsNeM9ZD572CJYN0eEWWJI/z/MsSY2zWa0Om9W6JG3wsClbtmyxBjZCvAsRKFwEILd99crlr5UrX/ZJVVVNnMDrEswa5yrvqis4soTss+WZA3fLU3IHL5bNavtsw8a3eg4aNOhC4c4MW482BKKB3KMN03geL/vLL6f7V65cZaHNmploMptJhLBuruSUn9VY/e8k4jfHlfM+XcULwurofc4zSg1CibQzH364p2v79u1Rjjaed10Ezf2tt1ZXfLxjt7c0TWliNBpZV4Cca//n/Ih192D5stzhd4AccREt+uyKcpquFxiMAAAgAElEQVSmOGRJ2jyy2YNPLT98WA9ywQsRcCKA5I5boUAROHHiSL2qlW9fbTQb7wbZWLBcQiF3+vLLJndoTaVqd/YvD36d1qzZg29gYF2BLiM2FhwC7LFjR3rUqH7HItHAl5AcDoYXndrxbuROPmqdwXP+yN2d8HVlO4Zkjej7Xc366quDTzZu3PT94IaLT8UyAkjusby6RTC3IUOGlJg3b+4KURA7iQYDyzirXmkehWMCtdzJW8wlW5tt5TvJXrl85cruF16Y98S8efMyi2C62CUi4ELg6aefLvX87Oc2GI3GFkaTgXzV0ipw2TBRzxRY4vCZqu9pOH7K68zd/WdwPKVIssoL7Jft2j/02EcfHbyMy4AIeCKA5I57okARAGWuYUOHPl2qdKk5kuRIFEXdcvdO7qorWjj3yy/nsDwJnssOq//31MlTw2vWrgvFZPKun1mgM8XGEIGcCOx+//2mrdu22cNynBECP0VS8tgTpWxyJ78XuqxynuRO3fEQewIZI3BJdkfmJ5/sHtW2fcdV6LXCnegNASR33BcFjgBoag8Y8NRehmEqMppC3mYu8Q0PC55YLOBmd/2799KwpA1iwetn8OSFSP5U1aysrE8XLlzS69lnn71Y4JPBBhGBABBo3ry58Nprr1ruvLP6RBBnhPRNsl9zZYF4J3e6n3OlgrKsK+iORNtrDJOVmckkJCb+9M7bm7p36Y7ZIgEsT1zeguQel8teuJNOS0sTp099dlKZsmWfFUUe6lv6JHfOGVAXCLnro3ZaOk6Cd1pI9oMHD7Zu0uQBVKwr3KXF1n0g8PLLL9cdPmzIeo5j60AAHFjt+gepHgSXfeWP3MEF7zxj14PpQMZWVWWb1bpv4OBBnTZs2HAdFwURQMsd90DYEPj1zJmHb6tSeQ3DKLcGQu6uanHOEXq68d0sdY85qIzNmqVKDnl+/4GDn92yZYsjbJPEjhABhmHgY3bShHEzK1WpMpphVCPZ79Qf77Tcswk+b3KngFIL3lXaVVb0PHmWhTyRjN9/+3XiuIkTl23ZsgWPonAXekUALXfcGIWCwMKFC8v17917fVLxlBYMo3LuKUHu+tm6Wz735Unu2QFF2YeY8MLU61nzTGZm1s/bt7/3ZI8efQ8XyoSwUUTABwKbN2+u3KXz4wdYjisPZd4gSwSKHZFsEWdtBd2KBwveMyU0u9EcgjbE2M8Wd1KzyV1VZPnQhrc2du7Tp8+fuCiIgC8EkNxxbxQKAiDmsWH92udKlC49zGG3mw1GIxGjgRccBAVJiswIvECqWnm+8AIfELz8SK0tcFc6/vnn4mtt2jz27OHDh7MCbwPvRASCRyA1NZWfMWN6vzvvvHMpwzAC7G8iusTzJCZEF7AhRRa8XFyOcsfOGBJyH7HcSSVEjvzOcHAMRcLrWfuFP/967snePeemp6fLwY8cn4x1BJDcY32Fi3B+0ydMuNUyZ/Y3DMuWsdtsHCkAQ0LgVELuBtGQfRgf1Djp+bvGSLKkiYL47/qVa1v0GTjwaFDN4UOIQD4RWLJk3m3duvVeU7p0qYeo2IyuQBdYcTaaEkoIXQ8Q1cnd+SeJkOcFRlU0qKnAWG9k/XLmzOmederXP5jPoeLtcYYAknucLXg4pzt8+HDjczMtbxQrXryjIssicVU6rXf4bxmsd07XjA/u0iPnNUYh7Qq8oJw798uoCROmLMWzyOAQxafyhQD/88+nRleteruF47hE2INUSQ7+Gy6qJ++rVXdy1+/JSe66Bc8yskTS4FR7lmP/6HHPPL506dIr+Rop3hx3CCC5x92Sh3XC7Pnffx9ctlzpOaLBWAzOIOFdBS5LeGHZHXbGKOrWfHCX/iKE8rJg3Siqwly/em3/O+++32fgwIHngmsTn0IEAkNg7ty5N48aNWK/IAiVOI7jwHKH/8H+pla8v5b8kTuctdtsNiYxKYVRFSXryn9XxpYuV+51zG33hyz+HMkd90ChIrD344/vbvZw8xWaqtbXNI3ThT2yc9WDP2/XrRxyHumMUZJkiREFo+3ihQvzmz7QfOaZM2ewHGyhrm78Ng5n7ZPGj+9Tp17d1yRJMppMJrIX6Xk7IEN14PNCyZPcXbUWqLgNHNbrhWaULGvW4Q/e/Si1a++uv8cv8jjzQBFAcg8UKbwvKAQgTWjWzJnjSpUuOZnj+URoBDSy4cVnMBhIHnDwV/aZOwmrI4FHgqoqyvmVq9a0HjRo0I/Bt41PIgK+EVi4cOGtT/XruywxKfF/kIsOe5lWQaRR7+5VEX215I/cFUkm7RqN5qubt2ye/M477y3HIyfcmYEgEMqbNZD28R5EgFmxYkWFPr17visaDPUUWRZIPXZB0C0bzllYIyicnBXiGIXRVJacv9usVnjRSpevXFnQt+9T03bv3o3We1DY4kO+ELBYLEJa2gBLsZSUUSazOZGSOXy0AslTlzw9g88TSTcFO5L14RR1ogF10KZoEFXJoR7Z9Pa6x3v3HoRWO27NgBBAcg8IJrwpFARSU1MNS5Ysmly8WLFneJ5PogpeROgjlzxn/npSVb3Gu92uv1jJhmZZ5sa168c+/PiDfl279sC89/xBinf7QWDWrFm3jBk98itzQsJNdrudNxqNhNCpBe9wOIiqnCsVLo/23D9uvZE7PJqZmZmlatqGsWMnPr18+XIs7Yo7NCAEkNwDgglvChWBTz/99IFmTe9fqGlqXYPBwOkWibfCGnpPOfXj3SvD5RyJpjmVu+gZp/NPq9XqsFmtiwcPHTYB3Zihrh4+TxGADJBRo0ZMqFihwiRBEEyqW8pbDhEapzyyP+RkVdP1HiCCRINCSpDbDmlvECEvMZzGqJwo/vD+jm3dH3us60/+2sOfIwIUASR33AthQaBv376mV15ZMC85KakPy7JJYN2AsI171SxvJS9pRSzfg8wOzgM3KGxoSD9SFEWTJOm3+QteuQ8LyoRlieOik6+//rphnTq11hoNxppEZsYHubt/oDo/V70HuLM8SQmFPcuzEBlKFRhVQu6CINp/OXN64bCRz0zHI6a42GIFNkkk9wKDEhvyh8DGjRvveLx9u3dNiYk1HFYrZzCbcpWC9Wwjv+QOVg9NtWM0zXHt+o31s2bNfnbevHmX/I0Pf44I5IWAxTKq+MgRU7cXL16sid1uF8D1TqVqfNViz6tGu+6i4kGAiTEIut4DFEIiRM+xjCrLjM1qO3PgwMHUVm3bHsHVQQTyg0Bhkju0HZhMU35GjPdGLQKpqanm1ctffyEpKTmNYVkTyWGDqlkh7EJ3tzxJsXO69KlKmCIr/549d3bknXfW3hi1wOHAIwEB9sOdO5u3aN1yq6IoJYnXCQSZ3I6QvA3SH7krzjekwPHkcUV2EF16Rg+skxXJ8c2s4aNbWpYvR0nlSNgFUTSGEF6rUTRLHGqkIMCe+elkx1tuqrDAlJh4G6MqjMbyeZK7v5djthtTP5cnGtxOiVsSlS+KijUz64tXLTPajps3LzNSgMBxRBcCu3fvrnR/k/uWJCUltWFZloOgTcnhJOI8ppJj/3oxd+BzlIPmgNiJJr2+fzXJoamqevW97e/17NKtx240lKJrv0TCaJHcI2EV4mgMS5Y8X2po2ti3WJ5/mFEVPhRyd9fiJgU64LydFtjI1veGs3f7d99/17dx46Zb3A414wh1nGooCDRv3lxYt2bVuFsrVZrCMIwZjHVa+Y3uO3/te36k0r/T6oeQOQL/BilwJNiUY1VN1T5eNG9+31HPPnvRX/v4c0TAEwEkd9wT4UaAPfj5503ua9x4K8Nz5RiNZd3d8p4FN/Ky3N1/Bu55uFwbmkYrQ8ATVOeSldOnfjo5qHbtu/eGe8LYX3QjsHHdujrdejzxkcMhlQd9BkEUidVO1RYDmZ0vcodoeZ7jSf13XYfeGVCnqVf/PP/7zJ69+y/G6m+BIBxx9xT5sTSSe8TtidgfUIcOHZLfWLN6cUpKSg+GFwXI783vRV+WVMqWWvGgeKepsm4FQVEZIpTDgbiNYrVZt44ZM67v2rVrbfntD++PTwSWLVtWrEO7R58rf/PNgxmGESFgk4jUgH48FIcJMOXNO7ln13Yn1roI1d+gBjyvZFz579M3V63rNWTcOAwEjc+tF/KskdxDhhAbCAIB9q8//upRrnzZl1VNLiOIItmHdpuNoWVhqdsz25LPfhG696dqQOL6v7jes870pBy687qlZdu+fVvXjh277MQzzCBWLQ4f+eGHHzrUqnXnBp7nE2VZZqmyIg3Y9OVZovuW86LAmOsZTa9q6MzygC/dK0uWLOo8fPjo9DiEHKdcQAgguRcQkNhM/hCYNGlSqYkTJ85PSUnqJkuSEVydYBW58t+hfCbPu9XF9k/u7iOAQrDwggUFO3hxgooYRCgpivTVjp3vD+3U6Ykf8jdivDveEJg4cWKJMWNGLi1TpmwXKGZIZWXdvUX+arezPhQYKcE77Fai90Au/QhJvXH9+q5ly1cOGIdWe7xtuQKdL5J7gcKJjeUHgV27dt318EMP7jCZzbfS43JwdRKXOseRc8hsczwwcgdSz0HypCC2foE8KJy+//7H+UVVqlQbh8F1+Vmt+LoXlOhGjx457NZbb53K83wxV8Amx5F9BOfj8D/PGBGdo7P3HJB7zr9nv3LpURKI1YDVDnvempl5I9Oa9UyZMuVX4f6Mrz1X0LNFci9oRLG9gBFYtWpV8hNdU182mU19WZYlKh7wggOChxcnsZBoPVfGN7mT56hr3oPcFUUibcGZJljvIPIpSY5L3333/VNPPz3yk8OHD6NWd8ArFj83pqenN2vatMk6nucrqarKAkEDAeveID2yXT/28b4vKVLeqh7mlKnVdItd38Sy7JDem/X8uP4zZiy+Hj9o40wLAwEk98JAFdsMFAH27NmfHylbpty6pOSkmzRV1eu+6AFwDKmR7WrJD7k772PdLHX9fam3AC9k+jJmWVZz2K1HX3zphe5Tp846Fehg8b74QADKFD///MxlxYqV6M3zPHHHk/Nw5z6ihE5J3jsq2fs1zwwQTaFeKk1V1PPffHu4V5MmTfbFB9I4y8JEAMm9MNHFtv0ikJaWlvDiiy9YihUrNkxVFBPhdp53pRr5D6gjFJ6dAsdka83rL2OoGqe/mMF6p+5U4PdLf1+cO2zE6BlYWMbvMsXNDc2bNzctWbKod5UqVaaazeYK9EydepJo5TcAxJtLPhuo3B+jJHPDI7oePj6Jp4rnpauXr2yYMHjIqOVbtlyLG8BxovlFIOAUOyT3/EKL9xc4Atu3b6/RssVDG4xGUz2O5znny464K/1Z7t5esO4V5YDcqdUOWuBwwQva6V79c/vWd7t169nzQIFPChuMSgQ++mjXva1a/e9tWZYrqKrKw56hljvdNxAxD0GagsAzitOlDg4ifd/lJHVftRGog0lRJZCbhUjPf/d8+vHjrVu3+zIqgcNBRxwCSO4RtyTxNyCwljZt2vhMmdKlx8iyXMJgMJAzTpqjriPi3S3vTu7ulhHNcwdRED2HWHT9CS9mIk0rCLIty/rl5q3vDO3bt++J+EMeZ+yOwOTJk8tNmDB+oSgKXQwGg0DP2HUiF1xn7bC3SFaHwcAougY8Q8naMzrepUTnFmSX09ekMJLkuPb9kSOzV61auxDrteOeLCgEkNwLCklsJyQEVqxYUaFfvz7vsgxTj2VZgaYd+bPcc6rU5RbDoRHNLgU7p1uUfjyoimL78dSpF+vcXX96SBPAh6MaAYiOnzx54oQyZcqMUVW1GKnMliMVM/f0yB4iZVr1i3xQemxB+Deaww6WvyDo92dlZjIJiYkkI0SWpPSuHTv1e+/DD3+NahBx8OFGIE8XPZJ7uJcD+/OFAPvbL2cGVrj11rmaphXjBYHszWztbu+We6jkrqmkIvf5w18fenr+okUf4Pl7fG7Qbdu2terYscO6jIyMcklJSWTvASn7i4bX6xBSl3y2Be9O+OA5gg8F8qGpysTqB7EmVSE14W6cPXN6asdOqa+fPHnSEZ/o46wLAwEk98JAFdsMCoEDBw5Ubdiw/quiIDwMUp/wEgT9bv3yTu56PS1wvue22t0laKn73iVbyyjEyoJCM5IkKbLkSN+774v+bdu2/S2oweNDUYvA2rVrq/bs2X1RZmZWy8TERBGI2GazEbd7XrUN9H2nyxx7Xu4WPDkugjs5jgHlRfg7iDZZs7Ikh92xbdmKlQMmTJhwI2oBxIFHJAJI7hG5LHE7KPaLL75o0KTxPVsZhq3IchyXrQAWHLn7QlJj9dQ4Hj4OWFZTFcVx5eqV95csWTrUYrH8G7crEGcTX79+fdnOnR9fz/N8c6PRaARPkd1uZ8xmM9kfvgRoKEzubnl36NzJ3V2sBs7u4dLjPrQjgwYP6b9mzZrv4gx2nG4YEEByDwPI2EXgCFgsFm7YsKHzSxQvngblNamIjTcxEGgVLCJyaTr5u1eY82ZRuf+cVOBSgOQViFhmHHb7tStXr0194okeS7ESV+BrFq13QinXOXNmD2zYsOE8nudJKVdwoYPFDn9SHXk6P+/7iSM70PPTMzvAzlloxk3sBirKsapmvXr16tKhIzpP2bLloDVaMcRxRy4CSO6RuzZxO7LNGzY0SH2y22JGY+6DDCMdCO9Sn4GQu/tL2d19D1K10LgiO2jwlKao2oWPP/6oe9u2j30etwsQJxM/ffp0h9tvr7KYYZiKUBQGCB0sdrgg+M0zoM6T3PUPRd/kTi12uIumd5K67RwH2/DE8hUrHx40aBB6ieJkv4V7mkju4UYc+/OLQJs2bYxr1qzqVbJEiVcEUUwIiNw9WtUYznUWSnKNnT93z5yHf1XhJS5wLtEchuHUa1ev7v3iwL5R7dp1gvS4/Nej9TtDvKGoEZg+fXrKsGHD3jCbjW0TExNdRWFgXPS8nQrXuI81RwCni9xZ+PTMMSUaC0LrswO50wwQjudtf/3++4ujxo6fiQGcRb0TYrd/JPfYXduon1nG9WvrEpMSu2gMk+DNcidysm6Hm0DcVKvOH7nDfTQUT5bsJMCJlJw1EstNzcrM2vnW25v7DRgw4HLUA4kTyIHApEmTygwfPvz5m24q11fTNME9XS0rK4tJSNC/J2mBGF/kTvYkSUaCuA23YjEeiol6CpxAq77JWZmZez7ZsSutY/fuf+DSIAKFhQCSe2Ehi+2GjMDp0z92qFK50gKO5ytroCpLisk484md+cPuWvK+FMK8DUTXFAE5UPgP8JJqrnxkyFbOsmZZL128OKNfv7TX0tPTM0KeDDYQEQhATEefXj0G3Vap0ixVVUvqMR2+i7/4jZZ3FpGhk3OpI8JJvHsUPd1wjHZp987dTz7aocNe9ApFxJaI2UEgucfs0kb/xFJTUw3LXl04OiEhaaoxMSkR0oh4QU+No9YQyMvmfLHmflF7DYRykruuPe+04TVnBD2na9FbbdZMm9XxfMuWrV/C6nHRv58sFoZ7osuRB6tWr75NEMUUKFSkMXr0uq/LH7n7LufqtOT1Gu2keU1Vrf9duvjazOfnPrt48WJ79COKM4hkBJDcI3l1cGzMunXrSnXr2mW70WS6j2EY3mG3Excnx4skZUkUdSKGK+eLOLfGtyec+os5u9AM/J2qiTnb0jRNPfP994d7v/DCy4fwfDS6N+SmTW/e16Fdh+fNiYkPWrMyOHNCAqOqeZdsDZTc3e/LEUinKiRqg2VZ2Wa3ff7bb+dG3XlnneNotUf3XoqG0SO5R8MqxfkYT//4Y4/ba1RboKlqGeJG1TTGISkkZYnKyuaGyL8FT7XooQ1aDjb73zTiHYDysIIgnDlz5pe0atWqpcf5UkTt9JctW1asZ88nN4uC8JAIhQbgOEaDkMq8yT2/E84meWeKpt4AfEX+vmfPZ4+3bNnyCBJ7flHF+4NBAMk9GNTwmbAiMGnS06UG9h81pnLVKqOhLCzH8ywod+oKdL6C2QMndyeJu0rD6pNTXVY8nAI4HLYPJ0x4ttfChQuvhnXy2FnICGzcuLHcvfc2GlqlSpVRmqqmgHcGLpLHHgZyt9ts1mvXr7/WrVv3Kenp6baQJ4QNIAIBIIDkHgBIeEvRI9C+ffuEDW+u35icnNyWYVnB4ZB9Wu66uz1nQQ86A08tevg7zWkmKXNOVTI3zRHm+vXrTHJKosNmtS975ZXZ0ydNeuFK0SOCIwgEgfXrX0ps3/6p54oXLz5AkeUkyGcHXXd6+RJHCqTtvO6hH52qosgZmRm79uzZO6Zz586/hNpulD4fcA3yKJ1fRA4byT0ilwUH5QUB9tixYy2qV6u6RBCEamC9y1CQwynn6X5/zhrvOsm7opi96IBDBD4lcyB6uGiQHTynl/cUGIfk+O/qtSuvzJo590UMiIr8PdqmTZuUTZs2jkpKShrOsmxJTdM4WggGxGRIfIUzQDPY2bhElLw3oKqaerxLl249tm3bBufseCECYUMAyT1sUGNHoSIAcqFvvbXhmfLlyk3RNC2R5ThS993zCobc9Q8AOM5XnZXA9Jc/kDsQgiTbwcLXzCZzxt//XJq07LUVaywWS1aoc8LnCwcB2Cuvv/7a01WrVp0qCEJJKi0Lx+1wgQQsFCUK2XLXdBc/vTwC8P774/z5aY8/3nkFZlsUzjpjq74RQHLH3RFVCLz66qvl0wb23yKI4j2yJBkEZ7S8LKvkzBxeriAjChe8yLOJPpCSsfBUzo8FV7CdMyjfbrerRqPx/IW//pq5YsVaIPgckVNRBWaMDrZ58+amRYsW9KpR444poihWyDOR3cuZu+cHY14R81DCVY/9IAWIoDY77ENNVVXrL2fPLu/S9YkpR48ezYxRqHFaEYwAknsELw4OzSsC7LnTpx+4ueItLxsMhrqZ1gwhMSFR1/hWVXJ+DlH0uisdLDNK1sGRO5ydkgpemq41Dn1omqaoqvrHF/sPDJ8wYfJHaJVF1E7lvv326w533333S6qqVREEwU84fO4f54fcGU0hpVx1dUMjAQI+AGVZ/mzmc7P7vfjii+cjCh0cTNwggOQeN0sdOxNNTU3lZ82Y2r7ibbctNScklFVUhQNr3WQ0wbk4IWGeE4lGOH3h5p49fal7/grkttyJPQ9St5yuV0/y6w28omrqj/v3HZzw8MMPf4DpTUW/v2BfjB07ukXtWrVfSkhMrKkoCk/P2PNSofMceV5lXqkVT++RHDayJ4iLH4I3oM6gopw7e/rsiBq1an2I+6Lo90W8jgDJPV5XPsrnnZaWVvqluc9P1xi1e0rx4qVAKV5RFYZ3qstRmVrf0wyM3GXZQdz75K0NAVg8T/4ED4HRaIQD158+/vijsXPmvPgJlokt0k3Ffv7553c2alh/kSiKDzAsK+as6hZ4Prtv1bns1yW9xz0VU5Fl+DK8cO7XX2dXq1bjdZJPiRciUEQIILkXEfDYbegIDB8+POXFubOXiEZDF57jTQ7JwYKlJvACY7M5GJPJ5OaW99Vf3i99arHD0+AdACsN8qP1XGndUpMVx8mDXx4c8dBDLVHkJvRlDaYFdt++fXffXbfOXJPJ2NRgNJpkSWKhGJC/YxlvnQVC7tSboyoSw3MsI8lECMlqs9tXr1v3xuQRI0ZcD2Yi+AwiUFAIILkXFJLYTpEgsH//Z/fee999S1mWrSPwAm+z6654UP2EK9stGxy5u1vsNCeeVPgirnq9E5bV1Os3rn+zL33fuA4dOh0Ewi8SMOKzU3bv3g+rNmx434sJ5oRWHM8n2qxWxmQ2625yV+pjaJa796A6lWFUXcLYZndIHM99t3XrtsE9evT4Ad3x8bkZI2nWSO6RtBo4lnwjkMowfNctbzV/pMUjLyUlJdURafg8ebuCxKg/yzz7V8DbC5zW4IY/qZsX7oO/w0sd/lRUiTEajMq1G9ePHz50ePzw4aPST5486cj3ZPCBfCEAZ+zjx49vUL1a5ecTEhIaa5pm5nmR5XieEDsEuvmy3EmpVvgw8yJw6M1y90nuMhzROFRBEE4c+e6HSfXuvXdXviaBNyMChYQAknshAYvNhheBzw+kD2ly333Pa5pWjGVZFs7eyRk8CxKjvi/3PGdfKU80vQ7O3inZZ7eokzyp7Q09ytrpixf/fr5nzz4b8Qy+UPcAt3fvx/Xr1284PyUluaGmMma9fCvDQHEhA/He6JHs+pXzI8+jBHuOgfond7ejdKJoqPy37Z13n1q5Zv1Hu3fvxmpvhbrs2HigCCC5B4oU3hfRCCxcuLBc1y6dJ5W/qXxfluNSoFS7nrMOVrbuJQeLDs7NeVFgIC9eFEQa4exzbnkp27kTPLQHWVcOh6yyLPvnl19++bTFYtmNBF/w2wYs9unPPtui8u1VZpsTEuqATDzDcPBNRzqjEsLees71AUdFaDQ9E4Ja9GT7EO+PTuSsU9xID6rUf0Y+IgymG3+cP7/s1lsrjUdXfMGvNbYYPAJI7sFjh09GGAKrV68u07VTp4WiKHQ2mM1GqB5Hz1xlWRe2IUFWTktOkiVGcEbX+5pK7lKeOe+kdeXdq8mxLKva7faf9u3bN7J169Z78KVfcBsFlOdmzpz2SIP6DWeJolhXEI16KoObxHB+yZ245lldpciT3IlqISkvo1cJhA842DeaojAGo8lhtzt2TZs2YwTmsxfcGmNLBYMAknvB4IitRAgC6Xv2NGrarNkrvMA3ZFRVBEtdJFHzzrrtTq14ltej6jU/yUqelp4v1z1NkwNiARIQRRFa/vXL/fufnTVnzjZ014a+QRo0aCBu3bq5503ly000mszVQDs2r6pu3qSJ3T8CdDbXJYZpbIaL3J1vRlhX2CeyZNcVD0GRjrj6NeX6tevfrln75mOjRo26GPrssAVEoGARQHIvWDyxtSJGAFy2nTt0qN2pc6dtosl0W/Zhq0Zc8iA2Aup1nABCN3y2qRbguH2Ru1O5zlU2FoRuDAaDqkj2C/9e/m/KsmUr39abJyoAACAASURBVLRYLHpVGrzyjUDNmjUNmzdv6nNH9erjFVWtbDAYeFLNz0/hF18ETwfA0Yg6jXNZ7e4WPOgnUMsd/h1IHrw/qkP6/fz580/fVrX6znxPBh9ABMKAAJJ7GEDGLsKPwIXzv6WWKll6HivwFaHMJ6RGKbJudVGC1oPj9LS2/FzuBO9eXMa9DVfgHVGqVTMu/f33xGUrV6/DYjP5QVq/F7Ti33rrzXHlypaD6m5lnBV+yJGLv8Iv/sjdXYRG782D5BVnlgS12BXIfVMvnDhxYuyMWXM2b9myBdMe87+k+EQYEEByDwPI2EX4EWjevGbS2FGznm772GPTZEkyC6Lo2utEK15VnYVl8vsrkF2ampI8dcnDLHVxG73ELMmxh4AtllUVST5/9eqVZS+8OO+VefPmYSGRALdEgwYNEpYtWza4dq07x/E8X1YQRRL2DgVawIImZOylMiCJh4NMSG8/c+vbk9w1NjuqHqx2aEb/UGMYa1aWZjYnWP+9eGnu0BE3zd6yBfUMAlxGvK0IEMjvm60IhohdIgLBITB37tzkIYPTliSnpLSz22wlgWxdGuBBiJt4GwWJsCbpULr2fK5LUwjha5qmybKcpWrMpvnzF8yeOnXqueBmFTdPsc2bNy+2atWqIbfddtsQnucrko8n2UGwBmIHTwx1y7sH0bl7VvyRO8N5T5TkGD3ATgEFOj1vXmM57sa/f/+98OPP0hf26NHjStysBE40KhFAco/KZcNBB4rAuHFDy08cP31GydKl+0GwvKooLJAtPXsXRb2SV7AXJXVd1EZXxKOR8+TfNMX1b6qqarwgZGTcuHH43K+/T65Tp87XqD/uHflFixZV6Nmz50STyZRqNptLy7LM6SV9NZK+SHDngYD1D6pgyJ2sk7OUr/sodItdb5eSO4TF2x22de+//8HYnj17orRssL8w+FzYEEByDxvU2FFRIfDxx9tvfqBZi808zzdgWdakW348oyqQKscT8nUnZwjUgnty1oP3Pnp/ViJEV1PCp+57luNka1bmD9evXJ/Q9rHHPseSsdnYQkDko48+WrNVq1aTypcv30nTNAMRK3BLdfP8b0ruOQja5Znxs+tYjbmelcGkJCTpZO7URIA4O/iYcH45SNaMrB0ffvDBzE5PPAHSsnghAhGPAJJ7xC8RDrAAEOB++OHbu6tWrTYzMSGxNcOyfGbGdTYxKYlRFA3+6rK2qWudRr/706b3R+6ksAi4dTXNpW4HQX2yJMlWq+3MXxf+Xjts2LDX9+zZc60A5hnVTaSmphrGjx//SL169SbxPN/IZrMZDQZDrneUt4wFT/e7r6wGT4AcMkS/GxhF1teJYzlG1VSGZzlS2lfgeXvGjYz0gX36DtmyY8evqFkQ1VssrgaP5B5Xyx3fk92+ffvtbf7X4g2WZRsKgiiQ3HdntDwlc0CIWmxgafsjd391wkletJtyGrTv9gGhcTx/1W53bPngg82TO3Xq81+8rtDQoUPLz35uxpDklJQBsiyXNZoSBJqJQDHJi7CDJXeNVZ1hc7pYjaY4j1dYDVImpStXrn2ybPnKcRaL5WS8rg3OOzoRQHKPznXDUQeHAHfo0MGHq1Wt+lxKUnIjluN4htfLt1JCJznwUDbWVfktL2V6QtV5joRl9PNhSj70T+gDLHhFUSDQzpqVZX1j794P53Tu3OOPeDqHBzd8ampq5QebNZ1Wukzp9pqmpfCCwFmtdq8le30RfLDkLquSLmbkVKAzCHr9AEV2OESD4cyOHTuGdujQaV9w2w2fQgSKDgEk96LDHnsuGgTYPbt3N3yk1SNrFUmqzvCCIMkyCM64B765XOn+h+iH3N0CwLxa8LpVD18Q4KY/lJ7+2YxHH23/aTyUjQVinzxhQvs7atYYbzInNNBU1UAwggwEqOoG1feoZJyPhfDENBAr370psNzhkh0S2QOSwwZ/lUSD4dD69evH7tz54TeYy+7/twDviDwEkNwjb01wRIWPAHfy+287VK1efYohIfFuVVVJ1RFPq9BvGhUZp39yB417GkHvqi/u1L0HTwEhFUkC2VrFbDaf+/rrr+ds2rT53YULF14tfCiKpofGjRubFy5c2Lp+/btfEASBSMlKksSCRwMCGo1GI/Go0GMTX6MMldyh5itoxYtgvZN0RsZht9nO/nD06Lh7770fy7cWzfbAXgsAAST3AgARm4hKBNj0PR82bXRfk2XmhITqUCWWCtC4oqSdKVZ5zc5fyVhwy3sSumd7VquVMZvN5J8lSQJTMsvhsG2ZP3/Ry9OmTYOzXn9nA1G1AEuWLLntySefTDObzf14jiknGgwe9VidBX8gCNGH5U415al8bLBueYfDRj4k4Lpy5YpcokSx77du3frM5s3vfr1lyxZHVAGLg0UE3BBAcsftEM8I8EeOHO5QufJtU1NSStTVNI2jsrF5CtMQxHQJNH/kTgqTUHEbasF7iN249+ksOqOpqirLsvzdsWMnRk6dOvVILBSeSUtLE9u3b3/XfffdN61EiRIteJ5PYBiVvIMkh4PEOQBWxCVP1P10VXdvFynJymrw/+QKltwhbx7wV1VV4jj2p2++/HJy42bNd8TzLwXOPTYQQHKPjXXEWQSPAPvll5+1uqfhfa/yglAZ/OyEbHVVMmI5Utevnq+uK9IB+dgddsYoQhq2/8tnpDdIlbtfzjNg5z8psuw4/dOPP69d/+ai1158cfUN/z1F5h3t27dPeO21JQPLlC7dXxCEmhA056+qWyAz0Q1736X9OGdddho0SYrNEDEcqAQHngGCv2yz2Y5fvPjPiAkTJqDFHgjweE/EI4DkHvFLhAMsbASgRviCl+d0q1P37lkMw97K8Tznrl1O+wdigLx4IAfeGU1PasYHeHkl+LzJnbHZsjST2XzZZsvavHr1qvlbtrz/a3p6ejRVl+N37nzntoYNm4wuWaJET1EUUhiW5RxQNc9o9Fv4xR+0NCDO1300UM79yEWvy+4qGCRJknTqn38uTbvlllu3++sPf44IRAsCSO7RslI4zkJFAEqKbty4tutdtetYWJatzHICISCw0EnamjNXnarNgcCJidSJz9+vUC6C9/Vt4LLgVXBZw10OWZIO/P33hbcnTJr2xpYtW6yFCkgBND569GhzaqdOHevWu7uP2WxqwnJcsgraAU7lN8BXNJhC6skXuVN3Pcuyms1mY2GtiI1Po/D1Aj/yjYwbx2bOnD34/PnzR/CMPaSlwIcjDIH8vZkibPA4HESgIBFITWX4kSP3Nr677t2vJCQk1YUgO72sKKjYsS5igD5JbXhnVbKAxwDHxE43seuZAMideBHA0mRZhWG0q1cuX3735Klj60eOnPh1JErXgidk3rw5darfXmNQcrFibRlNuwki4UWn2hyx2g2GgEq2+sPWH7lTKx3WzyNgUv73n38O7Pl074Tu3buDxj9eiEBMIYDkHlPLiZMpAATY77//9tGaNWvNFQShhizLAnHD8ywROiEWu1G3Ah0OmQmm8Exg0qj6OTL9iFA1GRTTyEeGpmlWk9F07vPP909dsmTp9kjKw4bc9TlzZrWvWLHiBE3V6muaJprMZhi0LhZExYGchXa8Vm7JxyJ6kju12GkT7ljD2kFkvKZpiqaqf61Yubzb4MHDDuajO7wVEYgaBJDco2apcKDhQgAIatCgQTUaNmywsFixlKaKophUTWFFQVcyA9cuz/EkP1rgIaAu71x3X+POm+Szg8R0gs8uX2az2zRwNxsNxkuXLv378e7du1a9/fY7XxdxRD3/1VdfNC5XplynChUr9mAYpqQgigKUZaUlWsnHisNB8DM63eT5PdbwxDIQcgf84DgFPtIcDofyzz//7Nq/d9/cn86e/cpisfiOxgvXhsN+EIFCQADJvRBAxSZjAgH2m2++qXnHHdXnJScnP2h3WM3gGgdSt9qsjJmQExikof0Kgeff+6VzDhAjjfAmKVuazBhEA4nUZ1lW5ThO4jjul8v/XX7r1VeXvWSxWIjEWjiv4cOHGx9r165lswcfeN5gNNwuORwEHP3YgpRzI7XXwXKHIDq44Oyd/Mip7R/8eP1zM3XJ8zwva5r217p1q1r36zfox+D7xCcRgchHILQ3U+TPD0eICISCALt06UtlUlN7zSlRsmQ7RZHLiILIyooM1cKclnto9eD9kTsdPHXPS7I9R/UyZzyAxrFclqIpn53+6cw7I0eO2frxxx9nhjLxQJ6F9LY5c+bcW65s6UGlSpVqxXJcMZvVyhqNRpbo5jvTzmgBGAikg/gBsKCJ9wM8ISF+HOWVBkc/jkC/XxRF27lzv67+9NMPXh44cPi5QOaH9yAC0YwAkns0rx6OPSwI9OvXr8yiRfMmJyWl9Mu4caNYUnIyoyp6tTdZYXTxFfhvmmKlMXoOvH6+62eMuks/t4teLzjjLq+qy+bkvMCSB28CXJIsqSzDX8/IyFiyatWaV8aOHftvYQFkWWZJ6N3yyTG33Va5N8uylRiGgdwylor/wLid8QF5DsH3x01gIwcRGpq2SD4m4INBVUmsgtNLAIV5MnieP7RixeKegwaNvhBYy3F9l7etFteAROPkkdyjcdVwzGFHIDU11dx/YJ9xrVu2Hmi32W4xmoyspoKYja5JTokYCI0GbuWnZKwvcnefqDcVNnjOIdmIqx4uVWU0cNXLsvzDhQsX1i1cuOj9+fPnQ6W5ArmGDu1bfuz4Z9uWLVOmc2JCYlNVZZLdiTzc5A4ldangEOAt0KMA/Xwfqs/8d/z48Re++OLLlSNGjLheICBgI4hAFCCA5B4Fi4RDjAwEWrduXXLdmpXTy91UvqfkcBQXRZFzSIqe1sUwDNWIdy8hG7zlrs/Zs1Ssh91OAsXAxQ0XLboC/83zvMqyrD0zM3PP4cPfP7t3795TFoslaPGbBg0aiOPGjaxxV927J9W8485HGYZJzrJmcWZTInmHuFvpnh6HvFYvf5Z7ToNS/yDS556ZkcEkJiXpH1pQslVRNJ7nLl67fmP9zp0fzOzdu3ehH1NExi7FUSACOgJI7rgTEIF8IAAW/JNPduvcrm2byZrGVOMFA5E6A2KlZAykY7PZvNYjz91Vzkj7vCrTuX8o0PskyZkz7mUOzo8M1Wq1XrXZ7Ks2b964+dNPPz+aT7EWdufOnXc0bFi/d5kyZfpyHFPGZrfxpEQuC2P3rPni7xjCc6D5zzTIiVF2QJ2T1OGYBFRlf/v+8HdjX3jppYhKFczHVsNbEYGQEEByDwk+fDgeEWjevLlp9eqVXStXrjydYZgKVquVmO5Q2Y1GthMXMQkYy5vsNEKQuS93sRtIv/O86M/pLzBY77rFrKfqwaVLrKqMQ3KoBtHgUDX15x9PnXpp4sSp7+7YsQOi6vMKNefGjx+f2LLlww83aXL/0wkJCU1lSTLxPE+C5ciHDC3w4mX8/uad/Uj+yN3b8QWj6JX3FEnSeKNBlhz2U3+cP/9C167dt0aiyE88/s7gnMOPAJJ7+DHHHmMDAXbN8uV1Oz/RdWpycnIbh8NhEgSB1ISnLupAAsoCIXdCpG4E7078xFHtFIgB74F7wTn4dziPNxr0iH7IjzcZTdftDuuXly7+u2vHjvc+evrpMWc94/TeeeeNmxo0aPK42Wh+pGz5ci3sNlui0WTiiY6+U4aXBq/RpaRk7h4AGNgyh0juqsJoUPcdPmQ0LcNqt+374dDhcY0ffPBUYP3jXYhAbCKA5B6b64qzCg8C7IoVKyrdf3+T/tWr3/6UpjHlBKh2BqLlspxDk97XcNzJ3f2smhK4N6sd2qI/V2SVcXZJusg+78+25OHfJdlBxmQymUBrXTGbzDck2XH6wl9/bfzkk08/laSMSxxnKte6dZtWpUqUaJWUknKPqihJsqwKVAAGxsdxIqmm5qpRz+r95Bi7U7LX/d98L0fg5O5V9EdTIYpQU2T5xqVL/2xZtXz57KmzZv3qJbEgPDsCe0EEIgQBJPcIWQgcRvQiAG76Za8tGVL9zjtH6ZH0Jj5Qt7QnuRPiBuvfGQ7jTu6eZEnvAi88uOO9nUWDi97uANEdMwEYVPWgHYMoEne9wAkKx/P/ZWbc+CExKbmuLCkpPM8aJUnhqeAMJXM9b10PHgSlOZHow2eTu2vshUDuuecGHwXkVEGz223XHDb7C63btF108ODBiC+oEyE7HdPdImQhCmsYSO6FhSy2G1cIAMEvWPDSw3Vr1Z6qskwDlmXB4mWJdrqzbjgNuoNUOZd6mzMgzZcUrae7OzBd+mzo9eez1e48F8XZHtwE/2M1DfzucL+v/Pv8LatnEKCnZo3n/GjrLFjkzipuIHpDWNyV968y4LEAxTlZlo8d+eHYwq1bt26fO3futfyNDu9GBGIXAST32F1bnFn4EWD37v2oRrPGTedoHNtSEMUEWVJYyL0GdzlE0CcmJpJRUcEbWj+FWr3uQ87LrR0oybuTqzdvAi1h69mvi2SdZ+zBQpnrLN7jjeNrjpTcadwCPW4AD4U1K0szJyTI1qysox/s/mRgly5dvg92fPgcIhCrCCC5x+rK4ryKDIHx48dXGJw2YFDFirf2FwxiWUWW+exqaHohFRBesduhlKvBizpd9tDdU+y8TcgfyXsjdPd/o+3TtgM9TggU3MDO3fXWcgbj6ZY7EemBErFOTXow5q1ZWVcuX/lv2TfffPVWp05PnMDz9UBXA++LJwSQ3ONptXGuYUMgLS0tYdq0Z3vdcvMtkyRJuhlKn+o1zDXXebWiQnl2kibvk+D9kbe/n/sja2/P+3umIEH0ldevaXphGUi3A7c8yMlClV273f6bJMuLBg0asjSSSt0WJCbYFiJQEAgguRcEitgGIuAFAaiW1rLlQ/e1eKTlaI5jW2iaajaZzRxoobvc4axeOc0XSfsjb/dugyFqf2f9hb2w7ml9OpvrkffugXq8IKiqoly5kZGx/89ff59pmT37RD6FeAp7Gtg+IhBxCCC5R9yS4IBiDYENG1be1rrlo6NLlSnTzW6zlebBSS+KpOAJaNMHIsEaKMnndZ83i1y/n8TSuWAPl+VO+nbX56HETkakUAEgRVGVq4cOfTtr+fKVb6xfv/6/WNsfOB9EoDAQQHIvDFSxTUTAA4E2be5NmTp1Xuu769QZbk5MqGfPykw0JiSygQfU5cxcyg5Uy1kPPpCPAM8IdvehFhaxs54iezRQj3WK5DmV/Fw586oGl6Qo8lffffvdotdXr961du3asNeqx42MCEQrAkju0bpyOO6oRMBimVRzwoTJ000m4/8cdkeSKBo5Yjf7iEr3VHzzJF9Pqz8Uci8sYifHDu7k7j5XIHcPYidBeKp6mWXYL9LT9818uHXrw0W82JgTXsQLgN3nHwEk9/xjhk8gAiEhMHr06JLt2rVu+0CzB4bzvFiX5ThRkWUWIupVRSGR9HARtz3LkoAyIDwQpKFR90CIEGQmGkzk3tykn/evtrf88rwi630FvrkD4e3DQpUVMmYyL47TFfQEgXHJ1yokUA7K2JE/JJvNyvHc8c8+S3/t7K+/fjBkyJBLIYGNDyMCcYqArzcAfqnG6YbAaYcNAf7ddzff0+z+Zr1LlirVSZblspDuBdHhIHJjMuuKcq7Lad0CwcP/SFEYogSXN4n7I2X3nxcGuUPAHHykCKKoi+S4Ctzo46Z1czRZVlVVtcmSvPGPv/9YWq1aTchdz2+JubAtHnaECEQ6Ami5R/oK4fhiGoGaNWsaNm584/G7at81i+P5W+02m2g0mVhrVhZjTkggZE8rzVGLnrqxgeQhIC8Yy52CWljkTtzwGsOoGqmtrkvV0ktRXJY6o8qapqoKywsn9u/77Lk3N23ZvXz58qyYXnScHCIQBgSQ3MMAMnaBCOSFQGpqKj937uyHS5Ys0y05KTGVYZgkjuc5z8prRMZWVXO47XnB4LOsbCDn76GSu89YAWpzO8/XQYsevA2ucrGyTL5JWIG7mnH12tYTJ0++NXHKlP3p6enkB3ghAohAaAgguYeGHz6NCBQYAmlpaeITqakd7n/g/mcMoqE+w7IGOIuHDqiSHK3VTvTWWZZxj7bPz0AoKYdK7gzndK97ONA9A+g0WSbETgrOiCIo0zg0WT6+cu3KF9LShmzzU1s+P1PDexEBRCBHcivCgQggApGAAL9r166aTZvc91RKsWJdGZYtyzCMAFY8EDwQJHXVg6sbztx9RblTXXY6KW9WdmGQO4l2d5I9fIzA32mMgO564P6+8t/lDVu3bdqSlvb0d1CpNhKAxzEgArGEAFrusbSaOJeYQmDNmmV3de7c7YXk5OT7wVXvsNt5Wk0OzrFBCIcG1OU3Wt4lXeOWlhZUQJ0Xy92d3OFjhGjDi6KiyHIWx3FfHTjwxYuf7tv3mcVicSa5x9Sy4WQQgYhAAMk9IpYBB4EIeEWAnT9/ftX/tWrV+o47avSSFbkmx3FJvMCxqqIXn3EnZP2/uTwL0eRlxQdP7irDanqJWHKp2T56VoN4OTWLE8U//v7zr9U//3Jm54MPPvhTHLnhMfMIf7mLBAEk9yKBHTtFBPKHgMViKTvwqb7jbr6pfAdFlW/lRaNJUWQGMuEEXmCgCA242BVZI7XiHfrZNrHs6Xm9omgkch3+zvPwEZA7P97XqKBtEp0PfYDXQBD0KH4BSF1lWMaZww5FXqw2PTpe0+yqrPyTZbeue3P12qVDxoz5M3+zxrsRAUQgWASQ3INFDp9DBMKMQMeOHYtbpky85/Zq1Z7iee4Bg8lUFqLq7Q47y7IcYxD1dDNZkRmeE51ErFvRoGQHZE698GDkKwrEtfnPk6epeO7n8yCgIwgcY7XbGLPJSPLe4IPCKJL8fEXKsl6RJCn90qVLG3Zs3PjZiBkzbmDeepg3DHYX1wggucf18gc0eXQrBgRT+G4a26tX4hPDhjx6a6VKqUlJic3MCQmlNEYj5eX0eDWOYRne9d+6Xrv+q+5eHz6QWutA4qRULXw06OlrenAcuVSiMkOKvIB6HscrqkOx3sjI+CTj2vX35i5Y8PbixYvt4UMGe0IEEAGKAJI77gVEIDoRYJvVq1e6W/++dXr17mlJSkqqw7JsEqvb5qzdrpNydsS8fhZPZWzhv11lZ/3Mn7ri4cMBXP1E9lYUGbvdyrDEva9pIi8osqqcOXf219X7Pvhw/ccHDvyL9dajc2PhqGMDAST32FhHnEUcI7BixeLKj/6vXWpycvL/EpOSGiqKkgg2Opx7u+vTu/vkvWnLe4OQWPccl0Pz3k1cx+ndV45du3J1/5Ej3y5r0eLRU+h+j+PNiFOPGASQ3CNmKXAgiEDwCKQyDF9qcO/yw4ePblKlStXxJlPi7bIkpQiiSCx5ULejRA3udIiqp8Vc/PbqPKgH17vVamUSEhNVVVEUSZb/+OeffzanpQ1eabWe+jM9/VdwwaMevF9A8QZEoPARQHIvfIyxB0QgnAiwy5csqda6bZtOpcuUetxgMNQWRBLlxoLFrRed4RmW48k5eSAStfBR4MyrB+J22GzWYw6H/fNjx46/tWfPviMWiwUlY8O5wtgXIhAAAkjuAYCEtyAC0YYAFKR54IGGZcaMmdC+bJlyQ4sVL1aZYRiT5LDzLMTWc3peOsfppVZ9XRBEJwggkCfbeJ4/c/aXX7bPnj13TXJy8oXFixc70FKPtp2B440XBJDc42WlcZ5xiYDFYuGysq7W6N69R7ubbirfuFy5cqB2VyIrM1M0m83EgneXtgWQaFlWRVFU0WDIvHH9+lGHzfb+udPntjdq2hQEaPBCBBCBCEcAyT3CFwiHhwgUEALC3ZUqJfUbPbxe+7Zt+1WuWqUBo2m3ahoDSepgzJN3gaZpGstxIAh/Pisr6/THH360es36DV+8//77lyAbroDGgs0gAohAISOA5F7IAGPziECkIdC8eXOhVauHG/Xt1aeRaDCUTExOKc0wSrGsjCyHIAh/y6py7Ysv9h9/9933v16/fv1/kTZ+HA8igAj4RwDJ3T9GeAciEKsIwME7V6lSJcFqtUJRGrVcufPy4cOkShsWdYnVVcd5xQUCSO7BLTOqtgWHGz6FCCACiAAiEAYEkNzDADJ2gQhEKQL4ERulC4fDRgSQ3HEPxBoCSEixtqI4H0QAEcg3Akju+YYMH0AEEAFEABFABCIbAST3yF4fHB0igAggAogAIpBvBJDc8w0ZPoAIIAKIACKACEQ2Akjukb0+ODpEABFABBABRCDfCCC55xsyfAARQAQQAUQAEYhsBJDcI3t9cHSIACKACCACiEC+EUByzzdk+AAigAggAogAIhDZCCC5R/b64OgQAUQAEUAEEIF8I4Dknm/I8AFEABFABBABRCCyEUByL5z1QZW0wsEVW40uBPD3ILrWC0cbQwggucfQYkbJVPCFHyULhcNEBBCB6EUAyT161w5HjggUNQL4oVbUK4D9IwI+EEByD25r4EstONzwKUQAEUAEEIEwIIDkHgaQsQtEABFABBABRCCcCCC5hxNt7AsRQAQQAUQAEQgDAkjuYQAZu0AEEAFEABFABMKJAJJ7ONHGvhABRAARQAQQgTAggOQeBpCxC0QAEUAEEAFEIJwIILmHE23sCxFABBABRAARCAMCSO5hABm7QAQQAUQAEUAEwokAkns40ca+EAFEABFABBCBMCCA5B4GkLELRAARQAQQAUQgnAgguYcTbewLEUAEEAFEABEIAwJI7mEAGbtABBABRAARQATCiQCSezjRxr4QAUQAEUAEEIGCRcBrrRMk94IFGVtDBBABRAARQASKHAEk9yJfAhwAIoAIIAKIACJQsAgguRcsntgaIoAIIAKIACJQ5AgguRf5EuAAEAFEABFABBCBgkUAyb1g8cTWEAFEABFABBCBIkcAyb3IlwAHgAggAogAIoAIFCwCSO4Fiye2hgggAogAIoAIFDkCSO5FvgQ4AEQgohDwmjMbUSPE+LBa6gAAAkRJREFUwSACiIBfBJDc/UKENyACiAAigAggAtGFAJJ7dK0XjhYRQAQQAUQAEfCLAJK7X4jwBkQAEUAEEAFEILoQQHKPrvXC0SICiAAigAggAn4RQHL3C1FE3IBBThGxDDgIRAARQASiAwEk9+hYJxwlIoAIIAKIACIQMAJI7gFDhTciAogAIoAIIALRgQCSe3SsE44SEfCGAB7X4L5ABBABrwgguePGQAQQAUQAEUAEYgwBJPcYW1CcDiKACCACiAAigOSOewARQAQQAUQAEYgxBJDcY2xBcTqIACKACCACiACSO+4BRAARQAQQAUQgxhBAco+xBcXpIAKIACKACCACSO64BxABRAARQAQQgRhDAMk9xhYUp4MIIAKIACKACCC54x5ABBABRAARQARiDAEk9xhbUJwOIoAIIAKIACKA5I57ABFABBABRAARiDEEkNxjbEFxOogAIoAIIAKIAJI77gFEABFABBABRCDGEEByj7EFxekgAogAIoAIIAJI7vG9B7BkaHyvP84eEUAEYhQBJPcYXdgwTws/EsIMOHaHCCACiEBeCCC54/5ABBABRAARQARiDAEk9xhb0AibDlr0EbYgOBxEABGIDwSQ3ONjnXGWiAAigAggAnGEAJJ7HC02ThURQAQQAUQgohAoNO8mkntErTMOBhFABCIIgUJ78UbQHHEoMYoAknuMLixOCxFABBABRCB+EUByj9+1x5kjAogAIoAIxCgCSO4xurA4LUQgBAToe0ELoQ18FBFABIoQgf8DdeMDc8OuBxAAAAAASUVORK5CYII=" alt="Blotter Management System" style="width: 120px; height: 120px; margin-bottom: 16px;" />
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
