const os = require('os');
const fs = require('fs');
const formidable = require('formidable');
const { waitUntil } = require('@vercel/functions');

const { verifyToken } = require('../../src/api/middleware/auth');
const supabaseService = require('../../src/services/supabaseService');
const EmailService = require('../../src/services/emailService');
const FileParser = require('../../src/utils/fileParser');
const TemplateEngine = require('../../src/utils/templateEngine');

// Disable Vercel's default body parser — we handle multipart manually
module.exports.config = {
  api: { bodyParser: false },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  let uploadedFilePath = null;

  try {
    // Parse multipart form
    const form = new formidable.IncomingForm({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject;
    const emailContent = Array.isArray(fields.emailContent) ? fields.emailContent[0] : fields.emailContent;
    const replyTo = Array.isArray(fields.replyTo) ? fields.replyTo[0] : (fields.replyTo || null);
    const recipientsFile = Array.isArray(files.recipientsFile)
      ? files.recipientsFile[0]
      : files.recipientsFile;

    if (!recipientsFile) {
      return res.status(400).json({ error: 'Recipients file (CSV or Excel) required' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Email subject required' });
    }
    if (!emailContent) {
      return res.status(400).json({ error: 'Email content required' });
    }

    uploadedFilePath = recipientsFile.filepath || recipientsFile.path;
    const originalName = recipientsFile.originalFilename || recipientsFile.name || '';

    const recipients = await FileParser.parseRecipients(uploadedFilePath, originalName);

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipients found in file' });
    }

    const campaignId = `campaign_${Date.now()}`;

    await supabaseService.createCampaign(campaignId, subject, recipients.length, replyTo);

    const emailService = new EmailService();
    await emailService.verifyConnection();

    // waitUntil keeps this Vercel function alive until all emails are sent,
    // even after the HTTP response has been returned to the client.
    waitUntil(
      sendEmailsAsync(campaignId, recipients, emailContent, subject, emailService, replyTo)
        .finally(() => {
          try { if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath); } catch (_) {}
        })
    );

    res.json({
      success: true,
      campaignId,
      totalRecipients: recipients.length,
      status: 'sending',
    });

  } catch (error) {
    if (uploadedFilePath) {
      try { fs.unlinkSync(uploadedFilePath); } catch (_) {}
    }
    console.error('Campaign send error:', error);
    res.status(500).json({ error: 'Failed to start campaign', details: error.message });
  }
};

async function sendEmailsAsync(campaignId, recipients, template, subject, emailService, replyTo) {
  let successful = 0;
  let failed = 0;

  try {
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const htmlContent = TemplateEngine.processTemplate(template, recipient);
      const processedSubject = TemplateEngine.processSubject(subject, recipient);

      const result = await emailService.sendPersonalizedEmail(
        recipient, htmlContent, processedSubject, replyTo
      );

      if (result.success) successful++;
      else failed++;

      await supabaseService.logEmailResult(campaignId, result);

      if (i % 10 === 9 || i === recipients.length - 1) {
        await supabaseService.updateCampaignProgress(campaignId, successful, failed, 'sending');
      }

      if (i < recipients.length - 1) {
        await emailService.applyRateLimit();
      }
    }

    await supabaseService.updateCampaignProgress(campaignId, successful, failed, 'completed');
    console.log(`Campaign ${campaignId} done — sent: ${successful}, failed: ${failed}`);

  } catch (error) {
    console.error(`Campaign ${campaignId} error:`, error);
    await supabaseService.updateCampaignProgress(campaignId, successful, failed, 'failed');
  } finally {
    emailService.close();
  }
}
