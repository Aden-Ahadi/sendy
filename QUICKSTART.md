# 🚀 Quick Start Guide

Follow these simple steps to send your first bulk email campaign!

## Step 1: Configure Environment (2 minutes)

1. **Copy the example configuration:**

   ```bash
   copy .env.example .env
   ```

2. **Edit `.env` file** - Open it and update these values:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password-here
   SENDER_NAME=Your Name
   SENDER_EMAIL=your-email@gmail.com
   ```

## Step 2: Get Gmail App Password (3 minutes)

### For Gmail Users:

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Select **Mail** and **Other** (custom name)
5. Name it: "Bulk Email Sender"
6. Click **Generate**
7. **Copy the 16-character password** (remove spaces)
8. Paste it in `.env` as `SMTP_PASS`

### For Outlook/Hotmail:

1. Update `.env`:
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-password
   ```

## Step 3: Prepare Recipients (1 minute)

Edit `data/emails.csv` with your recipient list:

```csv
Name,Email
John Smith,john.smith@example.com
Sarah Johnson,sarah.johnson@gmail.com
```

**Tips:**

- Keep header row: `Name,Email`
- One recipient per line
- Valid email addresses only

## Step 4: Customize Email (Optional)

Edit `templates/email.html` to personalize your message:

- Change webinar details
- Update company name
- Modify call-to-action button
- Add your branding

Use `{{Name}}` to personalize!

## Step 5: Update Inline Image (Optional)

You can use either a **local image** from your PC or a **remote URL**.

### Option A: Use Local Image (Recommended for Easy Setup)

1. **Create an assets folder:**

   ```bash
   mkdir assets
   ```

2. **Copy your image** (e.g., poster.jpg, banner.png) to the `assets` folder

3. **Update `.env`** with the local path:

   ```env
   INLINE_IMAGE_URL=./assets/poster.jpg
   ```

   **Examples:**

   - `./assets/poster.jpg`
   - `./assets/webinar-banner.png`
   - `C:\Users\ahadi\email_service\assets\image.jpg` (absolute path)

### Option B: Use Remote URL

Upload your image online and use the URL:

```env
INLINE_IMAGE_URL=https://your-image-url.com/poster.jpg
```

**Free image hosting:**

- Imgur: https://imgur.com/
- Cloudinary: https://cloudinary.com/

## Step 6: Send Test Email

Before sending to everyone, test with 1-2 emails:

1. Create `data/test.csv`:

   ```csv
   Name,Email
   Your Name,your-email@gmail.com
   ```

2. Update `.env`:

   ```env
   CSV_FILE_PATH=./data/test.csv
   ```

3. Run:

   ```bash
   npm run send
   ```

4. Check your inbox!

## Step 7: Send Bulk Campaign

Once test looks good:

1. Update `.env` to use your main CSV:

   ```env
   CSV_FILE_PATH=./data/emails.csv
   ```

2. Run the sender:

   ```bash
   npm run send
   ```

3. Watch the progress bar! ⏳

4. Review the summary report 📊

## Step 8: Check Logs

After sending, check the detailed log:

```
logs/email-log.json
```

This shows:

- ✅ Successfully sent emails
- ❌ Failed emails (with error messages)
- ⏱️ Timestamps for each send
- 📧 Message IDs for tracking

## 🎉 You're Done!

Your emails are sent! Here's what to do next:

### Monitor Results

- Check delivery rates in your SMTP dashboard
- Monitor spam reports
- Track click-through rates (if using tracking links)

### Troubleshooting

**Emails not sending?**

- Verify SMTP credentials
- Check internet connection
- Review logs for errors

**Emails going to spam?**

- Send smaller batches first
- Warm up your domain
- Add unsubscribe link
- Avoid spammy words

### Pro Tips

1. **Start Small**: Test with 10-20 emails first
2. **Rate Limiting**: Keep `EMAIL_DELAY=2000` for Gmail
3. **Personalize**: Use recipient names in subject
4. **Mobile Test**: Check email on phone
5. **A/B Test**: Try different subjects with small groups
6. **Follow Laws**: Include unsubscribe link (CAN-SPAM)

### Daily Limits Reminder

- **Gmail Free**: 500 emails/day
- **Gmail Workspace**: 2000 emails/day
- **Outlook Free**: 300 emails/day
- **Office 365**: 10,000 emails/day

### Need Help?

Check `README.md` for:

- Detailed troubleshooting
- SMTP configuration guides
- Performance optimization
- Security best practices

---

**Happy Email Sending! 📧✨**
