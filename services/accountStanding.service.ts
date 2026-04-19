import { supabase } from '@/lib/supabase';

export interface UserStrike {
  id: string;
  reason: string;
  issued_at: string;
  expires_at: string | null;
  appeal_status: 'none' | 'pending' | 'upheld' | 'overturned';
}

export const accountStandingService = {
  async getMyStrikes(): Promise<{ data: UserStrike[]; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from('user_strikes')
      .select('id, reason, issued_at, expires_at, appeal_status')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false });

    return { data: (data as UserStrike[]) ?? [], error };
  },

  async markOnboardingComplete(userId: string) {
    return supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', userId);
  },
};
