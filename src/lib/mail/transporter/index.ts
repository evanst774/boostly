// ============================================
// Email Transporter
// ============================================
import dns from 'dns';
import nodemailer from 'nodemailer';

// Prefer IPv4 results so Node doesn't fall through to an
// unproxied/unreachable IPv6 address for outbound SMTP.
dns.setDefaultResultOrder('ipv4first');

const isDev = process.env.NODE_ENV === 'development';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Only enable logging in development
  logger: isDev,
  debug: isDev,
});

export { transporter };
