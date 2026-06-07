const router  = require('express').Router();
const Razorpay = require('razorpay');
const Stripe   = require('stripe');
const crypto   = require('crypto');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICES = {
  pro:    { INR: 49900,  USD: 699  },  // paise / cents
  studio: { INR: 129900, USD: 1799 },
};

const STRIPE_PRICE_IDS = {
  pro:    process.env.STRIPE_PRO_PRICE_ID,
  studio: process.env.STRIPE_STUDIO_PRICE_ID,
};

// ── RAZORPAY ─────────────────────────────────────────────────

// POST /api/payment/razorpay/create-order
router.post('/razorpay/create-order', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const order = await razorpay.orders.create({
      amount:   PLAN_PRICES[plan].INR,
      currency: 'INR',
      receipt:  `order_${req.user.id}_${Date.now()}`,
      notes:    { userId: req.user.id, plan },
    });

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/razorpay/verify
router.post('/razorpay/verify', requireAuth, async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan } = req.body;

    // Verify signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).json({ error: 'Payment signature mismatch' });
    }

    // Save transaction
    await supabase.from('transactions').insert({
      user_id:       req.user.id,
      gateway:       'razorpay',
      gateway_txn_id: paymentId,
      amount:        PLAN_PRICES[plan].INR,
      currency:      'INR',
      status:        'success',
      plan,
    });

    // Upsert subscription
    const renews = new Date();
    renews.setMonth(renews.getMonth() + 1);

    await supabase.from('subscriptions').upsert(
      {
        user_id:    req.user.id,
        plan,
        status:     'active',
        gateway:    'razorpay',
        payment_id: paymentId,
        started_at: new Date().toISOString(),
        renews_at:  renews.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    res.json({ success: true, message: 'Subscription activated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STRIPE ───────────────────────────────────────────────────

// POST /api/payment/stripe/create-session
router.post('/stripe/create-session', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!STRIPE_PRICE_IDS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    // Get or create Stripe customer
    let customerId;
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_cust_id')
      .eq('user_id', req.user.id)
      .single();

    if (sub?.stripe_cust_id) {
      customerId = sub.stripe_cust_id;
    } else {
      const customer = await stripe.customers.create({
        email:    req.user.email,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
      metadata:   { userId: req.user.id, plan },
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&plan=${plan}`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/stripe/portal — customer billing portal
router.post('/stripe/portal', requireAuth, async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_cust_id')
      .eq('user_id', req.user.id)
      .single();

    if (!sub?.stripe_cust_id) {
      return res.status(404).json({ error: 'No Stripe subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_cust_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
