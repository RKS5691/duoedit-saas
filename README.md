# DuoEdit SaaS — Complete Setup & Deploy Guide

## Project Structure
```
duoedit/
├── frontend/          ← Next.js 14 (deploy to Vercel)
├── backend/           ← Node.js + Express (deploy to Railway)
└── supabase/          ← schema.sql (run in Supabase SQL editor)
```

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com → New Project
2. Open **SQL Editor** → paste entire `supabase/schema.sql` → Run
3. Go to **Auth → Providers** → enable **Email** and **Google**
4. Copy your **Project URL** and **anon/service keys** from Settings → API

---

## Step 2 — Razorpay Setup

1. Go to https://razorpay.com → Dashboard → Settings → API Keys
2. Generate **Key ID** and **Key Secret**
3. Go to **Subscriptions → Plans** → create Pro (₹499) and Studio (₹1299) plans
4. Go to **Webhooks** → Add webhook URL: `https://your-backend.railway.app/api/webhooks/razorpay`
   - Events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`

---

## Step 3 — Stripe Setup

1. Go to https://stripe.com → Dashboard
2. **Products** → create Pro (₹499/mo) and Studio (₹1299/mo) subscriptions
3. Copy the **Price IDs** (price_xxxxxxxx)
4. **Webhooks** → Add endpoint: `https://your-backend.railway.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy **Webhook Signing Secret**

---

## Step 4 — Backend Deploy (Railway)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo, set root to `/backend`
3. Add these environment variables:
```
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_STUDIO_PRICE_ID=price_xxx
JWT_SECRET=your_random_32char_secret
```

---

## Step 5 — Frontend Deploy (Vercel)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Set root to `/frontend`
3. Add environment variables:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```
4. Deploy!

---

## Step 6 — Set Admin User

After signup, run this in Supabase SQL editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

---

## Local Development

```bash
# Install all dependencies
npm install

# Start both frontend + backend
npm run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## Flutter App Integration

In your Flutter app, add these API calls:

```dart
// Login with Supabase
await Supabase.instance.client.auth.signInWithPassword(
  email: email, password: password
);

// Check subscription
final token = Supabase.instance.client.auth.currentSession!.accessToken;
final res = await http.get(
  Uri.parse('$API_URL/api/subscriptions/me'),
  headers: {'Authorization': 'Bearer $token'},
);

// Block export if limit hit
if (usage['exports_this_month'] >= usage['export_limit']) {
  // Show upgrade dialog
}
```

---

## Pages Summary

| Route        | Description                        |
|--------------|------------------------------------|
| `/`          | Landing page                       |
| `/login`     | Login / Signup with Supabase auth  |
| `/pricing`   | Plans + Razorpay/Stripe payment    |
| `/dashboard` | User dashboard with stats          |
| `/admin`     | Admin panel (admin role required)  |

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Helmet, Rate limiting
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Razorpay (India) + Stripe (International)
- **Hosting**: Vercel (frontend) + Railway (backend)
- **Mobile**: Flutter + FFmpeg (existing app)
