import nodemailer from 'nodemailer';

export const emailService = {
  isConfigured: () => {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  },

  sendEmail: async (to: string, subject: string, body: string) => {
    try {
      if (!emailService.isConfigured()) {
        console.warn('[EmailService] EMAIL_SMTP_NOT_CONFIGURED. Email not sent.');
        throw new Error('EMAIL_SMTP_NOT_CONFIGURED');
      }

      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = Number(process.env.SMTP_PORT || 587);
      const secure = process.env.SMTP_SECURE === 'true';
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD;
      const fromName = process.env.SMTP_FROM_NAME || 'IDSphere';

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure, // false for TLS (port 587)
        auth: {
          user,
          pass,
        },
      });

      const mailOptions = {
        from: `"${fromName}" <${user}>`,
        to,
        subject,
        text: body,
      };

      await transporter.sendMail(mailOptions);
      
      const safeUser = user || '';
      const maskedUser = safeUser.includes('@') 
        ? safeUser.split('@')[0].slice(0, 2) + '***@' + safeUser.split('@')[1]
        : safeUser.slice(0, 2) + '***';
      console.log(`[Email Diagnostic] Operation: sendEmail, SMTP Host: ${host}, SMTP User: ${maskedUser}, Status: SUCCESS`);
      
      return true;
    } catch (error: any) {
      if (error.message !== 'EMAIL_SMTP_NOT_CONFIGURED') {
        const safeUser = process.env.SMTP_USER || '';
        const maskedUser = safeUser.includes('@') 
          ? safeUser.split('@')[0].slice(0, 2) + '***@' + safeUser.split('@')[1]
          : safeUser.slice(0, 2) + '***';
        console.error(`[Email Diagnostic] Operation: sendEmail, SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}, SMTP User: ${maskedUser}, Status: FAILED`);
        // We log the error internally, but don't expose secrets
        console.error(`[EmailService] Internal Error: ${error.message}`);
      }
      throw new Error(error.message === 'EMAIL_SMTP_NOT_CONFIGURED' ? 'EMAIL_SMTP_NOT_CONFIGURED' : 'SMTP_SEND_FAILED');
    }
  }
};
