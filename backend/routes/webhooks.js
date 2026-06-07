const router   = require('express').Router();
const Stripe   = require('stripe');
const crypto   = require('crypto');
const supabase = require('../lib/supabase');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ── STRIPE WEBHOOK ───────────────────────────────────────────
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session  = event.data.object;
        const userId   = session.metadata.userId;
        const plan     = session.metadata.plan;
        const custId   = session.customer;
        const subId    = session.subscription;

        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const renews    = new Date(stripeSub.current_period_end * 1000);

        await supabase.from('subscriptions').upsert(
          {
            user_id:        userId,
            plan,
            status:         'active',
            gateway:        'stripe',
            stripe_sub_id:  subId,
            stripe_cust_id: custId,
            started_at:     new Date().toISOString(),
            renews_at:      renews.toISOString(),
            updated_at:     new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        await supabase.from('transactions').insert({
          user_id:        userId,
          gateway:        'stripe',
          gateway_txn_id: session.payment_intent || subId,
          amount:         session.amount_total || 0,
          currency:       (session.currency || 'inr').toUpperCase(),
          status:         'success',
          plan,
          metadata:       { stripe_session_id: session.id },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await supabase
          .from('subscriptions')
          .update({
            status:     sub.status === 'active' ? 'active' : sub.status,
            renews_at:  new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_sub_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_sub_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await supabase
          .from('subscriptions')
          .update({ status: 'paused' })
          .eq('stripe_sub_id', invoice.subscription);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── RAZORPAY WEBHOOK ─────────────────────────────────────────
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expected !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  try {
    if (event === 'subscription.activated' || event === 'subscription.charged') {
      const sub    = payload.subscription.entity;
      const userId = sub.notes?.userId;
      const plan   = sub.notes?.plan;

      if (userId) {
        const renews = new Date(sub.current_end * 1000);
        await supabase.from('subscriptions').upsert(
          {
            user_id:         userId,
            plan,
            status:          'active',
            gateway:         'razorpay',
            razorpay_sub_id: sub.id,
            renews_at:       renews.toISOString(),
            updated_at:      new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
    }

    if (event === 'subscription.cancelled' || event === 'subscription.completed') {
      const sub = payload.subscription.entity;
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('razorpay_sub_id', sub.id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
