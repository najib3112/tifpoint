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
    const frontendUrl = process.env.FRONTEND_URL || 'https://tif-point.netlify.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log(`📧 Frontend URL: ${frontendUrl}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
    
    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - TIFPoint</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          }
          .header-content {
            position: relative;
            z-index: 1;
          }
          .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .header h1 {
            font-size: 1.8em;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .header p {
            font-size: 1.1em;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          .greeting {
            font-size: 1.3em;
            color: #2d3748;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .message {
            font-size: 1.1em;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.1em;
            font-weight: 600;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
          }
          .alternative-link {
            background: #f7fafc;
            border: 2px dashed #e2e8f0;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
          }
          .alternative-link p {
            margin-bottom: 10px;
            color: #4a5568;
            font-weight: 500;
          }
          .url-box {
            background: #edf2f7;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #2d3748;
            border-left: 4px solid #667eea;
          }
          .warning-box {
            background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
            border: 1px solid #fc8181;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
          }
          .warning-title {
            color: #c53030;
            font-weight: 700;
            font-size: 1.1em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          .warning-title::before {
            content: '⚠️';
            margin-right: 8px;
            font-size: 1.2em;
          }
          .warning-list {
            list-style: none;
            color: #742a2a;
          }
          .warning-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
          }
          .warning-list li::before {
            content: '•';
            color: #c53030;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #718096;
            font-size: 0.9em;
            margin-bottom: 8px;
          }
          .footer .company {
            color: #4a5568;
            font-weight: 600;
          }
          .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, #667eea, transparent);
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="header-content">
              <div class="logo">🎓</div>
              <h1>TIFPoint</h1>
              <p>Sistem Manajemen Poin Mahasiswa</p>
            </div>
          </div>

          <div class="content">
            <div class="greeting">Halo ${userName}! 👋</div>

            <div class="message">
              Kami menerima permintaan untuk mengatur ulang kata sandi akun TIFPoint Anda.
              Jika Anda yang melakukan permintaan ini, silakan klik tombol di bawah untuk
              membuat kata sandi baru.
            </div>

            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">
                🔐 Atur Ulang Kata Sandi
              </a>
            </div>

            <div class="alternative-link">
              <p><strong>Tidak bisa mengklik tombol?</strong></p>
              <p>Salin dan tempel tautan berikut ke browser Anda:</p>
              <div class="url-box">${resetUrl}</div>
            </div>

            <div class="divider"></div>

            <div class="warning-box">
              <div class="warning-title">Penting untuk Diperhatikan</div>
              <ul class="warning-list">
                <li><strong>Tautan ini akan kedaluwarsa dalam 10 menit</strong></li>
                <li><strong>Tautan hanya dapat digunakan sekali</strong></li>
                <li><strong>Jika Anda tidak meminta reset ini, abaikan email ini</strong></li>
                <li><strong>Jangan bagikan tautan ini kepada siapa pun</strong></li>
              </ul>
            </div>

            <div class="message">
              Jika Anda mengalami kesulitan atau tidak meminta reset kata sandi ini,
              silakan hubungi tim support kami atau abaikan email ini.
            </div>

            <div style="margin-top: 30px; color: #4a5568;">
              Salam hangat,<br>
              <strong style="color: #2d3748;">Tim TIFPoint</strong> 💙
            </div>
          </div>

          <div class="footer">
            <p>Email otomatis ini dikirim dari sistem TIFPoint.</p>
            <p>Mohon jangan membalas email ini.</p>
            <div style="margin-top: 15px;">
              <p class="company">© 2024 TIFPoint - Sistem Manajemen Poin Mahasiswa</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textVersion = `
      🎓 TIFPoint - Reset Kata Sandi

      Halo ${userName}!

      Kami menerima permintaan untuk mengatur ulang kata sandi akun TIFPoint Anda.
      Jika Anda yang melakukan permintaan ini, silakan kunjungi tautan berikut:

      ${resetUrl}

      Reset Token (for developers): ${resetToken}

      PENTING UNTUK DIPERHATIKAN:
      • Tautan ini akan kedaluwarsa dalam 10 menit
      • Tautan hanya dapat digunakan sekali
      • Jika Anda tidak meminta reset ini, abaikan email ini
      • Jangan bagikan tautan ini kepada siapa pun

      Jika Anda mengalami kesulitan atau tidak meminta reset kata sandi ini,
      silakan hubungi tim support kami atau abaikan email ini.

      Salam hangat,
      Tim TIFPoint 💙

      ---
      Email otomatis ini dikirim dari sistem TIFPoint.
      Mohon jangan membalas email ini.
      © 2024 TIFPoint - Sistem Manajemen Poin Mahasiswa
    `;

    return await this.sendEmail({
      to: email,
      subject: '🔐 Reset Your TIFPoint Password',
      html: html,
      text: textVersion
    });
  }

  async sendWelcomeEmail(email: string, userName: string, tempPassword?: string): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL || 'https://tif-point.netlify.app'}/login`;
    
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
