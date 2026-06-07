const router = require('express').Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/auth/me — current user profile + subscription
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, subscriptions(plan, status, renews_at, gateway)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/usage — export + storage usage
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profile — update name / avatar
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
