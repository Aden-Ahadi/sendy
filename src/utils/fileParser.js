/**
 * Excel/CSV Parser Module
 * Reads and validates CSV or Excel file containing recipient data
 */

const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');

class FileParser {
  /**
   * Parse CSV or Excel file and return array of recipients
   * @param {string} filePath - Path to file
   * @param {string} [originalName] - Original filename (to detect extension)
   * @returns {Promise<Array>} Array of recipient objects
   */
  static async parseRecipients(filePath, originalName = '') {
    const ext = (originalName || filePath).toLowerCase();
    if (ext.endsWith('.csv')) {
      return this.parseCSV(filePath);
    } else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      return this.parseExcel(filePath);
    } else {
      throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
    }
  }

  static async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const recipients = [];
      const errors = [];
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

  static async parseExcel(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const recipients = [];
    const errors = [];
    rows.forEach((row, idx) => {
      const validation = this.validateRow(row, idx + 1);
      if (validation.valid) {
        recipients.push({
          name: row.Name || row.name,
          email: row.Email || row.email,
        });
      } else {
        errors.push(validation.error);
      }
    });
    if (errors.length > 0) {
      console.warn(`⚠️  Warning: ${errors.length} invalid rows found:`);
      errors.forEach(err => console.warn(`   ${err}`));
    }
    if (recipients.length === 0) {
      throw new Error('No valid recipients found in Excel file');
    }
    return recipients;
  }

  static validateRow(row, rowNum) {
    const name = row.Name || row.name;
    const email = row.Email || row.email;
    if (!name || !email) {
      return { valid: false, error: `Row ${rowNum}: Missing name or email` };
    }
    // Basic email validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { valid: false, error: `Row ${rowNum}: Invalid email (${email})` };
    }
    return { valid: true };
  }
}

module.exports = FileParser;
