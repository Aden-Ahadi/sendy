/**
 * Sendy - Main Entry Point
 * Send smarter, not harder.
 * Professional email sending system with personalization, logging, and progress tracking
 */

const cliProgress = require('cli-progress');
const colors = require('colors');
const { config, validateConfig } = require('./config/config');
const EmailService = require('./services/emailService');
const CSVParser = require('./utils/csvParser');
const Logger = require('./utils/logger');
const TemplateEngine = require('./utils/templateEngine');

class Sendy {
  constructor() {
    this.emailService = null;
    this.logger = null;
    this.progressBar = null;
    this.stats = {
      total: 0,
      sent: 0,
      failed: 0,
      startTime: null,
      endTime: null,
    };
  }

  /**
   * Initialize the email sender
   */
  async initialize() {
    try {
      console.log(colors.cyan.bold('\n� Sendy - Send smarter, not harder\n'));
      console.log(colors.gray('=' .repeat(50)));

      // Validate configuration
      validateConfig();
      console.log(colors.green('✓ Configuration validated'));

      // Initialize email service
      this.emailService = new EmailService();
      console.log(colors.green('✓ Email service initialized'));

      // Verify SMTP connection
      await this.emailService.verifyConnection();
      console.log(colors.green('✓ SMTP connection verified'));

      // Initialize logger
      this.logger = new Logger(config.logging.logFilePath);
      console.log(colors.green('✓ Logger initialized'));

      console.log(colors.gray('=' .repeat(50)));
      console.log(colors.green.bold('✓ Initialization complete!\n'));

      return true;
    } catch (error) {
      console.error(colors.red.bold('\n✗ Initialization failed:'));
      console.error(colors.red(error.message));
      return false;
    }
  }

  /**
   * Load and validate recipients from CSV
   * @returns {Promise<Array>} Array of recipients
   */
  async loadRecipients() {
    try {
      console.log(colors.cyan.bold('📋 Loading Recipients\n'));
      console.log(colors.gray(`Reading CSV: ${config.csv.filePath}`));

      const recipients = await CSVParser.parseCSV(config.csv.filePath);
      
      console.log(colors.green(`✓ Loaded ${recipients.length} recipients`));

      // Show statistics
      const stats = CSVParser.getStatistics(recipients);
      console.log(colors.gray('\nRecipient Statistics:'));
      console.log(colors.gray(`  Total Recipients: ${stats.totalRecipients}`));
      console.log(colors.gray(`  Unique Domains: ${stats.uniqueDomains}`));
      console.log(colors.gray(`  Domain Breakdown:`));
      
      Object.entries(stats.domainBreakdown).forEach(([domain, count]) => {
        console.log(colors.gray(`    - ${domain}: ${count}`));
      });

      console.log('');
      return recipients;
    } catch (error) {
      console.error(colors.red.bold('\n✗ Failed to load recipients:'));
      console.error(colors.red(error.message));
      throw error;
    }
  }

  /**
   * Load and validate email template
   * @returns {string} Template content
   */
  loadTemplate() {
    try {
      console.log(colors.cyan.bold('📧 Loading Email Template\n'));

      const templatePath = TemplateEngine.getDefaultTemplatePath();
      console.log(colors.gray(`Template: ${templatePath}`));

      const template = TemplateEngine.loadTemplate(templatePath);
      console.log(colors.green('✓ Template loaded successfully'));

      // Validate template
      const validation = TemplateEngine.validateTemplate(template);
      if (validation.warning) {
        console.log(colors.yellow(`⚠️  ${validation.warning}`));
      } else {
        console.log(colors.gray(`Found placeholders: ${validation.placeholders.join(', ')}`));
      }

      console.log('');
      return template;
    } catch (error) {
      console.error(colors.red.bold('\n✗ Failed to load template:'));
      console.error(colors.red(error.message));
      throw error;
    }
  }

