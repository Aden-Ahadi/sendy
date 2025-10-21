/**
 * Logger Module
 * Logs email send results to JSON file
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
    this.ensureLogDirectory();
    this.initializeLogFile();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Initialize log file if it doesn't exist
   */
  initializeLogFile() {
    if (!fs.existsSync(this.logFilePath)) {
      this.writeLogFile([]);
    }
  }

  /**
   * Read existing log file
   * @returns {Array} Existing log entries
   */
  readLogFile() {
    try {
      const data = fs.readFileSync(this.logFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Write log entries to file
   * @param {Array} logs - Log entries array
   */
  writeLogFile(logs) {
    fs.writeFileSync(this.logFilePath, JSON.stringify(logs, null, 2), 'utf8');
  }

  /**
   * Log email send result
   * @param {Object} result - Email send result
   */
  log(result) {
    const logs = this.readLogFile();
    
    const logEntry = {
      timestamp: result.timestamp || new Date().toISOString(),
      recipient: {
        name: result.recipient.name,
        email: result.recipient.email,
      },
      status: result.success ? 'success' : 'failed',
      attempt: result.attempt || 1,
      messageId: result.messageId || null,
      error: result.error || null,
      response: result.response || null,
    };

    logs.push(logEntry);
    this.writeLogFile(logs);
  }

  /**
   * Get summary statistics from logs
   * @returns {Object} Summary statistics
   */
  getSummary() {
    const logs = this.readLogFile();
    
    const summary = {
      total: logs.length,
      successful: logs.filter(log => log.status === 'success').length,
      failed: logs.filter(log => log.status === 'failed').length,
      retriesUsed: logs.filter(log => log.attempt > 1).length,
    };

    summary.successRate = logs.length > 0 
      ? ((summary.successful / summary.total) * 100).toFixed(2) + '%'
      : '0%';

    return summary;
  }

  /**
   * Get failed email entries
   * @returns {Array} Failed log entries
   */
  getFailedEmails() {
    const logs = this.readLogFile();
    return logs.filter(log => log.status === 'failed');
  }

  /**
   * Clear log file
   */
  clear() {
    this.writeLogFile([]);
  }

  /**
   * Export logs to CSV format
   * @param {string} outputPath - Output CSV file path
   */
  exportToCSV(outputPath) {
    const logs = this.readLogFile();
    
    if (logs.length === 0) {
      throw new Error('No logs to export');
    }

    // CSV header
    const headers = ['Timestamp', 'Name', 'Email', 'Status', 'Attempt', 'MessageID', 'Error'];
    
    // CSV rows
    const rows = logs.map(log => [
      log.timestamp,
      log.recipient.name,
      log.recipient.email,
      log.status,
      log.attempt,
      log.messageId || '',
      log.error || '',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Write to file
    fs.writeFileSync(outputPath, csvContent, 'utf8');
  }

  /**
   * Create session report
   * @param {number} startTime - Session start timestamp
   * @param {number} endTime - Session end timestamp
   * @returns {Object} Session report
   */
  createSessionReport(startTime, endTime) {
    const summary = this.getSummary();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const failedEmails = this.getFailedEmails();

    return {
      summary,
      duration: `${duration} seconds`,
      failedEmails: failedEmails.map(log => ({
        name: log.recipient.name,
        email: log.recipient.email,
        error: log.error,
      })),
    };
  }
}

module.exports = Logger;
