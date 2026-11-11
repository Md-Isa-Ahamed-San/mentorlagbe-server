import Stripe from 'stripe';
import { getDB } from '../config/db.js';

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_xxx';
  return new Stripe(secretKey);
};

/**
 * Handle Stripe webhook events
 * POST /api/stripe/webhook (Raw body)
 */
export const stripeWebhookHandler = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_xxx';

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const db = getDB();
      const paymentsCol = db.collection('payments');
      const usersCol = db.collection('users');

      const existingPayment = await paymentsCol.findOne({ stripeSessionId: session.id });
      if (!existingPayment) {
        const userEmail = session.metadata?.userEmail;
        const userName = session.metadata?.userName || '';
        const userRole = session.metadata?.userRole || 'tutor';
        const planName = session.metadata?.planName || 'Pro Tutor Plan';
        const amount = (session.amount_total || 0) / 100;
        const currency = session.currency || 'usd';
        const transactionId = session.payment_intent || session.id;

        const paymentRecord = {
          userEmail,
          userName,
          userRole,
          planName,
          amount,
          currency,
          transactionId,
          stripeSessionId: session.id,
          paymentStatus: 'paid',
          paidAt: new Date()
        };

        await paymentsCol.insertOne(paymentRecord);

        if (userEmail) {
          await usersCol.updateOne(
            { email: userEmail },
            { $set: { plan: 'pro', updatedAt: new Date() } }
          );
        }
        console.log(`[Stripe Webhook] Successfully processed payment for ${userEmail}`);
      }
    } catch (dbError) {
      console.error('[Stripe Webhook] Error updating payment in database:', dbError);
      return res.status(500).json({ error: 'Database update failed' });
    }
  }

  return res.status(200).json({ received: true });
};
