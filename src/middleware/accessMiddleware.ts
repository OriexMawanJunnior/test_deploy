import { supabase } from '@/lib/supabaseClient';
import { Request, Response, NextFunction } from 'express';

type PlanType = 'Free' | 'Essential' | 'Professional' | 'Advance';

function checkAccess(userPlan: PlanType, category: string): boolean {
  const accessMap = {
    Free: ['General'],
    Essential: ['General', 'Writing', 'Translation'],
    Professional: ['General', 'Writing', 'Translation', 'Coding', 'Search'],
    Advance: ['General', 'Writing', 'Translation', 'Coding', 'Search', 'Text to Image', 'Text to Video', 'Image to Video'],
  };

  return accessMap[userPlan]?.includes(category) || false;
}

export const accessMiddleware = (category: string) => async (req: Request, res: Response, next: NextFunction) => {
  const { workspace_id, user_id } = req.body;
  if (!workspace_id || !user_id) {
    return res.status(400).json({ error: 'Missing workspace_id or user_id' });
  }

  try {
    // Fetch user plan from workspace_users table
    const { data, error } = await supabase
      .from('workspace_users')
      .select('plan')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user_id)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: 'Access denied: Unable to fetch user plan' });
    }

    const userPlan = data.plan;

    // Check if the user has access to the requested category
    if (!checkAccess(userPlan, category)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (err) {
    console.error('Error in accessMiddleware:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};