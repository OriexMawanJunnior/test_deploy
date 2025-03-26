import { resend } from '@/lib/resend';
import { getWorkspaceInvitationEmail } from '@/emails/workspaceInvitation';

export const sendWorkspaceInvitationEmail = async (
  to: string,
  inviter: string,
  workspaceName: string,
  inviteUrl: string
) => {
  const content = getWorkspaceInvitationEmail(inviter, workspaceName, inviteUrl);
  await resend.emails.send({
    from: 'osMerge <osmerge@oscloud.app>',
    to,
    subject: content.subject,
    html: content.html,
  });
};
