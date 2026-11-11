import Stripe from 'stripe';
import { getDB } from '../config/db.js';

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_xxx';
  return new Stripe(secretKey);
};

/**
 * Create Stripe Checkout Session for upgrading plan
 * POST /api/payments/create-checkout [verifyToken]
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planName = 'Pro Tutor Plan', amount = 15 } = req.body;
    const db = getDB();
    const usersCol = db.collection('users');

    const user = await usersCol.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const stripe = getStripe();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName
            },
            unit_amount: Math.round(Number(amount) * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        userEmail: req.user.email,
        userName: user.name || 'User',
        userRole: user.role || req.user.role,
        planName
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Stripe checkout session.',
      error: error.message
    });
  }
};

/**
 * Verify completed checkout session and update plan to Pro
 * POST /api/payments/verify-session [verifyToken]
 */
export const verifySession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required to verify payment.'
      });
    }

    const db = getDB();
    const paymentsCol = db.collection('payments');
    const usersCol = db.collection('users');

    // Check if payment with this stripeSessionId already exists (idempotent)
    const existingPayment = await paymentsCol.findOne({ stripeSessionId: sessionId });
    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        payment: existingPayment
      });
    }

    // Retrieve from Stripe
    const stripe = getStripe();
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to retrieve session from Stripe.',
        error: stripeError.message
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed.'
      });
    }

    const userEmail = session.metadata?.userEmail || req.user.email;
    const userName = session.metadata?.userName || '';
    const userRole = session.metadata?.userRole || req.user.role;
    const planName = session.metadata?.planName || 'Pro Tutor Plan';
    const amount = (session.amount_total || 1500) / 100;
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
      stripeSessionId: sessionId,
      paymentStatus: 'paid',
      paidAt: new Date()
    };

    await paymentsCol.insertOne(paymentRecord);

    // Update user's plan to 'pro'
    await usersCol.updateOne(
      { email: userEmail },
      { $set: { plan: 'pro', updatedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'Payment successfully verified and account upgraded to Pro.',
      payment: paymentRecord
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment session.',
      error: error.message
    });
  }
};
