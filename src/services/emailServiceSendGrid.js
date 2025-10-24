/**
 * Email Service Module (SendGrid)
 * Handles email sending with retry logic and rate limiting
 */

const sgMail = require('@sendgrid/mail');
const { config } = require('../config/config');

class EmailService {
  constructor() {
    this.initializeSendGrid();
  }

  /**
   * Initialize SendGrid API
   */
  initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required in .env file');
    }
    
    sgMail.setApiKey(apiKey);
  }

  /**
   * Verify SendGrid API key
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    try {
      // SendGrid doesn't have a verify method, so we'll just check if API key exists
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }
      return true;
    } catch (error) {
      throw new Error(`SendGrid connection failed: ${error.message}`);
    }
  }

  /**
   * Send email with retry logic
   * @param {Object} mailOptions - SendGrid mail options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} - Result with status and details
   */
  async sendEmailWithRetry(mailOptions, attempt = 1) {
    try {
      await sgMail.send(mailOptions);
      
      return {
        success: true,
        recipient: mailOptions.to,
        attempt,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${mailOptions.to}:`, error.message);

      // Check if we should retry
      if (attempt < config.retry.maxAttempts) {
        console.log(`Retrying... (${attempt + 1}/${config.retry.maxAttempts})`);
        await this.delay(config.retry.delay);
        return this.sendEmailWithRetry(mailOptions, attempt + 1);
      }

      // All attempts failed
      return {
        success: false,
        recipient: mailOptions.to,
        attempt,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send personalized email to a single recipient
   * @param {Object} recipient - Recipient object with name and email
   * @param {string} htmlContent - HTML email content
   * @param {string} subject - Email subject
   * @returns {Promise<Object>} - Result object
   */
  async sendPersonalizedEmail(recipient, htmlContent, subject, replyTo = null) {
    // Generate plain text version from HTML
    const plainText = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim();

    const mailOptions = {
      from: {
        email: process.env.SENDER_EMAIL || config.sender.email,
        name: process.env.SENDER_NAME || config.sender.name,
      },
      to: recipient.email || recipient.Email, // Support both lowercase and uppercase
      subject: subject,
      html: htmlContent,
      text: plainText, // Plain text version improves deliverability
      // Use reply-to if provided, otherwise use sender email
      replyTo: replyTo || process.env.SENDER_EMAIL || config.sender.email,
    };

    const result = await this.sendEmailWithRetry(mailOptions);
    
    return {
      ...result,
      recipient: {
        name: recipient.name || recipient.Name,
        email: recipient.email || recipient.Email,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply rate limiting delay
   * @returns {Promise<void>}
   */
  async applyRateLimit() {
    await this.delay(config.rateLimit.delay);
  }

  /**
   * Get inline image attachment (for future use)
   * Note: SendGrid handles inline images differently than SMTP
   * @param {string} imagePath - Path to image file
   * @returns {Object|null} - Attachment object or null
   */
  getInlineImageAttachment(imagePath) {
    // For SendGrid, inline images would be handled via attachments with content_id
    // We'll keep this method for compatibility but won't use it in basic implementation
    return null;
  }

  /**
   * Close connection (not needed for SendGrid API)
   */
  close() {
    // SendGrid uses API calls, no persistent connection to close
    console.log('SendGrid service closed');
  }

  /**
   * Utility: Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = EmailService;
