import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.7';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipient {
  name: string;
  email: string;
}

// ── Brand config ──────────────────────────────────────────────────────────
// Set BRAND_LOGO_URL in Supabase edge function secrets to the absolute URL of
// your deployed logo, e.g. https://your-app.onrender.com/brand-logo.png
const BRAND_NAME   = Deno.env.get('BRAND_NAME')   ?? 'Huawei ICT Academy - DIT';
const BRAND_FOOTER = Deno.env.get('BRAND_FOOTER') ?? 'Huawei DIT ICT Academy &nbsp;&middot;&nbsp; P.O.Box 2958 Dar-es-salaam';

// ── Token replacement ─────────────────────────────────────────────────────

function processTemplate(html: string, name: string, email: string): string {
  const year = new Date().getFullYear().toString();
  return html
    .replaceAll('{{Name}}',  name)
    .replaceAll('{{Email}}', email)
    .replaceAll('{{Year}}',  year);
}

// ── Email-safe inline styles ──────────────────────────────────────────────
// Email clients strip <style> blocks, so we add inline styles to every tag
// that Tiptap can produce.

function applyEmailStyles(html: string): string {
  function style(tag: string, css: string, input: string): string {
    return input.replace(
      new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi'),
      (match: string, attrs: string = '') =>
        match.toLowerCase().includes('style=') ? match : `<${tag}${attrs} style="${css}">`
    );
  }

  let out = html;
  out = style('p',          'margin:0 0 16px;font-size:15px;line-height:1.7;color:#202020;',                                   out);
  out = style('h1',         'margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.2;color:#111111;letter-spacing:-0.5px;', out);
  out = style('h2',         'margin:0 0 14px;font-size:21px;font-weight:700;line-height:1.2;color:#111111;letter-spacing:-0.3px;', out);
  out = style('h3',         'margin:0 0 12px;font-size:17px;font-weight:600;line-height:1.3;color:#111111;',                       out);
  out = style('ul',         'margin:0 0 16px;padding-left:24px;',                                                                 out);
  out = style('ol',         'margin:0 0 16px;padding-left:24px;',                                                                 out);
  out = style('li',         'margin-bottom:6px;font-size:15px;line-height:1.7;color:#202020;',                                     out);
  out = style('a',          'color:#c7000a;text-decoration:underline;',                                                           out);
  out = style('strong',     'font-weight:700;',                                                                                   out);
  out = style('em',         'font-style:italic;',                                                                                 out);
  out = style('u',          'text-decoration:underline;',                                                                         out);
  out = style('blockquote', 'margin:0 0 16px;padding:0 0 0 16px;border-left:3px solid #e0ddd6;color:#646464;font-style:italic;',  out);
  out = style('hr',         'margin:24px 0;border:none;border-top:1px solid #eaeaea;',                                            out);
  out = style('code',       'background:#f3f0e8;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;',          out);
  return out;
}

// ── Shell wrappers ────────────────────────────────────────────────────────

