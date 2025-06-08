import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Support both Gmail and Brevo SMTP
    const emailConfig = process.env.EMAIL_HOST ? {
      // Brevo SMTP configuration
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    } : {
      // Gmail configuration (fallback)
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    console.log(`📧 Email service configured with: ${process.env.EMAIL_HOST || 'Gmail'}`);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Use verified sender email for Brevo
      const senderEmail = process.env.VERIFIED_SENDER_EMAIL || process.env.EMAIL_USER;

      const mailOptions = {
        from: `"TIFPoint System" <${senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - TIFPoint</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"> 
            <h1>🎓 TIFPoint</h1>
            <h2>Password Reset Request</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName},</h3>
            
            <p>You have requested to reset your password for your TIFPoint account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>

            <div style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>🔑 Reset Token (for developers):</strong><br>
              <code style="background: #1f2937; color: #f9fafb; padding: 8px; border-radius: 4px; display: block; margin-top: 8px; word-break: break-all;">
                ${resetToken}
              </code>
              <small style="color: #6b7280; margin-top: 8px; display: block;">
                You can use this token directly with the reset password API if needed.
              </small>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>This link can only be used <strong>once</strong></li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
            
            <p>Best regards,<br>
            <strong>TIFPoint Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>© 2024 TIFPoint - Student Point Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textVersion = `
      TIFPoint - Password Reset Request

      Hello ${userName},

      You have requested to reset your password for your TIFPoint account.

      Please visit the following link to reset your password:
      ${resetUrl}

      Reset Token (for developers): ${resetToken}

      Important:
      - This link will expire in 1 hour
      - This link can only be used once
      - If you didn't request this reset, please ignore this email

      Best regards,
      TIFPoint Team
    `;

    return await this.sendEmail({
      to: email,
      subject: '🔐 Reset Your TIFPoint Password',
      html: html,
      text: textVersion
    });
  }

  async sendWelcomeEmail(email: string, userName: string, tempPassword?: string): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to TIFPoint</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to TIFPoint!</h1>
          </div>
          
          <div class="content">
            <h3>Hello ${userName},</h3>
            
            <p>Welcome to TIFPoint - Student Point Management System!</p>
            
            <p>Your account has been successfully created. You can now start tracking your competency points and activities.</p>
            
            ${tempPassword ? `
              <div style="background: #fef3cd; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>🔑 Temporary Password:</strong> ${tempPassword}<br>
                <small>Please change your password after first login for security.</small>
              </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to TIFPoint</a>
            </div>
            
            <p>Best regards,<br>
            <strong>TIFPoint Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: '🎉 Welcome to TIFPoint!',
      html: html
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
