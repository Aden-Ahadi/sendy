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

// ── Helpers ────────────────────────────────────────────────────────────────

function processTemplate(html: string, name: string, email: string): string {
  const year = new Date().getFullYear().toString();
  return html
    .replaceAll('{{Name}}', name)
    .replaceAll('{{Email}}', email)
    .replaceAll('{{Year}}', year);
}

function parseCSV(text: string): Recipient[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV file is empty');

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const nameIdx = headers.indexOf('name');
  const emailIdx = headers.indexOf('email');

  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error('CSV must have "Name" and "Email" columns');
  }

  const recipients: Recipient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const name = cols[nameIdx] || '';
    const email = cols[emailIdx] || '';
    if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      recipients.push({ name, email });
    }
  }

  if (recipients.length === 0) throw new Error('No valid recipients found in CSV');
  return recipients;
}

function parseExcel(buffer: ArrayBuffer): Recipient[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const recipients = rows
    .map((row) => ({
      name: String(row['Name'] ?? row['name'] ?? ''),
      email: String(row['Email'] ?? row['email'] ?? ''),
    }))
    .filter((r) => r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email));

  if (recipients.length === 0) throw new Error('No valid recipients found in Excel file');
  return recipients;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Email sending loop ─────────────────────────────────────────────────────

async function sendEmailsAsync(
  campaignId: string,
  recipients: Recipient[],
  template: string,
  subject: string,
  transporter: nodemailer.Transporter,
  replyTo: string | null,
  supabase: SupabaseClient,
) {
  const delay = parseInt(Deno.env.get('EMAIL_DELAY') ?? '1000');
  const maxAttempts = parseInt(Deno.env.get('MAX_RETRY_ATTEMPTS') ?? '3');
  const retryDelay = parseInt(Deno.env.get('RETRY_DELAY') ?? '3000');
  const senderName = Deno.env.get('SENDER_NAME') ?? 'Sendy';
  const senderEmail = Deno.env.get('SENDER_EMAIL') ?? Deno.env.get('SMTP_USER') ?? '';

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const html = processTemplate(template, recipient.name, recipient.email);
    const processedSubject = processTemplate(subject, recipient.name, recipient.email);
    const plainText = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    let success = false;
    let errorMsg = '';
    let messageId = '';
    let attempt = 1;

    for (attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: recipient.email,
          subject: processedSubject,
          html,
          text: plainText,
          ...(replyTo ? { replyTo } : {}),
          headers: {
            'X-Entity-Ref-ID': Math.random().toString(36).slice(2),
            'Precedence': 'bulk',
          },
        });
        success = true;
        messageId = info.messageId ?? '';
        break;
      } catch (err) {
        errorMsg = (err as Error).message;
        if (attempt < maxAttempts) await sleep(retryDelay);
      }
    }

    if (success) successful++; else failed++;

    await supabase.from('campaign_logs').insert({
      campaign_id: campaignId,
      recipient_name: recipient.name,
      recipient_email: recipient.email,
      status: success ? 'success' : 'failed',
      error: errorMsg || null,
      message_id: messageId || null,
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
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('campaign_id', campaignId);
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // Parse multipart form
    const formData = await req.formData();
    const subject = formData.get('subject') as string | null;
    const emailContent = formData.get('emailContent') as string | null;
    const replyTo = (formData.get('replyTo') as string | null) || null;
    const file = formData.get('recipientsFile') as File | null;

    if (!file) return json({ error: 'Recipients file required' }, 400);
    if (!subject) return json({ error: 'Subject required' }, 400);
    if (!emailContent) return json({ error: 'Email content required' }, 400);

    // Parse recipients
    const fileName = file.name.toLowerCase();
    let recipients: Recipient[];

    if (fileName.endsWith('.csv')) {
      recipients = parseCSV(await file.text());
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      recipients = parseExcel(await file.arrayBuffer());
    } else {
      return json({ error: 'Unsupported file type. Upload CSV or Excel.' }, 400);
    }

    const campaignId = `campaign_${Date.now()}`;

    // Create campaign record
    await supabase.from('campaigns').insert({
      campaign_id: campaignId,
      subject,
      total_recipients: recipients.length,
      reply_to: replyTo,
      status: 'sending',
    });

    // Verify SMTP connection
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      secure: Deno.env.get('SMTP_SECURE') === 'true',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
    });

    await transporter.verify();

    // Run email sending in the background — keeps the function alive after response
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(
      sendEmailsAsync(campaignId, recipients, emailContent, subject, transporter, replyTo, supabase)
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
