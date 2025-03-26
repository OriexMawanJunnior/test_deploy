export const getWelcomeEmail = (name: string) => ({
  subject: `Welcome to osMerge, ${name}!`,
  html: `
    <h2>Welcome to osMerge!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for joining osMerge. We're excited to have you on board.</p>
    <p>You can start building your workspace now!</p>
    <p>— The osMerge Team</p>
  `
});
