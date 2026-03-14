const Stripe = require('stripe');
const crypto = require('crypto');

const DOWNLOAD_SECRET = process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || '';
const DOWNLOAD_TTL_MS = 48 * 60 * 60 * 1000;

function createDownloadToken(sessionId) {
  const expires = Date.now() + DOWNLOAD_TTL_MS;
  const payload = sessionId + ':' + expires;
  const sig = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
  return Buffer.from(payload + ':' + sig).toString('base64url');
}

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  try {
    const id = req.query.id;
    const session = await stripe.checkout.sessions.retrieve(id, { expand: ['line_items'] });
    const downloadToken = session.payment_status === 'paid' ? createDownloadToken(session.id) : null;

    res.json({
      id: session.id,
      status: session.payment_status,
      customerEmail: session.customer_details?.email || '',
      customerName: session.customer_details?.name || '',
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      downloadToken,
      lineItems: (session.line_items?.data || []).map(li => ({
        name: li.description,
        amount: li.amount_total,
        currency: li.currency,
        quantity: li.quantity,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
