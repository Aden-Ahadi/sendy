/**
 * CSV Parser Module
 * Reads and validates CSV file containing recipient data
 */

const fs = require('fs');
const csv = require('csv-parser');

class CSVParser {
  /**
   * Parse CSV file and return array of recipients
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} Array of recipient objects
   */
  static async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const recipients = [];
      const errors = [];

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const validation = this.validateRow(row, recipients.length + 1);
          
          if (validation.valid) {
            recipients.push({
              name: row.Name || row.name,
              email: row.Email || row.email,
            });
          } else {
            errors.push(validation.error);
          }
        })
        .on('end', () => {
          if (errors.length > 0) {
            console.warn(`⚠️  Warning: ${errors.length} invalid rows found:`);
            errors.forEach(err => console.warn(`   ${err}`));
          }

          if (recipients.length === 0) {
            reject(new Error('No valid recipients found in CSV file'));
            return;
          }

          resolve(recipients);
        })
        .on('error', (error) => {
          reject(new Error(`Error reading CSV file: ${error.message}`));
        });
    });
  }

  /**
   * Validate a CSV row
   * @param {Object} row - CSV row object
   * @param {number} lineNumber - Line number for error reporting
   * @returns {Object} Validation result
   */
  static validateRow(row, lineNumber) {
    const name = row.Name || row.name;
    const email = row.Email || row.email;

    // Check if required fields exist
    if (!name || !email) {
      return {
        valid: false,
        error: `Line ${lineNumber}: Missing required fields (Name: ${name || 'missing'}, Email: ${email || 'missing'})`,
      };
    }

    // Validate email format
    if (!this.isValidEmail(email)) {
      return {
        valid: false,
        error: `Line ${lineNumber}: Invalid email format: ${email}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get CSV statistics
   * @param {Array} recipients - Array of recipients
   * @returns {Object} Statistics object
   */
  static getStatistics(recipients) {
    const domains = {};
    
    recipients.forEach(recipient => {
      const domain = recipient.email.split('@')[1];
      domains[domain] = (domains[domain] || 0) + 1;
    });

    return {
      totalRecipients: recipients.length,
      uniqueDomains: Object.keys(domains).length,
      domainBreakdown: domains,
    };
  }
}

module.exports = CSVParser;
