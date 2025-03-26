import { resend } from '@/lib/resend';
import { getPaymentFailedEmail } from '@/emails/paymentFailed';

export const sendPaymentFailedEmail = async (to: string, retryUrl: string) => {
  const content = getPaymentFailedEmail(retryUrl);
  await resend.emails.send({
    from: 'osMerge <osmerge@oscloud.app>',
    to,
    subject: content.subject,
    html: content.html,
  });
};