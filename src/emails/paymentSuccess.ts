export const getPaymentSuccessEmail = () => ({
  subject: `Payment successful — osMerge`,
  html: `
    <p>Your payment was successful. Thank you for continuing to use osMerge!</p>
    <p>Invoice is attached separately by Stripe.</p>
  `
});
