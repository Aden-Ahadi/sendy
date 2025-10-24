const fs = require('fs');
const FormData = require('form-data');

async function run() {
  try {
    const form = new FormData();
    const filePath = 'data/emails.csv';
    if (!fs.existsSync(filePath)) {
      console.error('emails.csv not found at', filePath);
      process.exit(1);
    }

    form.append('recipientsFile', fs.createReadStream(filePath));
    form.append('subject', 'Full E2E Test');
    form.append('emailContent', '<p>Hello {{Name}}, this is an E2E test.</p>');
    form.append('senderName', 'Sendy Test');
    form.append('replyTo', 'reply@example.com');
    form.append('smtp.useDefault', 'true');

    const fetch = global.fetch || require('node-fetch');

    const res = await fetch('http://localhost:3000/api/campaigns/send', {
      method: 'POST',
      headers: form.getHeaders(),
      body: form
    });

    const text = await res.text();
    console.log('Status:', res.status);
    try {
      console.log('Response (JSON):', JSON.parse(text));
    } catch (e) {
      console.log('Response (text):', text);
    }
  } catch (err) {
    console.error('E2E error:', err.message);
    process.exit(1);
  }
}

run();
