import { supabase } from './supabase';

async function invoke(fn, options = {}) {
  const { data, error } = await supabase.functions.invoke(fn, options);
  if (error) throw error;
  return data;
}

export const api = {
  getCampaigns: () =>
    invoke('campaigns-list'),

  sendCampaign: (formData) =>
    invoke('campaigns-send', { body: formData }),

  getCampaign: (campaignId) =>
    invoke('campaign-detail', { body: { campaignId } }),

  getCampaignLogs: (campaignId) =>
    invoke('campaign-logs', { body: { campaignId } }),
};
