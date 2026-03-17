const Stripe = require('stripe');
const readBody = require('./read-body');

module.exports = async function (req, res) {
  // GET = return Stripe publishable key
  if (req.method === 'GET') {
    return res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null });
  }
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
  if (!stripe) return res.status(500).json({ error: 'Stripe is not configured.' });

  try {
    const body = JSON.parse(await readBody(req));
    const { productName, priceAmount, typefaceId, embedded, metadata: extraMeta } = body;
    if (!productName || !priceAmount) {
      return res.status(400).json({ error: 'Missing productName or priceAmount' });
    }

    const baseUrl = process.env.BASE_URL || process.env.BETTER_AUTH_URL || 'https://alphabets.indigoindigo.org';
    const isEmbedded = !!embedded;

    const sessionConfig = {
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: productName, description: `Font license – ${productName}` },
          unit_amount: Math.round(priceAmount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { typefaceId: typefaceId || '', productName, ...(extraMeta || {}) },
    };

    if (isEmbedded) {
      sessionConfig.ui_mode = 'embedded';
      sessionConfig.return_url = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionConfig.success_url = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      sessionConfig.cancel_url = `${baseUrl}/${typefaceId || ''}`;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json(isEmbedded ? { clientSecret: session.client_secret } : { url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
