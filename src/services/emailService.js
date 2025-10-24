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
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
      // Additional options for better deliverability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      throw new Error(`SMTP connection failed: ${error.message}`);
    }
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
