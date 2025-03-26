import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabaseClient';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

const PLAN_PRICES: Record<string, string> = {
    Essential: process.env.STRIPE_PRICE_ID_ESSENTIAL!,
    Professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
    Advance: process.env.STRIPE_PRICE_ID_ADVANCE!,
};

router.post('/create-checkout-session', async (req: Request, res: Response) => {
    const { workspace_id } = req.body;

    if (!workspace_id) {
        res.status(400).json({ error: 'workspace_id is required' });
        return;
    }

    const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('stripe_customer_id')
        .eq('id', workspace_id)
        .single();

    if (workspaceError || !workspaceData?.stripe_customer_id) {
        res.status(404).json({ error: 'Workspace not found or missing Stripe ID' });
        return;
    }

    const { data: usersData, error: usersError } = await supabase
        .from('workspace_users')
        .select('user_id, plan')
        .eq('workspace_id', workspace_id);

    if (usersError || !usersData || usersData.length === 0) {
        res.status(404).json({ error: 'No users found in this workspace' });
        return;
    }

    const line_items = usersData.map((user) => ({
        price: PLAN_PRICES[user.plan],
        quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
        customer: workspaceData.stripe_customer_id,
        line_items,
        mode: 'subscription',
        allow_promotion_codes: true,
        metadata: { workspace_id },
        subscription_data: { metadata: { workspace_id } },
        success_url: `${process.env.BASE_URL}/api/billing/success`,
        cancel_url: `${process.env.BASE_URL}/api/billing/cancel`,
    });

    res.json({ session_url: session.url });
});

router.get('/cancel', (req: Request, res: Response) => {
  res.redirect(`${process.env.BASE_URL}/dashboard?billing=cancel`);
});

export default router;
