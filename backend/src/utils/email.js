const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n  [EMAIL] To: ${to}`);
    console.log(`  [EMAIL] Subject: ${subject}`);
    console.log(`  [EMAIL] Body: ${html.replace(/<[^>]*>/g, '')}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"Taskerzz" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const sendInviteEmail = async (email, token) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/invite/${token}`;
  await sendEmail({
    to: email,
    subject: 'You\'ve been invited to Taskerzz',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006A67;">Welcome to Taskerzz</h2>
        <p>You've been invited to join the team. Click the link below to set up your account:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #006A67; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
        <p style="color: #666; margin-top: 20px;">This link expires in 48 hours.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your Taskerzz password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006A67;">Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #006A67; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        <p style="color: #666; margin-top: 20px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendInviteEmail, sendPasswordResetEmail };
