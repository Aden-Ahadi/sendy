/**
 * Sender Management Service removed
 *
 * This project no longer includes SendGrid integration. The original
 * SenderManagementService depended on the SendGrid client library.
 * To avoid a hard crash when modules require this file, we export a
 * class that throws an explicit error informing the caller that
 * sender management via SendGrid is disabled.
 */

class SenderManagementServiceDisabled {
  constructor() {
    throw new Error('Sender management requires SendGrid which has been removed from this project.\n' +
      'If you need sender verification features, re-enable SendGrid or implement an alternative provider.');
  }
}

module.exports = SenderManagementServiceDisabled;
