const router   = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require admin role

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', plan = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('*, subscriptions(plan, status, renews_at, gateway, created_at)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike('email', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ users: data, total: count, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/revenue
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    // Active subscriptions
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('plan, amount')
      .eq('status', 'active');

    const mrr = (activeSubs || []).reduce((sum, s) => {
      const prices = { pro: 499, studio: 1299 };
      return sum + (prices[s.plan] || 0);
    }, 0);

    // This month transactions
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyTxns } = await supabase
      .from('transactions')
      .select('amount, status, plan, created_at')
      .gte('created_at', monthStart.toISOString());

    const revenue = (monthlyTxns || [])
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + (t.amount / 100), 0);

    const refunds = (monthlyTxns || [])
      .filter(t => t.status === 'refunded')
      .reduce((sum, t) => sum + (t.amount / 100), 0);

    // Plan breakdown
    const planBreakdown = (activeSubs || []).reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    }, {});

    res.json({
      mrr,
      arr: mrr * 12,
      monthlyRevenue: revenue,
      refunds,
      activeSubscribers: (activeSubs || []).length,
      planBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/transactions
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*, profiles(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ transactions: data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/plan — manually change user plan
router.patch('/users/:id/plan', requireAdmin, async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['starter', 'pro', 'studio'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    await supabase.from('subscriptions').upsert(
      {
        user_id:    req.params.id,
        plan,
        status:     'active',
        gateway:    'free',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    res.json({ success: true, message: `User plan updated to ${plan}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id — delete user account
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    // Delete from Supabase Auth (cascades to profiles via FK)
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats — dashboard summary
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: activeProSubs },
      { count: totalProjects },
      { count: totalExports },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).in('plan', ['pro', 'studio']).eq('status', 'active'),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('exports').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    ]);

    res.json({ totalUsers, activeProSubs, totalProjects, totalExports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
