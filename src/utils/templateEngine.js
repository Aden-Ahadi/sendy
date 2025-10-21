/**
 * Template Engine Module
 * Handles HTML template loading and personalization
 */

const fs = require('fs');
const path = require('path');

class TemplateEngine {
  /**
   * Load HTML template from file
   * @param {string} templatePath - Path to HTML template file
   * @returns {string} HTML template content
   */
  static loadTemplate(templatePath) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    return fs.readFileSync(templatePath, 'utf8');
  }

  /**
   * Replace placeholders in text with actual values
   * Supports {{placeholder}} format
   * @param {string} text - Text with placeholders
   * @param {Object} data - Data object with replacement values
   * @returns {string} Text with placeholders replaced
   */
  static replacePlaceholders(text, data) {
    let result = text;

    // Replace all {{key}} placeholders with corresponding data values
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, data[key] || '');
    });

    return result;
  }

  /**
   * Process HTML template with recipient data
   * @param {string} templateContent - HTML template content
   * @param {Object} recipient - Recipient data
   * @returns {string} Personalized HTML content
   */
  static processTemplate(templateContent, recipient) {
    return this.replacePlaceholders(templateContent, {
      Name: recipient.name,
      Email: recipient.email,
      // Add more placeholders as needed
      Year: new Date().getFullYear(),
    });
  }

  /**
   * Process subject line with recipient data
   * @param {string} subject - Subject line with placeholders
   * @param {Object} recipient - Recipient data
   * @returns {string} Personalized subject line
   */
  static processSubject(subject, recipient) {
    return this.replacePlaceholders(subject, {
      Name: recipient.name,
      Email: recipient.email,
    });
  }

  /**
   * Validate template for required placeholders
   * @param {string} templateContent - HTML template content
   * @returns {Object} Validation result
   */
  static validateTemplate(templateContent) {
    const placeholderRegex = /{{(\s*\w+\s*)}}/g;
    const placeholders = [];
    let match;

    while ((match = placeholderRegex.exec(templateContent)) !== null) {
      const placeholder = match[1].trim();
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    }

    return {
      isValid: placeholders.length > 0,
      placeholders,
      warning: placeholders.length === 0 
        ? 'No placeholders found in template. Email will not be personalized.'
        : null,
    };
  }

  /**
   * Get default template path
   * @returns {string} Default template path
   */
  static getDefaultTemplatePath() {
    return path.join(__dirname, '../../templates/email.html');
  }

  /**
   * Create template with inline image
   * @param {string} htmlContent - HTML content
   * @param {string} imageUrl - Image URL or CID reference
   * @returns {string} HTML with inline image
   */
  static embedInlineImage(htmlContent, imageUrl) {
    // If using CID (Content-ID), use cid:inline-image
    // If using URL, use the URL directly
    const imageSrc = imageUrl.startsWith('http') ? imageUrl : 'cid:inline-image';
    
    return htmlContent.replace(/{{IMAGE_SRC}}/g, imageSrc);
  }
}

module.exports = TemplateEngine;
