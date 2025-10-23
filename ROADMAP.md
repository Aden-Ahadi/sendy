# 🚀 Sendy SaaS Development Roadmap

## Current Status

✅ **Phase 0: CLI Version Complete** (October 2025)

- Working bulk email sender
- CSV parsing
- Template engine
- Retry logic
- Rate limiting
- Logging system

---

## 🎯 Phase 1: Backend API (Week 1-2)

**Goal:** Convert CLI to API service

### Tasks:

- [ ] Create Express.js wrapper around existing code
- [ ] Add API endpoints:
  - `POST /api/campaigns/send` - Trigger email send
  - `GET /api/campaigns/:id` - Get campaign status
  - `GET /api/campaigns/:id/logs` - Get send logs
- [ ] Add authentication (JWT tokens)
- [ ] Deploy to Railway.app
- [ ] Test with Postman

**Files to Create:**

- `src/api/server.js` - Express server
- `src/api/routes/campaigns.js` - Campaign routes
- `src/api/middleware/auth.js` - Auth middleware
- `Dockerfile` - For deployment

**Estimated Time:** 5-7 days

---

## 🎯 Phase 2: Frontend Setup (Week 3)

**Goal:** Basic Next.js app with authentication

### Tasks:

- [ ] Create Next.js project
- [ ] Setup Supabase (database + auth)
- [ ] Build authentication pages:
  - Login
  - Signup
  - Password reset
- [ ] Create dashboard layout
- [ ] Deploy to Vercel

**Tech Stack:**

- Next.js 14 (App Router)
- Supabase (Auth + Database)
- Tailwind CSS
- shadcn/ui components

**Estimated Time:** 7 days

---

## 🎯 Phase 3: Core Features (Week 4-5)

**Goal:** MVP - Users can send campaigns

### Tasks:

- [ ] Dashboard page (list campaigns)
- [ ] Create campaign page:
  - CSV upload
  - Subject line input
  - Template selector (3 pre-made)
  - Preview modal
  - Send button
- [ ] Campaign detail page (view results)
- [ ] Connect frontend to backend API
- [ ] Test end-to-end flow

**Estimated Time:** 10-14 days

---

## 🎯 Phase 4: Payments (Week 6)

**Goal:** Monetization ready

### Tasks:

- [ ] Setup Stripe account
- [ ] Create subscription product ($29/mo)
- [ ] Integrate Stripe Checkout
- [ ] Add usage tracking (email credits)
- [ ] Free tier limits (100 emails/month)
- [ ] Upgrade flow

**Estimated Time:** 5-7 days

---

## 🎯 Phase 5: Polish & Launch (Week 7-8)

**Goal:** Public launch

### Tasks:

- [ ] Create landing page
- [ ] Write documentation
- [ ] Beta test with 10 users
- [ ] Fix critical bugs
- [ ] Setup analytics (Plausible/Umami)
- [ ] Launch on Product Hunt
- [ ] Social media announcement

**Estimated Time:** 7-10 days

---

## 📊 Database Schema (Supabase)

```sql
-- Users table (managed by Supabase Auth)
-- Just need to extend with:
ALTER TABLE auth.users ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE auth.users ADD COLUMN credits INTEGER DEFAULT 100;

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sending, completed, failed
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign logs table
CREATE TABLE campaign_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL, -- success, failed
  error TEXT,
  attempt INTEGER DEFAULT 1,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 Pricing Strategy

### Free Tier

- 100 emails/month
- 3 templates
- Community support
- Campaign history (30 days)

### Pro Tier - $29/month

- 5,000 emails/month
- All templates
- Priority support
- Campaign history (unlimited)
- CSV export of results

### Future Tiers (Post-Launch)

- Business: $99/mo - 25K emails
- Enterprise: Custom pricing

---

## 🔧 Tech Stack Summary

### Backend (Current CLI + API)

- Node.js
- Express.js
- Your existing email logic
- Railway.app (hosting)

### Frontend (New)

- Next.js 14
- Supabase (Auth + DB)
- Tailwind CSS
- shadcn/ui
- Vercel (hosting)

### Services

- Stripe (payments)
- Supabase (database + auth)
- Railway (backend API)
- Vercel (frontend)

**Total Monthly Cost:** $5-20

---

## 📈 Success Metrics

### Month 1 (Launch)

- 50 signups
- 10 paying users
- $290 MRR

### Month 3

- 200 signups
- 40 paying users
- $1,160 MRR

### Month 6

- 500 signups
- 100 paying users
- $2,900 MRR

### Month 12

- 2,000 signups
- 300 paying users
- $8,700 MRR

---

## ✅ Immediate Next Steps (This Week)

### Today:

1. ✅ Read this roadmap
2. [ ] Create Supabase account
3. [ ] Create Vercel account
4. [ ] Create Railway account
5. [ ] Create Stripe account

### Tomorrow:

6. [ ] Start Phase 1: Backend API
7. [ ] Create Express server wrapper
8. [ ] Test API endpoints locally

### This Weekend:

9. [ ] Deploy backend to Railway
10. [ ] Start Phase 2: Frontend setup

---

## 📚 Resources You'll Need

### Learning:

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

### Tools:

- VS Code (you have this)
- Postman (API testing)
- Supabase Dashboard
- Vercel Dashboard
- Railway Dashboard

### Communities:

- r/SaaS (Reddit)
- Indie Hackers
- Product Hunt

---

## 🎯 Current Focus

**YOU ARE HERE:** ⬇️

✅ Phase 0: CLI Complete
🔄 Phase 1: Backend API ← **START HERE**
⏳ Phase 2: Frontend Setup
⏳ Phase 3: Core Features
⏳ Phase 4: Payments
⏳ Phase 5: Launch

---

**Last Updated:** October 23, 2025
**Target Launch Date:** December 15, 2025 (8 weeks)