  /**
   * Send emails to all recipients
   * @param {Array} recipients - Array of recipients
   * @param {string} template - Email template
   */
  async sendEmails(recipients, template) {
    this.stats.total = recipients.length;
    this.stats.startTime = Date.now();

    console.log(colors.cyan.bold('📨 Sending Emails\n'));
    console.log(colors.gray(`Total recipients: ${recipients.length}`));
    console.log(colors.gray(`Rate limit: ${config.email.delay}ms between emails`));
    console.log(colors.gray(`Max retry attempts: ${config.retry.maxAttempts}\n`));

    // Create progress bar
    this.progressBar = new cliProgress.SingleBar({
      format: colors.cyan('{bar}') + ' | {percentage}% | {value}/{total} | Current: {current}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
    });

    this.progressBar.start(recipients.length, 0, { current: 'Starting...' });

    // Send emails one by one
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      try {
        // Process template with recipient data
        const htmlContent = TemplateEngine.processTemplate(template, recipient);
        const subject = TemplateEngine.processSubject(config.email.subject, recipient);

        // Send email
        const result = await this.emailService.sendPersonalizedEmail(
          recipient,
          htmlContent,
          subject
        );

        // Log result
        this.logger.log(result);

        // Update stats
        if (result.success) {
          this.stats.sent++;
        } else {
          this.stats.failed++;
        }

        // Update progress
        this.progressBar.update(i + 1, {
          current: `${recipient.name} (${recipient.email})`,
        });

        // Apply rate limiting (except for the last email)
        if (i < recipients.length - 1) {
          await this.emailService.applyRateLimit();
        }
      } catch (error) {
        this.stats.failed++;
        this.logger.log({
          success: false,
          error: error.message,
          recipient,
          timestamp: new Date().toISOString(),
        });

        this.progressBar.update(i + 1, {
          current: `${recipient.name} - ERROR`,
        });
      }
    }

    this.progressBar.stop();
    this.stats.endTime = Date.now();
  }

  /**
   * Display final summary
   */
  displaySummary() {
    const duration = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);
    const successRate = ((this.stats.sent / this.stats.total) * 100).toFixed(2);

    console.log('\n');
    console.log(colors.cyan.bold('📊 Summary\n'));
    console.log(colors.gray('=' .repeat(50)));
    console.log(colors.white(`Total Emails:     ${this.stats.total}`));
    console.log(colors.green(`Successfully Sent: ${this.stats.sent}`));
    console.log(colors.red(`Failed:           ${this.stats.failed}`));
    console.log(colors.cyan(`Success Rate:     ${successRate}%`));
    console.log(colors.gray(`Duration:         ${duration} seconds`));
    console.log(colors.gray('=' .repeat(50)));

    // Show log file location
    console.log(colors.gray(`\n📝 Detailed log saved to: ${config.logging.logFilePath}`));

    // Show failed emails if any
    if (this.stats.failed > 0) {
      const failedEmails = this.logger.getFailedEmails();
      console.log(colors.yellow.bold('\n⚠️  Failed Emails:\n'));
      failedEmails.forEach(log => {
        console.log(colors.yellow(`  - ${log.recipient.name} (${log.recipient.email})`));
        console.log(colors.gray(`    Error: ${log.error}\n`));
      });
    }

    console.log('');
  }

  /**
   * Cleanup and close connections
   */
  cleanup() {
    if (this.emailService) {
      this.emailService.close();
    }
  }

  /**
   * Main execution flow
   */
  async run() {
    try {
      // Initialize
      const initialized = await this.initialize();
      if (!initialized) {
        process.exit(1);
      }

      // Load recipients
      const recipients = await this.loadRecipients();

      // Load template
      const template = this.loadTemplate();

      // Confirm before sending
      console.log(colors.yellow.bold('⚠️  Ready to send emails!\n'));
      console.log(colors.white(`You are about to send ${recipients.length} personalized emails.`));
      console.log(colors.gray('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n'));

      // Wait 5 seconds before starting
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Send emails
      await this.sendEmails(recipients, template);

      // Display summary
      this.displaySummary();

      // Cleanup
      this.cleanup();

      // Exit with appropriate code
      process.exit(this.stats.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error(colors.red.bold('\n✗ Fatal Error:'));
      console.error(colors.red(error.message));
      console.error(colors.gray('\nStack trace:'));
      console.error(colors.gray(error.stack));

      this.cleanup();
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(colors.yellow('\n\n⚠️  Process interrupted by user'));
  console.log(colors.gray('Cleaning up...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(colors.yellow('\n\n⚠️  Process terminated'));
  console.log(colors.gray('Cleaning up...'));
  process.exit(0);
});

// Start the application
const sendy = new Sendy();
sendy.run();
