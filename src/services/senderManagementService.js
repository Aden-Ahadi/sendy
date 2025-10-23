/**
 * SendGrid Sender Management Service
 * Handles adding and verifying sender emails for users
 */

const sgClient = require('@sendgrid/client');

class SenderManagementService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required');
    }
    sgClient.setApiKey(apiKey);
  }

  /**
   * Create a new verified sender for a user
   * @param {Object} senderData - Sender information
   * @returns {Promise<Object>} - SendGrid response
   */
  async createVerifiedSender(senderData) {
    const { nickname, fromEmail, fromName, replyTo, address, city, country } = senderData;

    const data = {
      nickname: nickname || fromName,
      from_email: fromEmail,
      from_name: fromName,
      reply_to: replyTo || fromEmail,
      address: address || 'Address',
      city: city || 'City',
      country: country || 'United States',
    };

    try {
      const request = {
        url: '/v3/verified_senders',
        method: 'POST',
        body: data,
      };

      const [response, body] = await sgClient.request(request);
      
      return {
        success: true,
        senderId: body.id,
        verificationStatus: body.verification_status,
        message: 'Verification email sent. Check your inbox to verify.',
      };
    } catch (error) {
      console.error('SendGrid API Error:', error.response?.body || error.message);
      throw new Error(error.response?.body?.errors?.[0]?.message || 'Failed to create verified sender');
    }
  }

  /**
   * Get verification status of a sender
   * @param {number} senderId - SendGrid sender ID
   * @returns {Promise<Object>} - Verification status
   */
  async getSenderStatus(senderId) {
    try {
      const request = {
        url: `/v3/verified_senders/${senderId}`,
        method: 'GET',
      };

      const [response, body] = await sgClient.request(request);
      
      return {
        id: body.id,
        email: body.from_email,
        name: body.from_name,
        verified: body.verification_status === 'verified',
        status: body.verification_status,
      };
    } catch (error) {
      console.error('Get sender status error:', error.response?.body || error.message);
      throw new Error('Failed to get sender status');
    }
  }

  /**
   * Resend verification email
   * @param {number} senderId - SendGrid sender ID
   * @returns {Promise<Object>}
   */
  async resendVerification(senderId) {
    try {
      const request = {
        url: `/v3/verified_senders/${senderId}/resend`,
        method: 'POST',
      };

      await sgClient.request(request);
      
      return {
        success: true,
        message: 'Verification email resent. Check your inbox.',
      };
    } catch (error) {
      console.error('Resend verification error:', error.response?.body || error.message);
      throw new Error('Failed to resend verification email');
    }
  }

  /**
   * Delete a verified sender
   * @param {number} senderId - SendGrid sender ID
   * @returns {Promise<Object>}
   */
  async deleteSender(senderId) {
    try {
      const request = {
        url: `/v3/verified_senders/${senderId}`,
        method: 'DELETE',
      };

      await sgClient.request(request);
      
      return {
        success: true,
        message: 'Sender deleted successfully',
      };
    } catch (error) {
      console.error('Delete sender error:', error.response?.body || error.message);
      throw new Error('Failed to delete sender');
    }
  }
}

module.exports = SenderManagementService;
