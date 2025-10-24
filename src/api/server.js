/**
 * Sendy API Server
 * RESTful API wrapper around the existing email sender
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { config } = require('../config/config');
// Use SMTP email service (SendGrid support removed)
const EmailService = require('../services/emailService');
const SenderManagementService = require('../services/senderManagementService');
const FileParser = require('../utils/fileParser');
const Logger = require('../utils/logger');
const TemplateEngine = require('../utils/templateEngine');
const fs = require('fs');
const path = require('path');
const net = require('net');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Sendy API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});


// Temporary debug endpoint: check TCP connectivity to SMTP host/port
// Deploy this temporarily on Render, call it once, then remove the route.
app.get('/api/debug/tcp-check', async (req, res) => {
  const host = process.env.SMTP_HOST || (config && config.smtp && config.smtp.host) || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || (config && config.smtp && config.smtp.port) || 587);
  const timeoutMs = Number(process.env.EMAIL_TCP_CHECK_TIMEOUT) || 8000;

  const socket = new net.Socket();
  let done = false;

  const clean = (ok, msg) => {
    if (done) return;
    done = true;
    try { socket.destroy(); } catch (e) {}
    res.json({ host, port, ok, msg });
  };

  socket.setTimeout(timeoutMs);
  socket.on('connect', () => clean(true, 'connected'));
  socket.on('timeout', () => clean(false, 'timeout'));
  socket.on('error', (err) => clean(false, String(err)));

  try {
    socket.connect(port, host);
  } catch (err) {
    clean(false, String(err));
  }
});


// Create campaign endpoint
app.post('/api/campaigns/send', upload.single('recipientsFile'), async (req, res) => {
  try {
    const { subject, templateId, replyTo, emailContent, emailType } = req.body;
    const recipientsFile = req.file;

    console.log('📧 Campaign Request Received:');
    console.log('  - Subject:', subject);
    console.log('  - Reply-To:', replyTo);
    console.log('  - Email Type:', emailType || 'default');
    console.log('  - Custom Content:', emailContent ? 'YES' : 'NO');
    console.log('  - Recipients File:', recipientsFile ? recipientsFile.originalname : 'NO FILE');
    console.log('  - File Path:', recipientsFile ? recipientsFile.path : 'NO PATH');

    if (!recipientsFile) {
      return res.status(400).json({ error: 'Recipients file (CSV or Excel) required' });
    }

    if (!subject) {
      return res.status(400).json({ error: 'Email subject required' });
    }

    // Create campaign ID
    const campaignId = `campaign_${Date.now()}`;

    // Parse recipients from file (CSV or Excel)
    console.log('📄 Parsing recipients from:', recipientsFile ? recipientsFile.path : 'NO FILE PATH');

    // Debug: log uploaded file info and preview (first 1kb)
    try {
      console.log('Uploaded file object:', recipientsFile ? {
        originalname: recipientsFile.originalname,
        mimetype: recipientsFile.mimetype,
        size: recipientsFile.size,
        path: recipientsFile.path
      } : null);
      if (recipientsFile && recipientsFile.path && fs.existsSync(recipientsFile.path)) {
        const preview = fs.readFileSync(recipientsFile.path, 'utf8').slice(0, 1024);
        console.log('Uploaded file preview (first 1kb):');
        console.log(preview);
      }
    } catch (dbgErr) {
      console.warn('Failed to read uploaded file for debug:', dbgErr.message);
    }

    const recipients = await FileParser.parseRecipients(recipientsFile.path, recipientsFile.originalname);
    console.log(`✅ Parsed ${recipients.length} recipients:`, recipients);

    // Require custom email content
    if (!emailContent) {
      return res.status(400).json({ 
        error: 'Email content required',
        message: 'Please provide email content in the emailContent field' 
      });
    }

    // Use custom content from frontend
    const template = emailContent;
    console.log('✅ Using custom email content from frontend');

    // Initialize services
    const emailService = new EmailService();
    const logger = new Logger(`./logs/${campaignId}.json`);
    
    // Verify connection (SMTP or SendGrid)
    await emailService.verifyConnection();
    
    // Send emails in background (don't wait)
    sendEmailsAsync(campaignId, recipients, template, subject, emailService, logger, replyTo);
    
    // Cleanup uploaded file (best-effort)
    try {
      if (recipientsFile && recipientsFile.path && fs.existsSync(recipientsFile.path)) {
        fs.unlinkSync(recipientsFile.path);
      }
    } catch (unlinkErr) {
      console.warn('Failed to remove uploaded file:', unlinkErr.message);
    }

    // Return immediately with campaign info
    res.json({
      success: true,
      campaignId,
      totalRecipients: recipients.length,
      status: 'sending',
      message: 'Campaign started. Emails are being sent in the background.',
      replyTo: replyTo || config.sender.email
    });
    
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message 
    });
  }
});

// Get campaign status
app.get('/api/campaigns/:campaignId', async (req, res) => {
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
app.get('/api/campaigns/:campaignId/logs', async (req, res) => {
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
app.post('/api/settings/sender', async (req, res) => {
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
app.get('/api/settings/sender/:senderId', async (req, res) => {
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
app.post('/api/settings/sender/:senderId/resend', async (req, res) => {
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
app.delete('/api/settings/sender/:senderId', async (req, res) => {
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
