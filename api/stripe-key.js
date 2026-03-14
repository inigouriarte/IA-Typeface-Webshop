module.exports = function (req, res) {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null });
};
