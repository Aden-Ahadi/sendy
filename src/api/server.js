/**
 * Sendy API Server
 * RESTful API wrapper around the existing email sender
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { config } = require('../config/config');
const EmailService = require('../services/emailService');
const SenderManagementService = require('../services/senderManagementService');
const CSVParser = require('../utils/csvParser');
const Logger = require('../utils/logger');
const TemplateEngine = require('../utils/templateEngine');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret (move to .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Sendy API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoint (temporary - will be replaced by Supabase)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // TODO: Implement proper authentication with database
  // For now, simple validation
  if (email && password) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token,
      user: { email }
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

// Create campaign endpoint
app.post('/api/campaigns/send', authenticateToken, upload.single('csv'), async (req, res) => {
  try {
    const { subject, templateId, replyTo } = req.body;
    const csvFile = req.file;

    if (!csvFile) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    if (!subject) {
      return res.status(400).json({ error: 'Email subject required' });
    }

    // Create campaign ID
    const campaignId = `campaign_${Date.now()}`;
    
    // Parse CSV
    const recipients = await CSVParser.parseCSV(csvFile.path);
    
    // Load template
    const templatePath = TemplateEngine.getDefaultTemplatePath();
    const template = TemplateEngine.loadTemplate(templatePath);
    
    // Initialize services
    const emailService = new EmailService();
    const logger = new Logger(`./logs/${campaignId}.json`);
    
    // Verify SMTP connection
    await emailService.verifyConnection();
    
    // Send emails in background (don't wait)
    sendEmailsAsync(campaignId, recipients, template, subject, emailService, logger, replyTo);
    
    // Return immediately with campaign info
    res.json({
      success: true,
      campaignId,
      totalRecipients: recipients.length,
      status: 'sending',
      message: 'Campaign started. Emails are being sent in the background.',
      replyTo: replyTo || config.sender.email
    });
    
    // Cleanup uploaded file
    fs.unlinkSync(csvFile.path);
    
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message 
    });
  }
});

// Get campaign status
app.get('/api/campaigns/:campaignId', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const logPath = `./logs/${campaignId}.json`;
    
    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const logger = new Logger(logPath);
    const logs = logger.readLogFile();
    
    const summary = {
      campaignId,
      total: logs.length,
      successful: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      status: logs.length > 0 ? 'completed' : 'sending',
      logs: logs.slice(-10) // Last 10 entries
    };
    
    res.json(summary);
    
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ 
      error: 'Failed to get campaign status',
      details: error.message 
    });
  }
});

// Get campaign logs
app.get('/api/campaigns/:campaignId/logs', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const logPath = `./logs/${campaignId}.json`;
    
    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: 'Campaign logs not found' });
    }
    
    const logger = new Logger(logPath);
    const logs = logger.readLogFile();
    
    res.json({
      campaignId,
      logs,
      summary: logger.getSummary()
    });
    
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ 
      error: 'Failed to get campaign logs',
      details: error.message 
    });
  }
});

// ==========================================
// SENDER MANAGEMENT ENDPOINTS
// ==========================================

// Add verified sender for a user
app.post('/api/settings/sender', authenticateToken, async (req, res) => {
  try {
    const { fromName, fromEmail, replyTo, address, city, country } = req.body;
    
    if (!fromEmail || !fromName) {
      return res.status(400).json({ error: 'From email and name are required' });
    }
    
    const senderService = new SenderManagementService();
    const result = await senderService.createVerifiedSender({
      nickname: `${req.user.email}_sender`,
      fromEmail,
      fromName,
      replyTo: replyTo || fromEmail,
      address: address || '123 Main St',
      city: city || 'New York',
      country: country || 'United States',
    });
    
    // TODO: Save senderId to database with user profile
    
    res.json(result);
    
  } catch (error) {
    console.error('Add sender error:', error);
    res.status(500).json({ 
      error: 'Failed to add sender',
      details: error.message 
    });
  }
});

// Get sender verification status
app.get('/api/settings/sender/:senderId', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.params;
    
    const senderService = new SenderManagementService();
    const status = await senderService.getSenderStatus(senderId);
    
    res.json(status);
    
  } catch (error) {
    console.error('Get sender status error:', error);
    res.status(500).json({ 
      error: 'Failed to get sender status',
      details: error.message 
    });
  }
});

// Resend verification email
app.post('/api/settings/sender/:senderId/resend', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.params;
    
    const senderService = new SenderManagementService();
    const result = await senderService.resendVerification(senderId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: 'Failed to resend verification',
      details: error.message 
    });
  }
});

// Delete sender
app.delete('/api/settings/sender/:senderId', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.params;
    
    const senderService = new SenderManagementService();
    const result = await senderService.deleteSender(senderId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Delete sender error:', error);
    res.status(500).json({ 
      error: 'Failed to delete sender',
      details: error.message 
    });
  }
});

// Background email sending function
async function sendEmailsAsync(campaignId, recipients, template, subject, emailService, logger, replyTo = null) {
  try {
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Process template
      const htmlContent = TemplateEngine.processTemplate(template, recipient);
      const processedSubject = TemplateEngine.processSubject(subject, recipient);
      
      // Send email with optional reply-to
      const result = await emailService.sendPersonalizedEmail(
        recipient,
        htmlContent,
        processedSubject,
        replyTo  // Replies go to user's email, not Sendy email
      );
      
      // Log result
      logger.log(result);
      
      // Apply rate limiting
      if (i < recipients.length - 1) {
        await emailService.applyRateLimit();
      }
    }
    
    console.log(`Campaign ${campaignId} completed successfully`);
    
  } catch (error) {
    console.error(`Campaign ${campaignId} error:`, error);
  } finally {
    emailService.close();
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   📧 Sendy API Server                 ║
║   Send smarter, not harder            ║
╚═══════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ Health check: http://localhost:${PORT}/health
✓ API docs: http://localhost:${PORT}/api/docs

Ready to send emails! 🚀
  `);
});

module.exports = app;
