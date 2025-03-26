export const getForgotPasswordEmail = (resetUrl: string) => ({
  subject: `Reset your password for osMerge`,
  html: `
    <p>You requested a password reset.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a>.</p>
    <p>If you didn’t request this, you can ignore this email.</p>
  `
});
