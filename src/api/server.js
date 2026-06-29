const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const net = require('net');

const { config } = require('../config/config');
const EmailService = require('../services/emailService');
const supabaseService = require('../services/supabaseService');
const FileParser = require('../utils/fileParser');
const TemplateEngine = require('../utils/templateEngine');
const { requireAuth } = require('./middleware/auth');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Allow requests from the Vercel frontend (set ALLOWED_ORIGIN in env)
// Falls back to allowing all origins if not set (fine for Render internal traffic)
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? {
  origin: allowedOrigin,
  credentials: true,
} : {}));

app.use(express.json());

// ──────────────────────────────────────────────────
// Public routes
// ──────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Sendy API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/debug/tcp-check', async (req, res) => {
  const host = process.env.SMTP_HOST || config.smtp.host || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || config.smtp.port || 587);
  const timeoutMs = Number(process.env.EMAIL_TCP_CHECK_TIMEOUT) || 8000;
  const socket = new net.Socket();
  let done = false;
  const clean = (ok, msg) => {
    if (done) return;
    done = true;
    try { socket.destroy(); } catch (_) {}
    res.json({ host, port, ok, msg });
  };
  socket.setTimeout(timeoutMs);
  socket.on('connect', () => clean(true, 'connected'));
  socket.on('timeout', () => clean(false, 'timeout'));
  socket.on('error', (err) => clean(false, String(err)));
  try { socket.connect(port, host); } catch (err) { clean(false, String(err)); }
});

// ──────────────────────────────────────────────────
// Protected campaign routes
// ──────────────────────────────────────────────────

// List all campaigns
app.get('/api/campaigns', requireAuth, async (req, res) => {
  try {
    const campaigns = await supabaseService.getCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Failed to list campaigns', details: error.message });
  }
});

// Create & start a campaign
app.post('/api/campaigns/send', requireAuth, upload.single('recipientsFile'), async (req, res) => {
  let uploadedFilePath = null;
  try {
    const { subject, replyTo, emailContent } = req.body;
    const recipientsFile = req.file;
    uploadedFilePath = recipientsFile?.path || null;

    if (!recipientsFile) {
      return res.status(400).json({ error: 'Recipients file (CSV or Excel) required' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Email subject required' });
    }
    if (!emailContent) {
      return res.status(400).json({ error: 'Email content required' });
    }

    const recipients = await FileParser.parseRecipients(
      recipientsFile.path,
      recipientsFile.originalname
    );

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipients found in file' });
    }

    const campaignId = `campaign_${Date.now()}`;

    // Persist campaign record
    await supabaseService.createCampaign(
      campaignId,
      subject,
      recipients.length,
      replyTo || null
    );

    // Verify SMTP before background send
    const emailService = new EmailService();
    await emailService.verifyConnection();

    // Fire-and-forget background send
    sendEmailsAsync(campaignId, recipients, emailContent, subject, emailService, replyTo || null);

    // Clean up upload
    try { if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath); } catch (_) {}
    uploadedFilePath = null;

    res.json({
      success: true,
      campaignId,
      totalRecipients: recipients.length,
      status: 'sending',
    });

  } catch (error) {
    console.error('Campaign creation error:', error);
    if (uploadedFilePath) {
      try { fs.unlinkSync(uploadedFilePath); } catch (_) {}
    }
    res.status(500).json({ error: 'Failed to create campaign', details: error.message });
  }
});

// Get campaign status/summary
app.get('/api/campaigns/:campaignId', requireAuth, async (req, res) => {
  try {
    const campaign = await supabaseService.getCampaignById(req.params.campaignId);
    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// Get campaign logs
app.get('/api/campaigns/:campaignId/logs', requireAuth, async (req, res) => {
  try {
    const [campaign, logs] = await Promise.all([
      supabaseService.getCampaignById(req.params.campaignId),
      supabaseService.getCampaignLogs(req.params.campaignId),
    ]);
    res.json({ campaign, logs });
  } catch (error) {
    console.error('Get campaign logs error:', error);
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// ──────────────────────────────────────────────────
// Background email sending
// ──────────────────────────────────────────────────

async function sendEmailsAsync(campaignId, recipients, template, subject, emailService, replyTo) {
  let successful = 0;
  let failed = 0;

  try {
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const htmlContent = TemplateEngine.processTemplate(template, recipient);
      const processedSubject = TemplateEngine.processSubject(subject, recipient);

      const result = await emailService.sendPersonalizedEmail(
        recipient,
        htmlContent,
        processedSubject,
        replyTo
      );

      if (result.success) successful++;
      else failed++;

      await supabaseService.logEmailResult(campaignId, result);

      // Update DB every 10 emails and on the last one
      if (i % 10 === 9 || i === recipients.length - 1) {
        await supabaseService.updateCampaignProgress(campaignId, successful, failed, 'sending');
      }

      if (i < recipients.length - 1) {
        await emailService.applyRateLimit();
      }
    }

    await supabaseService.updateCampaignProgress(campaignId, successful, failed, 'completed');
    console.log(`Campaign ${campaignId} completed — sent: ${successful}, failed: ${failed}`);

  } catch (error) {
    console.error(`Campaign ${campaignId} fatal error:`, error);
    await supabaseService.updateCampaignProgress(campaignId, successful, failed, 'failed');
  } finally {
    emailService.close();
  }
}

// ──────────────────────────────────────────────────
// Serve React frontend (production)
// ──────────────────────────────────────────────────

const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// ──────────────────────────────────────────────────
// Error handler
// ──────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   📧 Sendy API Server v2              ║
║   Send smarter, not harder            ║
╚═══════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ Health check: http://localhost:${PORT}/health
✓ Frontend:     http://localhost:${PORT}
  `);
});

module.exports = app;
