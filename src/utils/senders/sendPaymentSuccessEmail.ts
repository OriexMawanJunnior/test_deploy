import { resend } from '@/lib/resend';
import { getPaymentSuccessEmail } from '@/emails/paymentSuccess';

export const sendPaymentSuccessEmail = async (to: string) => {
  const content = getPaymentSuccessEmail();
  await resend.emails.send({
    from: 'osMerge <osmerge@oscloud.app>',
    to,
    subject: content.subject,
    html: content.html,
  });
};
