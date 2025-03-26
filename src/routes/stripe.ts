import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

// Pastikan middleware ini hanya untuk route "/webhook"
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  let event: Stripe.Event;

  try {
    // Gunakan Buffer, bukan objek yang sudah diparsing
    const sig = req.headers['stripe-signature']!;
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    res.status(400).send(`Webhook error: ${err.message}`);
    return;
  }

  // Proses event webhook dari Stripe
  if (event.type === 'invoice.created') {
    const invoice = event.data.object as Stripe.Invoice;
    const workspaceId = invoice.metadata?.workspace_id;

    const breakdown = invoice.lines.data.map((line) => ({
      plan: line.description,
      quantity: line.quantity,
      subtotal: line.amount_excluding_tax
    }));

    // Simpan data invoice ke Supabase
    await supabase.from('invoice_history').insert({
      workspace_id: workspaceId,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      status: invoice.status,
      invoice_url: invoice.invoice_pdf,
      breakdown
    });
  }

  res.json({ received: true });
  return;
});

export default router;