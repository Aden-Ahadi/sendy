# ✅ Configuration Checklist

Use this checklist to ensure everything is set up correctly before sending emails.

## Pre-Send Checklist

### 1. Environment Configuration

- [ ] Created `.env` file from `.env.example`
- [ ] Updated `SMTP_USER` with your email address
- [ ] Updated `SMTP_PASS` with app password (NOT regular password)
- [ ] Updated `SENDER_NAME` with your name/company
- [ ] Updated `SENDER_EMAIL` with your email
- [ ] Set `EMAIL_SUBJECT` with desired subject line
- [ ] Configured `INLINE_IMAGE_URL` (if using images)

### 2. SMTP Setup (Gmail)

- [ ] Enabled 2-Factor Authentication on Google Account
- [ ] Generated App Password from Google Account Security
- [ ] Copied 16-character app password to `.env`
- [ ] Verified SMTP settings:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Secure: `false`

### 3. Recipients CSV

- [ ] Created/updated `data/emails.csv`
- [ ] CSV has `Name` and `Email` columns
- [ ] No empty rows in CSV
- [ ] All email addresses are valid
- [ ] Tested with small CSV first (5-10 recipients)

### 4. Email Template

- [ ] Reviewed `templates/email.html`
- [ ] Customized message content
- [ ] Updated webinar/event details
- [ ] Changed company name and links
- [ ] Added unsubscribe link
- [ ] Verified `{{Name}}` placeholders are present
- [ ] Checked inline image reference: `cid:inline-image`

### 5. Rate Limiting & Retry

- [ ] Set `EMAIL_DELAY` appropriately:
  - Gmail: 2000ms (recommended)
  - Outlook: 2000ms (recommended)
  - Custom SMTP: Check provider limits
- [ ] Configured `MAX_RETRY_ATTEMPTS` (default: 3)
- [ ] Configured `RETRY_DELAY` (default: 5000ms)

### 6. Testing

- [ ] Created test CSV with 1-2 emails
- [ ] Sent test email to yourself
- [ ] Verified email appearance:
  - [ ] Correct personalization
  - [ ] Inline image displays
  - [ ] Links work
  - [ ] Mobile-friendly
  - [ ] Not in spam folder
- [ ] Checked logs for successful send

### 7. Production Readiness

- [ ] Dependencies installed (`npm install`)
- [ ] No errors in test run
- [ ] Internet connection stable
- [ ] SMTP connection verified
- [ ] CSV file path correct in `.env`
- [ ] Recipient count is within daily limits:
  - Gmail: Max 500/day (free) or 2000/day (Workspace)
  - Outlook: Max 300/day (free) or 10000/day (Office 365)

### 8. Legal & Compliance

- [ ] Have permission to email recipients
- [ ] Included unsubscribe link in template
- [ ] Added physical mailing address (CAN-SPAM requirement)
- [ ] Email content is truthful and not misleading
- [ ] Subject line accurately reflects content
- [ ] GDPR compliant (if applicable)

### 9. Logging & Monitoring

- [ ] Logs directory exists or will be auto-created
- [ ] Disk space available for logs
- [ ] Know how to check `logs/email-log.json`
- [ ] Understand log format and error messages

### 10. Emergency Preparedness

- [ ] Know how to stop the process (Ctrl+C)
- [ ] Have backup of recipient list
- [ ] Can handle failed emails
- [ ] Have support contact for SMTP issues

## Post-Send Checklist

### Immediate Actions (0-24 hours)

- [ ] Reviewed summary report
- [ ] Checked `logs/email-log.json` for errors
- [ ] Identified failed emails
- [ ] Monitored inbox for bounces/complaints
- [ ] Verified deliverability with test emails

### Follow-Up (24-48 hours)

- [ ] Tracked open rates (if using tracking)
- [ ] Monitored spam reports
- [ ] Processed unsubscribe requests
- [ ] Followed up on failed sends
- [ ] Documented any issues

### Optimization

- [ ] Analyzed log statistics
- [ ] Identified problem email domains
- [ ] Adjusted rate limiting if needed
- [ ] Improved template based on feedback
- [ ] Updated recipient list (remove bounces)

## Troubleshooting Quick Reference

### Common Issues

**Authentication Failed:**

- [ ] Using App Password (not regular password)
- [ ] 2FA enabled on account
- [ ] Credentials copied correctly (no spaces)

**Connection Timeout:**

- [ ] Check internet connection
- [ ] Verify SMTP host and port
- [ ] Firewall not blocking port 587

**Rate Limit Exceeded:**

- [ ] Increase `EMAIL_DELAY` to 3000-5000ms
- [ ] Reduce batch size
- [ ] Check daily sending limits

**Emails in Spam:**

- [ ] Add SPF/DKIM/DMARC records
- [ ] Remove spam trigger words
- [ ] Use verified sender domain
- [ ] Send smaller initial batches

**Template Not Personalizing:**

- [ ] Check `{{Name}}` placeholder syntax
- [ ] Verify CSV has Name column
- [ ] Ensure no typos in placeholder names

**Image Not Displaying:**

- [ ] Verify `INLINE_IMAGE_URL` in `.env`
- [ ] Check image URL is accessible
- [ ] Confirm `cid:inline-image` in template
- [ ] Test with public image hosting

## Support Resources

### Documentation

- `README.md` - Full documentation
- `QUICKSTART.md` - Quick setup guide
- `.env.example` - Configuration template

### External Resources

- Nodemailer Docs: https://nodemailer.com/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- CAN-SPAM Act: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

---

**Ready to send?** Run: `npm run send` 🚀

**Questions?** Review the README.md for detailed guidance.
