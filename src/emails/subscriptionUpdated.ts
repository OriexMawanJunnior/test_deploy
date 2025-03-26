export const getSubscriptionUpdatedEmail = (plan: string) => ({
  subject: `Your osMerge plan was updated`,
  html: `
    <p>Your subscription has been updated to: <strong>${plan}</strong>.</p>
    <p>Thank you for using osMerge!</p>
  `
});
