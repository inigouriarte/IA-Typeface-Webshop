const Stripe = require('stripe');
const requireAdmin = require('../_require-admin');

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await requireAdmin(req, res);
  if (!session) return;

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  if (!stripe) return res.json({ orders: [], hasStripe: false });

  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const params = { limit, expand: ['data.line_items'] };
    if (req.query.starting_after) params.starting_after = req.query.starting_after;
    const sessions = await stripe.checkout.sessions.list(params);
    const orders = sessions.data
      .filter(s => s.payment_status === 'paid')
      .map(s => ({
        id: s.id,
        created: s.created,
        email: s.customer_details?.email || '',
        name: s.customer_details?.name || '',
        amount: s.amount_total,
        currency: s.currency,
        typefaceId: s.metadata?.typefaceId || '',
        productName: s.metadata?.productName || '',
        licenseTier: s.metadata?.licenseTier || '',
        country: s.customer_details?.address?.country || '',
        city: s.customer_details?.address?.city || '',
      }));
    res.json({
      orders,
      hasMore: sessions.has_more,
      hasStripe: true,
      lastId: orders.length ? orders[orders.length - 1].id : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
