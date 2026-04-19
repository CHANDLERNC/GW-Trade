import { supabase } from '@/lib/supabase';
import { Profile, FactionSlug } from '@/types';

type ProfileUpdates = Partial<
  Pick<Profile, 'username' | 'display_name' | 'bio' | 'faction_preference' | 'avatar_url' | 'display_name_color' | 'equipped_badge_id'>
>;

export const profileService = {
  async getProfile(userId: string) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  async getProfileByUsername(username: string) {
    return supabase.from('profiles').select('*').eq('username', username).single();
  },

  async updateProfile(userId: string, updates: ProfileUpdates) {
    if (updates.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', userId)
        .maybeSingle();

      if (existing) {
        return { data: null, error: { message: 'Username already taken' } };
      }
    }

    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  },
};
