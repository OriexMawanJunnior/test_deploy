import { resend } from '@/lib/resend';
import { getWelcomeEmail } from '@/emails/welcomeEmail';

export const sendWelcomeEmail = async (to: string, name: string) => {
  const content = getWelcomeEmail(name);
  await resend.emails.send({
    from: 'osMerge <osmerge@oscloud.app>',
    to,
    subject: content.subject,
    html: content.html,
  });
};
