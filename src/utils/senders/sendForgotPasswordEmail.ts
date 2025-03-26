import { resend } from '@/lib/resend';
import { getForgotPasswordEmail } from '@/emails/forgotPassword';

export const sendForgotPasswordEmail = async (to: string, resetUrl: string) => {
  const content = getForgotPasswordEmail(resetUrl);
  await resend.emails.send({
    from: 'osMerge <osmerge@oscloud.app>',
    to,
    subject: content.subject,
    html: content.html,
  });
};
