/**
 * Email Service Module
 * Handles email sending with retry logic and rate limiting
 */

const nodemailer = require('nodemailer');
const { config } = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter
   */
  initializeTransporter() {
    // Prepare candidate transporter configs (try multiple ports/modes if needed)
    const enableDebug = (process.env.EMAIL_TRANSPORT_DEBUG === 'true');

    const host = process.env.SMTP_HOST || config.smtp.host;
    const user = process.env.SMTP_USER || (config.smtp.auth && config.smtp.auth.user);
    const pass = process.env.SMTP_PASS || (config.smtp.auth && config.smtp.auth.pass);

    // Allow overriding the list from env (comma separated list of ports)
    const portsEnv = process.env.SMTP_TRY_PORTS; // e.g. "465,587"
    const ports = portsEnv ? portsEnv.split(',').map(p => Number(p.trim())) : [465, 587];

    // Build candidate configs: try secure=true for 465 and secure=false for 587 by default
    this.candidateConfigs = ports.map(p => ({
      host,
      port: p,
      secure: p === 465, // common convention
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      logger: enableDebug,
      debug: enableDebug,
      connectionTimeout: Number(process.env.EMAIL_CONN_TIMEOUT) || 30000,
      greetingTimeout: Number(process.env.EMAIL_GREET_TIMEOUT) || 30000,
      socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT) || 30000,
    }));

    // Fallback: if config.smtp provides explicit port/secure, ensure it's tried first
    if (config && config.smtp && config.smtp.port) {
      const explicit = {
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.auth,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        logger: enableDebug,
        debug: enableDebug,
        connectionTimeout: Number(process.env.EMAIL_CONN_TIMEOUT) || 30000,
        greetingTimeout: Number(process.env.EMAIL_GREET_TIMEOUT) || 30000,
        socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT) || 30000,
      };
      // Put explicit config at the front unless it's already the first
      const first = this.candidateConfigs[0];
      if (!first || first.port !== explicit.port) {
        this.candidateConfigs.unshift(explicit);
      }
    }

    // transporter will be chosen after a successful verifyConnection call
    this.transporter = null;
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    // Try each candidate transporter until one succeeds
    const errors = [];
    for (const cfg of (this.candidateConfigs || [])) {
      try {
        const transporter = nodemailer.createTransport(cfg);
        // Await verify with a per-attempt timeout handled by nodemailer options
        await transporter.verify();
        // If verify succeeds, adopt this transporter for future sends
        this.transporter = transporter;
        console.log(`SMTP verify succeeded using ${cfg.host}:${cfg.port} secure=${cfg.secure}`);
        return true;
      } catch (err) {
        const msg = `Attempt ${cfg.host}:${cfg.port} failed: ${err.message}`;
        console.warn(msg);
        errors.push(msg);
        // continue to next candidate
      }
    }

    // If we reach here, all attempts failed
    throw new Error(`SMTP connection failed: ${errors.join(' | ')}`);
  }

  /**
   * Send email with retry logic
   * @param {Object} mailOptions - Nodemailer mail options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Send result
   */
  async sendEmailWithRetry(mailOptions, attempt = 1) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        attempt,
      };
    } catch (error) {
      // If max attempts reached, return failure
      if (attempt >= config.retry.maxAttempts) {
        return {
          success: false,
          error: error.message,
          attempt,
        };
      }

      // Wait before retry
      await this.delay(config.retry.delay);

      // Retry
      return this.sendEmailWithRetry(mailOptions, attempt + 1);
    }
  }

  /**
   * Send personalized email to a single recipient
   * @param {Object} recipient - Recipient data {name, email}
   * @param {string} htmlContent - Processed HTML content
   * @param {string} subject - Email subject
   * @param {string} replyTo - Optional reply-to email address
   * @returns {Promise<Object>} Send result with recipient info
   */
  async sendPersonalizedEmail(recipient, htmlContent, subject, replyTo = null) {
    // Generate plain text version from HTML
    const plainText = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim();

    const mailOptions = {
      from: `"${config.sender.name}" <${config.sender.email}>`,
      to: recipient.email,
      subject: subject,
      html: htmlContent,
      text: plainText, // Plain text version improves deliverability
      // Enable inline images via CID
      attachments: this.getInlineImageAttachment(),
      // Headers to improve deliverability and avoid Promotions tab
      headers: {
        'X-Priority': '3',
        'Importance': 'Normal',
        'X-Entity-Ref-ID': Math.random().toString(36).substring(7), // Unique ID per email
        'Precedence': 'bulk',
        'Auto-Submitted': 'auto-generated',
      },
    };

    // Add reply-to if provided (so replies go to the user, not Sendy email)
    if (replyTo) {
      mailOptions.replyTo = replyTo;
      // Keep sender name as configured in .env (don't change it)
      // From will always be: "Sendy <mysendyapp@gmail.com>"
      // Replies will go to: replyTo address
    }

    const result = await this.sendEmailWithRetry(mailOptions);
    
    return {
      ...result,
      recipient: {
        name: recipient.name,
        email: recipient.email,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get inline image attachment configuration
   * @returns {Array} Attachments array
   */
  getInlineImageAttachment() {
    if (!config.image.inlineImageUrl) {
      return [];
    }

    // If it's a URL, use it directly
    if (config.image.inlineImageUrl.startsWith('http')) {
      return [
        {
          filename: 'image.jpg',
          path: config.image.inlineImageUrl,
          cid: 'inline-image', // Referenced in HTML as cid:inline-image
        },
      ];
    }

    // If it's a local file path
    return [
      {
        filename: 'image.jpg',
        path: config.image.inlineImageUrl,
        cid: 'inline-image',
      },
    ];
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Apply rate limiting delay
   * @returns {Promise}
   */
  async applyRateLimit() {
    await this.delay(config.email.delay);
  }

  /**
   * Close transporter
   */
  close() {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

module.exports = EmailService;
