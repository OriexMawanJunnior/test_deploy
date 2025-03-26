import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { sendPaymentSuccessEmail } from '@/utils/senders/sendPaymentSuccessEmail';
import { sendPaymentFailedEmail } from '@/utils/senders/sendPaymentFailedEmail';
import { sendSubscriptionUpdatedEmail } from '@/utils/senders/sendSubscriptionUpdatedEmail';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

router.post('/stripe/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret!);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const customerEmail1 = event.data.object.customer_email;
        if (customerEmail1) {
          await sendPaymentSuccessEmail(customerEmail1);
        } else {
          console.error('Customer email is null for invoice.payment_succeeded event');
        }
        break;

      case 'invoice.payment_failed':
        const customerEmail2 = event.data.object.customer_email;
        const retryUrl = `https://your-retry-url.com/retry?invoice=${event.data.object.id}`;
        if (customerEmail2) {
          await sendPaymentFailedEmail(customerEmail2, retryUrl);
        } else {
          console.error('Customer email is null for invoice.payment_failed event');
        }
        break;

      case 'customer.subscription.updated':
        const customer = await stripe.customers.retrieve((event.data.object as any).customer);
        const customerEmail3 = (customer as any).email;
        const plan = (event.data.object as any).plan.nickname || 'Unknown Plan';
        await sendSubscriptionUpdatedEmail(customerEmail3, plan);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
  }

  res.json({ received: true });
});

export default router;

