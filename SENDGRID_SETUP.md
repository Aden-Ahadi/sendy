# 🚀 SendGrid Setup Guide (5 Minutes)

## Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Click **"Start for Free"**
3. Sign up with your email
4. Verify your email address

**Free Tier Includes:**

- ✅ 100 emails per day forever
- ✅ Perfect for testing
- ✅ No credit card required

---

## Step 2: Get Your API Key

1. Log in to SendGrid
2. Go to **Settings** (left sidebar) → **API Keys**
3. Click **"Create API Key"**
4. Name it: `Sendy App`
5. Choose: **"Full Access"**
6. Click **"Create & View"**
7. **COPY THE KEY NOW** (you won't see it again!)

Your key looks like: `SG.xxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyy`

---

## Step 3: Add API Key to .env

Open your `.env` file and replace:

```env
SENDGRID_API_KEY=your-sendgrid-api-key-here
```

With your actual key:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyy
```

---

## Step 4: Verify Your Sender Email

**IMPORTANT:** SendGrid won't let you send emails until you verify your sender email.

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in your details:
   - From Name: `HUAWEI DIT ICT ACADEMY`
   - From Email: `adenahadi@gmail.com`
   - Reply To: `adenahadi@gmail.com`
   - Company Address: Your address
4. Click **"Create"**
5. **Check your email** (adenahadi@gmail.com) for verification link
6. Click the verification link
7. ✅ Done! You can now send emails

---

## Step 5: Test It!

Run your email sender:

```bash
npm run send
```

Or test the API:

```bash
node src/api/server.js
```

---

## 🎉 You're Done!

Your emails will now be sent through SendGrid instead of Gmail SMTP.

**Benefits:**

- ✅ No app passwords needed
- ✅ Better deliverability
- ✅ Built-in analytics
- ✅ Scalable (100 emails/day free, unlimited with paid plans)
- ✅ Professional sending infrastructure

---

## 📊 Upgrade When Ready

When you outgrow the free tier:

- **Essentials Plan:** $15/mo = 40,000 emails/month
- **Pro Plan:** $90/mo = 100,000 emails/month

Perfect for your SaaS pricing:

- You charge users $29/mo (5K emails)
- SendGrid costs you $15/mo (40K emails)
- You can serve 8 Pro users before needing to upgrade SendGrid

---

## 🆘 Troubleshooting

**Error: "The from address does not match a verified Sender Identity"**
→ You forgot Step 4. Verify your sender email.

**Error: "API key not found"**
→ Check your `.env` file has `SENDGRID_API_KEY=SG.xxx...`

**Emails not arriving?**
→ Check your spam folder. First few sends might land there.

---

## 🔥 Next: Build the Frontend!

Now that SendGrid is working, you're ready to build the SaaS frontend.

Say: **"Let's build the frontend"** when ready! 🚀
