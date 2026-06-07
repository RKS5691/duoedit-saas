const router   = require('express').Router();
const Stripe   = require('stripe');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// GET /api/subscriptions/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Default free plan if no subscription
    res.json(data || { plan: 'starter', status: 'active', gateway: 'free' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/cancel
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (!sub) return res.status(404).json({ error: 'No active subscription' });

    // Cancel on gateway
    if (sub.gateway === 'stripe' && sub.stripe_sub_id) {
      await stripe.subscriptions.update(sub.stripe_sub_id, {
        cancel_at_period_end: true,
      });
    }

    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', sub.id);

    res.json({ success: true, message: 'Subscription will cancel at period end' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
