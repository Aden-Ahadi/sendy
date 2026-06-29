const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }
    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

async function createCampaign(campaignId, subject, totalRecipients, replyTo) {
  const { data, error } = await getClient()
    .from('campaigns')
    .insert({
      campaign_id: campaignId,
      subject,
      total_recipients: totalRecipients,
      reply_to: replyTo || null,
      status: 'sending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateCampaignProgress(campaignId, successful, failed, status) {
  const update = { successful, failed, status };
  if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await getClient()
    .from('campaigns')
    .update(update)
    .eq('campaign_id', campaignId);

  if (error) console.error('Supabase updateCampaignProgress error:', error.message);
}

async function logEmailResult(campaignId, result) {
  const { error } = await getClient()
    .from('campaign_logs')
    .insert({
      campaign_id: campaignId,
      recipient_name: result.recipient?.name || null,
      recipient_email: result.recipient?.email || null,
      status: result.success ? 'success' : 'failed',
      error: result.error || null,
      message_id: result.messageId || null,
      attempt: result.attempt || 1,
    });

  if (error) console.error('Supabase logEmailResult error:', error.message);
}

async function getCampaigns() {
  const { data, error } = await getClient()
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getCampaignById(campaignId) {
  const { data, error } = await getClient()
    .from('campaigns')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (error) throw error;
  return data;
}

async function getCampaignLogs(campaignId) {
  const { data, error } = await getClient()
    .from('campaign_logs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

module.exports = {
  createCampaign,
  updateCampaignProgress,
  logEmailResult,
  getCampaigns,
  getCampaignById,
  getCampaignLogs,
};
