# 📧 Sendy

**Send smarter, not harder.**

A professional, production-ready Node.js application for sending personalized bulk emails with inline images, comprehensive logging, retry logic, and rate limiting.

![Node.js](https://img.shields.io/badge/node.js-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

---

## ✨ Features

- ✅ **Personalized Emails** - Use `{{Name}}` placeholders in subject and body
- ✅ **Individual Sending** - Each email sent separately (no CC/BCC)
- ✅ **Inline Images** - Support for embedded images (not attachments)
- ✅ **Comprehensive Logging** - JSON logs with timestamps, status, and errors
- ✅ **Retry Logic** - Automatic retry on failure (configurable attempts)
- ✅ **Rate Limiting** - Configurable delay between emails to avoid throttling
- ✅ **Progress Tracking** - Real-time progress bar in terminal
- ✅ **CSV Support** - Load recipients from CSV files
- ✅ **SMTP Verification** - Pre-flight connection check
- ✅ **Error Handling** - Graceful error handling with detailed reporting
- ✅ **Modular Code** - Clean, well-organized, and commented codebase

## 📋 Requirements

- Node.js 14.x or higher
- SMTP server access (Gmail, Outlook, etc.)
- CSV file with recipient data

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download this repository
cd email_service

# Install dependencies
npm install
```

### 2. Configuration

Create a `.env` file by copying the example:

```bash
copy .env.example .env
```

Edit the `.env` file with your SMTP credentials and preferences:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Your Credentials
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Sender Info
SENDER_NAME=Your Name
SENDER_EMAIL=your-email@gmail.com

# Email Subject (supports {{Name}} placeholder)
EMAIL_SUBJECT=Exclusive Invitation: Join Our Webinar, {{Name}}!

# CSV File Path
CSV_FILE_PATH=./data/emails.csv

# Rate Limiting (milliseconds)
EMAIL_DELAY=2000

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY=5000

# Logging
LOG_FILE_PATH=./logs/email-log.json

# Inline Image URL
INLINE_IMAGE_URL=https://example.com/webinar-poster.jpg
```

### 3. Prepare Your Recipients CSV

Create or edit `data/emails.csv` with your recipients:

```csv
Name,Email
John Smith,john.smith@example.com
Sarah Johnson,sarah.johnson@gmail.com
Michael Brown,michael.brown@outlook.com
```

**CSV Format Requirements:**

- Must have `Name` and `Email` columns (case-insensitive)
- Valid email addresses only
- No empty rows

### 4. Customize Email Template

Edit `templates/email.html` to customize your email design. Use these placeholders:

- `{{Name}}` - Recipient's name
- `{{Email}}` - Recipient's email
- `{{Year}}` - Current year

The template includes a professional design with:

- Responsive layout
- Inline CSS (email-safe)
- Inline image support via `cid:inline-image`
- Call-to-action button
- Footer with social links

### 5. Run the Sender

```bash
npm run send
```

The script will:

1. Validate your configuration
2. Verify SMTP connection
3. Load and validate recipients
4. Show a 5-second confirmation delay
5. Send personalized emails with progress tracking
6. Display a comprehensive summary

## 🔐 SMTP Configuration

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:

   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other" (name it: Bulk Email Sender)
   - Copy the 16-character password

3. **Update .env**:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Outlook/Office365 Setup

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail Setup

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

**Note:** Yahoo also requires app passwords. Generate at: [Yahoo Account Security](https://login.yahoo.com/account/security)

## 📊 Logging

All email sends are logged to `logs/email-log.json` with:

```json
{
  "timestamp": "2025-10-21T10:30:45.123Z",
  "recipient": {
    "name": "John Smith",
    "email": "john.smith@example.com"
  },
  "status": "success",
  "attempt": 1,
  "messageId": "<abc123@smtp.gmail.com>",
  "error": null,
  "response": "250 2.0.0 OK"
}
```

## 🖼️ Inline Images

### Using Remote URLs (Recommended)

Upload your image to a public hosting service and use the URL:

```env
INLINE_IMAGE_URL=https://your-cdn.com/images/webinar-poster.jpg
```

**Recommended hosting:**

- Imgur
- Cloudinary
- AWS S3
- Google Drive (public link)

### Using Local Files

Place your image in the project and reference it:

```env
INLINE_IMAGE_URL=./assets/webinar-poster.jpg
```

The image is automatically embedded with `cid:inline-image` reference in the HTML template.

## 📁 Project Structure

```
email_service/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration management
│   ├── services/
│   │   └── emailService.js    # Email sending logic
│   ├── utils/
│   │   ├── csvParser.js       # CSV parsing and validation
│   │   ├── logger.js          # Logging functionality
│   │   └── templateEngine.js  # Template processing
│   └── index.js               # Main entry point
├── templates/
│   └── email.html             # HTML email template
├── data/
│   └── emails.csv             # Recipient data
├── logs/
│   └── email-log.json         # Execution logs (auto-generated)
├── .env                       # Your configuration (not in git)
├── .env.example               # Configuration template
├── .gitignore
├── package.json
└── README.md
```

## 🎯 Usage Examples

### Basic Usage

```bash
npm run send
```

### Send to Different CSV File

Update `.env`:

```env
CSV_FILE_PATH=./data/vip-customers.csv
```

### Change Rate Limiting

For faster sending (if your SMTP allows):

```env
EMAIL_DELAY=1000  # 1 second between emails
```

For safer sending with stricter limits:

```env
EMAIL_DELAY=5000  # 5 seconds between emails
```

### Adjust Retry Logic

```env
MAX_RETRY_ATTEMPTS=5    # More retry attempts
RETRY_DELAY=10000       # Wait 10 seconds between retries
```

## 🔧 Troubleshooting

### "SMTP connection failed"

**Solutions:**

- Verify SMTP credentials in `.env`
- Ensure 2FA and App Password are set up (Gmail)
- Check if your firewall/antivirus blocks port 587
- Try port 465 with `SMTP_SECURE=true`

### "Invalid email format" warnings

**Solutions:**

- Check CSV file for malformed emails
- Ensure no empty rows in CSV
- Verify column names are exactly `Name` and `Email`

### "Rate limit exceeded" or throttling

**Solutions:**

- Increase `EMAIL_DELAY` to 3000-5000ms
- Reduce `MAX_RETRY_ATTEMPTS`
- Split large recipient lists into batches
- Use a dedicated SMTP service (SendGrid, Mailgun)

### Emails going to spam

**Solutions:**

- Use a verified sender domain
- Add SPF, DKIM, and DMARC records
- Avoid spam trigger words
- Test with small batches first
- Warm up your sending domain gradually

## 📈 Performance & Limits

### Gmail Limits

- **Free Account**: 500 emails/day
- **Workspace Account**: 2000 emails/day
- **Recommended delay**: 2-3 seconds

### Outlook Limits

- **Free Account**: 300 emails/day
- **Office 365**: 10,000 emails/day
- **Recommended delay**: 2 seconds

### Best Practices

- Start with small batches (50-100 emails)
- Monitor delivery rates
- Respect rate limits
- Use authenticated SMTP
- Maintain list hygiene

## 🛡️ Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use App Passwords** - Don't use your main account password
3. **Enable 2FA** - On your email account
4. **Rotate passwords** - Regularly update app passwords
5. **Limit permissions** - Use least-privilege access
6. **Monitor logs** - Check for suspicious activity

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

## 🙏 Acknowledgments

Built with:

- [Nodemailer](https://nodemailer.com/) - Email sending
- [csv-parser](https://www.npmjs.com/package/csv-parser) - CSV parsing
- [cli-progress](https://www.npmjs.com/package/cli-progress) - Progress bars
- [colors](https://www.npmjs.com/package/colors) - Terminal colors
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment configuration

## 💡 Tips for Success

1. **Test First**: Send to yourself or a test group first
2. **Personalize**: Use recipient names in subject and body
3. **Mobile-Friendly**: Template is responsive, but test on mobile
4. **Clear CTA**: Make your call-to-action obvious
5. **Monitor**: Check logs regularly for errors
6. **Comply**: Follow CAN-SPAM Act and GDPR guidelines
7. **Unsubscribe**: Always include an unsubscribe link

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review the logs in `logs/email-log.json`
3. Verify your `.env` configuration
4. Test SMTP credentials manually

---

**Sendy - Send smarter, not harder.**

Made with ❤️ by developers, for developers.

Happy Emailing! 🚀
