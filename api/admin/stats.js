const Stripe = require('stripe');
const requireAdmin = require('../_require-admin');

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await requireAdmin(req, res);
  if (!session) return;

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  try {
    const fontCount = 12; // approximate; server.js has the real map
    let orderCount = 0, revenue = 0;
    if (stripe) {
      const since = Math.floor((Date.now() - 30 * 86400000) / 1000);
      const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: since } });
      const paid = sessions.data.filter(s => s.payment_status === 'paid');
      orderCount = paid.length;
      revenue = paid.reduce((sum, s) => sum + (s.amount_total || 0), 0);
    }
    res.json({ fontCount, orderCount, revenue, hasStripe: !!stripe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
