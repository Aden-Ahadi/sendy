# Email Deliverability Guide - Avoiding Promotions Tab

## The Problem

Gmail automatically categorizes emails into Primary, Social, and Promotions tabs based on:

- Sender reputation
- Email content
- Engagement history
- Authentication (SPF, DKIM, DMARC)

## Current Setup Issues

### Using Gmail SMTP (`mysendyapp@gmail.com`)

**Limitations:**

- No custom domain
- Limited SPF/DKIM control
- Gmail marks bulk emails from Gmail accounts as promotional
- 500 emails/day limit

## SOLUTION: Switch to Professional Email Service

### Option 1: SendGrid (RECOMMENDED)

**Why SendGrid:**

- ✅ Custom domain support
- ✅ Full SPF/DKIM/DMARC control
- ✅ Sender reputation management
- ✅ 100 emails/day FREE (up to 40,000 in first 30 days)
- ✅ Dedicated IP address (paid plans)
- ✅ Built-in deliverability tools

**Setup Steps:**

1. Get a custom domain: `yourdomain.com` or `sendyapp.com`
2. Verify domain in SendGrid
3. Add DNS records (SPF, DKIM, DMARC)
4. Send from: `noreply@yourdomain.com` or `team@yourdomain.com`

**DNS Records to Add:**

```
SPF:   TXT   @   v=spf1 include:sendgrid.net ~all
DKIM:  CNAME s1._domainkey   s1.domainkey.u1234567.wl.sendgrid.net
DKIM:  CNAME s2._domainkey   s2.domainkey.u1234567.wl.sendgrid.net
DMARC: TXT   _dmarc   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### Option 2: Amazon SES

- Very cheap (€0.10 per 1000 emails)
- Requires AWS account
- More technical setup

### Option 3: Mailgun

- 5,000 emails/month FREE
- Good for developers
- Similar to SendGrid

## Content Improvements (Works with ANY provider)

### Email Content Best Practices

**Subject Lines:**

- ❌ Avoid: "FREE", "URGENT!!!", "CLICK NOW", "LIMITED TIME"
- ✅ Use: Personal, specific subjects like "Your Webinar Access Link"
- ✅ Personalize: "Hi {{name}}, your invitation is ready"

**Email Body:**

- ✅ More text, fewer images (60% text, 40% images)
- ✅ Personalize content with recipient name
- ✅ Avoid promotional language
- ✅ Write like a person, not a marketing robot
- ❌ Don't use image-only emails
- ✅ Include plain text version (already implemented)

**Technical:**

- ✅ Include unsubscribe link
- ✅ Use recipient's name in greeting
- ✅ Keep email under 100KB
- ✅ Test spam score before sending (use mail-tester.com)

## Quick Wins (Current Setup)

### 1. Improve Email Templates

Make them look less promotional:

- Use simple, clean design
- More conversational tone
- Less "marketing speak"
- Include recipient name

### 2. Warm Up Sender

- Start with 10-20 emails/day
- Increase by 20% every few days
- Reach full volume in 2-3 weeks

### 3. Engagement

- Ask recipients to reply
- Request they add you to contacts
- Provide value in every email

### 4. Avoid Spam Triggers

**Words to avoid:**

- Free, Act now, Limited time, Urgent
- $$$ or multiple exclamation marks!!!
- ALL CAPS SUBJECTS

**HTML to avoid:**

- Excessive colors
- Too many links
- Hidden text (white on white)
- Broken HTML

## Migration Plan: Gmail SMTP → SendGrid

### Step 1: Get SendGrid Account

1. Sign up at sendgrid.com
2. Verify email
3. Get API key

### Step 2: Get Custom Domain

Options:

- Namecheap: ~$10/year
- Google Domains: ~$12/year
- Cloudflare: ~$10/year

### Step 3: Domain Verification

1. Add domain to SendGrid
2. Copy DNS records
3. Add to your domain registrar
4. Wait 24-48 hours for verification

### Step 4: Update Code

Already done! Just switch .env:

```bash
# Comment out Gmail SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=mysendyapp@gmail.com

# Uncomment SendGrid
SENDGRID_API_KEY=your-actual-key-here
SENDER_EMAIL=noreply@yourdomain.com
```

### Step 5: Test

Send test campaigns to multiple providers:

- Gmail
- Outlook
- Yahoo
- ProtonMail

Check which tab they land in.

## Testing Tools

### Mail-Tester.com

- Send email to test@mail-tester.com
- Get spam score (aim for 10/10)
- See what's hurting your deliverability

### GlockApps

- Test across multiple email providers
- See inbox placement rates
- Identify authentication issues

## Expected Results

### With Gmail SMTP (Current)

- Primary inbox: 20-30%
- Promotions: 60-70%
- Spam: 5-10%

### With SendGrid + Custom Domain + Good Content

- Primary inbox: 70-90%
- Promotions: 10-20%
- Spam: <1%

## Immediate Action Items

**Today:**

1. ✅ Improve email content (less promotional)
2. ✅ Add personalization
3. ✅ Keep design simple

**This Week:**

1. Get a custom domain ($10)
2. Set up SendGrid account (FREE)
3. Verify domain
4. Add DNS records

**This Month:**

1. Migrate to SendGrid
2. Warm up new sender
3. Monitor deliverability
4. Adjust content based on results

## The Bottom Line

**Using Gmail SMTP will ALWAYS have promotions tab issues** because:

- You're sending bulk emails from a personal Gmail account
- Gmail knows this and categorizes accordingly
- No amount of header tweaking will fix this

**The ONLY real solution:**

- Get a custom domain
- Use professional email service (SendGrid/SES/Mailgun)
- Proper authentication (SPF/DKIM/DMARC)
- Good email content

This is standard practice for ALL email marketing/transactional services.
