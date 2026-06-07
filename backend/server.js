require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes         = require('./routes/auth');
const paymentRoutes      = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes        = require('./routes/admin');
const webhookRoutes      = require('./routes/webhooks');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Stripe webhook needs raw body — register BEFORE json middleware
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/razorpay', express.json());

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many payment attempts. Try again in an hour.' },
});
app.use('/api/payment/', strictLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/payment',       paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/webhooks',      webhookRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`✅ DuoEdit backend running on port ${PORT}`));