function shellMinimal(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="background-color:#ffffff;border-radius:8px;padding:48px;font-size:15px;line-height:1.7;color:#202020;">
    ${body}
  </td></tr>
  <tr><td style="padding:24px 0;text-align:center;font-size:12px;color:#999999;line-height:1.8;">
    ${BRAND_FOOTER}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function shellBranded(body: string): string {
  const logoUrl = Deno.env.get('BRAND_LOGO_URL') ?? null;

  const headerContent = logoUrl
    ? `<img src="${logoUrl}" width="600" alt="${BRAND_NAME}" style="display:block;width:100%;height:auto;border:0;border-radius:8px 8px 0 0;">`
    : `<div style="padding:24px 32px;text-align:center;"><span style="font-size:17px;font-weight:700;color:#111111;letter-spacing:-0.3px;">${BRAND_NAME}</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  /* Dark mode — logo image carries its own background so no override needed there */
  u + .body .body-cell   { background-color: #1c1b19 !important; color: #edeae4 !important; }
  u + .body .footer-cell { background-color: #141412 !important; color: #8a8680 !important; }
  u + .body .outer-td    { background-color: #0f0e0c !important; }

  @media (prefers-color-scheme: dark) {
    .outer-td    { background-color: #0f0e0c !important; }
    .body-cell   { background-color: #1c1b19 !important; color: #edeae4 !important; }
    .footer-cell { background-color: #141412 !important; color: #8a8680 !important; border-top-color: #2a2825 !important; }
  }

  @media only screen and (max-width: 620px) {
    .outer-td    { padding: 0 !important; }
    .logo-cell   { padding: 20px 20px !important; border-radius: 0 !important; }
    .body-cell   { padding: 28px 20px !important; }
    .footer-cell { padding: 16px 20px !important; border-radius: 0 !important; }
  }
</style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#f5f4f0;-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
<tr><td class="outer-td" align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <!-- Logo header — full-width banner, image carries its own background -->
  <tr><td class="logo-cell" style="padding:0;line-height:0;font-size:0;border-bottom:1px solid #eaeaea;overflow:hidden;border-radius:8px 8px 0 0;">
    ${headerContent}
  </td></tr>
  <!-- Body -->
  <tr><td class="body-cell" bgcolor="#ffffff" style="background-color:#ffffff !important;padding:32px 32px;font-size:15px;line-height:1.75;color:#202020 !important;">
    ${body}
  </td></tr>
  <!-- Footer -->
  <tr><td class="footer-cell" bgcolor="#f9f8f5" style="background-color:#f9f8f5 !important;border-radius:0 0 8px 8px;padding:18px 32px;border-top:1px solid #eaeaea;text-align:center;font-size:12px;color:#999999;line-height:1.8;">
    ${BRAND_FOOTER}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function wrapInShell(emailContent: string, shell: string): string {
  const body = applyEmailStyles(emailContent);
  return shell === 'branded' ? shellBranded(body) : shellMinimal(body);
}

// ── Recipient parsing ─────────────────────────────────────────────────────

function parseCSV(text: string): Recipient[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV file is empty');

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const nameIdx  = headers.indexOf('name');
  const emailIdx = headers.indexOf('email');

  if (nameIdx === -1 || emailIdx === -1)
    throw new Error('CSV must have "Name" and "Email" columns');

  const recipients: Recipient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols  = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const name  = cols[nameIdx]  || '';
    const email = cols[emailIdx] || '';
    if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      recipients.push({ name, email });
  }

  if (recipients.length === 0) throw new Error('No valid recipients found in CSV');
  return recipients;
}

function parseExcel(buffer: ArrayBuffer): Recipient[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const recipients = rows
    .map((row) => ({
      name:  String(row['Name']  ?? row['name']  ?? ''),
      email: String(row['Email'] ?? row['email'] ?? ''),
    }))
    .filter((r) => r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email));

  if (recipients.length === 0) throw new Error('No valid recipients found in Excel file');
  return recipients;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Email sending loop ────────────────────────────────────────────────────

async function sendEmailsAsync(
  campaignId: string,
  recipients: Recipient[],
  emailTemplate: string,   // fully-wrapped, styled HTML — tokens replaced per recipient
  subject: string,
  transporter: nodemailer.Transporter,
  replyTo: string | null,
  supabase: SupabaseClient,
) {
  const delay       = parseInt(Deno.env.get('EMAIL_DELAY')         ?? '1000');
  const maxAttempts = parseInt(Deno.env.get('MAX_RETRY_ATTEMPTS')  ?? '3');
  const retryDelay  = parseInt(Deno.env.get('RETRY_DELAY')         ?? '3000');
  const senderName  = Deno.env.get('SENDER_NAME')  ?? BRAND_NAME;
  const senderEmail = Deno.env.get('SENDER_EMAIL') ?? Deno.env.get('SMTP_USER') ?? '';

  let successful = 0;
  let failed     = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    // Replace personalisation tokens in both the HTML and the subject
    const html             = processTemplate(emailTemplate, recipient.name, recipient.email);
    const processedSubject = processTemplate(subject,       recipient.name, recipient.email);
    const plainText        = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    let success   = false;
    let errorMsg  = '';
    let messageId = '';
    let attempt   = 1;

    for (attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const info = await transporter.sendMail({
          from:    `"${senderName}" <${senderEmail}>`,
          to:      recipient.email,
          subject: processedSubject,
          html,
          text:    plainText,
          ...(replyTo ? { replyTo } : {}),
          headers: {
            'X-Entity-Ref-ID': Math.random().toString(36).slice(2),
            'Precedence':       'bulk',
          },
        });
        success   = true;
        messageId = info.messageId ?? '';
        break;
      } catch (err) {
        errorMsg = (err as Error).message;
        if (attempt < maxAttempts) await sleep(retryDelay);
      }
    }

    if (success) successful++; else failed++;

    await supabase.from('campaign_logs').insert({
      campaign_id:     campaignId,
      recipient_name:  recipient.name,
      recipient_email: recipient.email,
      status:          success ? 'success' : 'failed',
      error:           errorMsg  || null,
      message_id:      messageId || null,
      attempt,
    });

    if (i % 10 === 9 || i === recipients.length - 1) {
      await supabase.from('campaigns').update({ successful, failed }).eq('campaign_id', campaignId);
    }

    if (i < recipients.length - 1) await sleep(delay);
  }

  await supabase.from('campaigns').update({
    successful,
    failed,
    status:       'completed',
    completed_at: new Date().toISOString(),
  }).eq('campaign_id', campaignId);
}

// ── Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const formData    = await req.formData();
    const subject     = formData.get('subject')       as string | null;
    const emailContent= formData.get('emailContent')  as string | null;
    const replyTo     = (formData.get('replyTo')      as string | null) || null;
    const templateShell = (formData.get('templateShell') as string | null) ?? 'minimal';
    const file        = formData.get('recipientsFile') as File | null;

    if (!file)         return json({ error: 'Recipients file required' }, 400);
    if (!subject)      return json({ error: 'Subject required' }, 400);
    if (!emailContent) return json({ error: 'Email content required' }, 400);

    const fileName = file.name.toLowerCase();
    let recipients: Recipient[];

    if (fileName.endsWith('.csv')) {
      recipients = parseCSV(await file.text());
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      recipients = parseExcel(await file.arrayBuffer());
    } else {
      return json({ error: 'Unsupported file type. Upload CSV or Excel.' }, 400);
    }

    // Wrap the body content in the selected shell once — tokens replaced per recipient later
    const emailTemplate = wrapInShell(emailContent, templateShell);

    const campaignId = `campaign_${Date.now()}`;

    await supabase.from('campaigns').insert({
      campaign_id:       campaignId,
      subject,
      total_recipients:  recipients.length,
      reply_to:          replyTo,
      template_shell:    templateShell,
      email_content:     emailContent,
      status:            'sending',
    });

    const transporter = nodemailer.createTransport({
      host:    Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port:    parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      secure:  Deno.env.get('SMTP_SECURE') === 'true',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
      connectionTimeout: 30000,
      greetingTimeout:   30000,
    });

    await transporter.verify();

    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(
      sendEmailsAsync(campaignId, recipients, emailTemplate, subject, transporter, replyTo, supabase)
        .catch(async (err) => {
          console.error('sendEmailsAsync fatal error:', err);
          await supabase.from('campaigns').update({ status: 'failed' }).eq('campaign_id', campaignId);
        })
    );

    return json({ success: true, campaignId, totalRecipients: recipients.length, status: 'sending' });

  } catch (err) {
    console.error('Handler error:', err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
