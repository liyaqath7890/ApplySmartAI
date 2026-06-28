import Stripe from 'stripe';
import config from '../config/index.js';
import { Subscription, Plan, User } from '../routes/models/index.js';

// Initialize Stripe only if secret key is available, otherwise use a mock
let stripe;
if (config.stripe.secretKey) {
  stripe = new Stripe(config.stripe.secretKey);
} else {
  // Mock Stripe object for development
  stripe = {
    customers: { create: async () => ({ id: 'mock_customer_id' }) },
    checkout: { sessions: { create: async () => ({ id: 'mock_session_id', url: 'http://localhost:3000/billing' }) } },
    subscriptions: { update: async () => ({}) }
  };
}

export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({ where: { isActive: true }, order: [['orderIndex', 'ASC']] });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findByPk(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const user = await User.findByPk(req.user.id);
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      });
      customerId = customer.id;
      await user.update({ stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/canceled`
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id },
      include: [{ model: Plan, as: 'plan' }]
    });
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ where: { userId: req.user.id } });
    
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No subscription found' });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    await subscription.update({ cancelAtPeriodEnd: true });
    res.json({ success: true, message: 'Subscription will be cancelled at period end' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const user = await User.findOne({ where: { stripeCustomerId: session.customer } });
        if (user) {
          await Subscription.create({
            userId: user.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            status: 'active'
          });
          await user.update({ currentPlan: 'premium' });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subscription = await Subscription.findOne({ where: { stripeSubscriptionId: sub.id } });
        if (subscription) {
          await subscription.update({ status: 'canceled' });
          const user = await User.findByPk(subscription.userId);
          await user.update({ currentPlan: 'free' });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
