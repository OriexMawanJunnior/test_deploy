import { resend } from '@/lib/resend';
import { getSubscriptionUpdatedEmail } from '@/emails/subscriptionUpdated';

export const sendSubscriptionUpdatedEmail = async (to: string,  plan: string) => {
  const content = getSubscriptionUpdatedEmail(plan);
  await resend.emails.send({
    from: 'osMerge <osmerge@oscloud.app>',
    to,
    subject: content.subject,
    html: content.html,
  });
};
