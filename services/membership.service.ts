import { supabase } from '@/lib/supabase';

export const membershipService = {
  async claimEarlyAccess(): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('claim_early_access');
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  },
};
