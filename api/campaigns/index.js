const { verifyToken } = require('../../src/api/middleware/auth');
const supabaseService = require('../../src/services/supabaseService');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  try {
    const campaigns = await supabaseService.getCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list campaigns', details: error.message });
  }
};
