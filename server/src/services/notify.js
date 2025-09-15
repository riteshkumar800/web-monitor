import nodemailer from 'nodemailer';

function haveSmtp() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return SMTP_HOST && SMTP_USER && SMTP_PASS;
}

export async function sendAlert({ subject, text, html }) {
  const to = process.env.ALERT_TO;
  if (!to) {
    console.log('[ALERT]', subject, text);
    return;
  }
  if (!haveSmtp()) {
    console.log('[ALERT:console]', subject, text);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({
    from: process.env.ALERT_FROM || 'Web Monitor <no-reply@local>',
    to, subject, text, html
  });
}
