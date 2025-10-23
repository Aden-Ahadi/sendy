/**
 * Configuration Module
 * Loads and validates environment variables
 */

require('dotenv').config();

const config = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  sender: {
    name: process.env.SENDER_NAME || 'Sender',
    email: process.env.SENDER_EMAIL || process.env.SMTP_USER,
  },
  email: {
    subject: process.env.EMAIL_SUBJECT || 'Hello {{Name}}!',
    delay: parseInt(process.env.EMAIL_DELAY) || 2000,
  },
  email: {
    subject: process.env.EMAIL_SUBJECT || 'Hello {{Name}}!',
    delay: parseInt(process.env.EMAIL_DELAY) || 2000,
  },
  csv: {
    filePath: process.env.CSV_FILE_PATH || './data/emails.csv',
  },
  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    delay: parseInt(process.env.RETRY_DELAY) || 5000,
  },
  logging: {
    logFilePath: process.env.LOG_FILE_PATH || './logs/email-log.json',
  },
  image: {
    inlineImageUrl: process.env.INLINE_IMAGE_URL || '',
  },
};

/**
 * Validates required configuration
 * @throws {Error} if required config is missing
 */
function validateConfig() {
  const required = [
    { key: 'SMTP_USER', value: config.smtp.auth.user },
    { key: 'SMTP_PASS', value: config.smtp.auth.pass },
  ];

  const missing = required.filter(item => !item.value);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.map(item => item.key).join(', ')}\n` +
      'Please create a .env file based on .env.example'
    );
  }
}

module.exports = { config, validateConfig };
