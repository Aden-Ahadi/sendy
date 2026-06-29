const { verifyToken } = require('../../../src/api/middleware/auth');
const supabaseService = require('../../../src/services/supabaseService');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  try {
    const campaign = await supabaseService.getCampaignById(req.query.campaignId);
    res.json(campaign);
  } catch (error) {
    res.status(404).json({ error: 'Campaign not found' });
  }
};
