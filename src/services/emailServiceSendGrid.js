// SendGrid support has been removed from this codebase per repository policy.
// If this file is required anywhere, it will throw to prevent accidental usage.

module.exports = class EmailServiceSendGridDisabled {
  constructor() {
    throw new Error('SendGrid support has been removed. Use the SMTP EmailService instead.');
  }
};
