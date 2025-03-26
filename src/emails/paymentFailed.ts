export const getPaymentFailedEmail = (retryUrl: string) => ({
  subject: `Payment failed — osMerge`,
  html: `
    <p>Your recent payment attempt failed.</p>
    <p>Please <a href="${retryUrl}">update your payment method</a> to avoid service interruption.</p>
  `
});
