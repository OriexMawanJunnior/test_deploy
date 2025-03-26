export const getWorkspaceInvitationEmail = (inviter: string, workspaceName: string, inviteUrl: string) => ({
  subject: `You're invited to join ${workspaceName} on osMerge`,
  html: `
    <p>${inviter} has invited you to join the workspace: <strong>${workspaceName}</strong>.</p>
    <p><a href="${inviteUrl}">Accept Invitation</a></p>
  `
});
