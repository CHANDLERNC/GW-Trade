import { supabase } from '@/lib/supabase';
import { Profile, Report, Listing, LFGPost } from '@/types';

type AdminProfileUpdate = Partial<Pick<Profile, 'display_name' | 'username' | 'strikes'>>;

export const adminService = {
  // ── Players ────────────────────────────────────────────────────────────────

  async searchPlayers(query: string) {
    let q = supabase
      .from('profiles')
      .select('id, username, display_name, strikes, trades_completed, ratings_positive, ratings_negative, is_admin, created_at, faction_preference')
      .order('created_at', { ascending: false })
      .limit(50);

    if (query.trim()) {
      q = q.or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`);
    }

    return q;
  },

  async updatePlayer(userId: string, updates: AdminProfileUpdate) {
    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, username, display_name, strikes')
      .single();
  },

  async adjustStrikes(userId: string, delta: 1 | -1) {
    const { data: current, error: fetchErr } = await supabase
      .from('profiles')
      .select('strikes')
      .eq('id', userId)
      .single();

    if (fetchErr || !current) return { error: fetchErr ?? { message: 'Not found' } };

    const next = Math.max(0, (current.strikes ?? 0) + delta);
    return supabase
      .from('profiles')
      .update({ strikes: next })
      .eq('id', userId)
      .select('id, strikes')
      .single();
  },

  // ── Reports ────────────────────────────────────────────────────────────────

  async fetchReports(status?: Report['status']) {
    let q = supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id ( username, display_name ),
        reported_user:reported_user_id ( username, display_name )
      `)
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);

    const { data, error } = await q;
    return { data: (data as Report[]) ?? [], error };
  },

  async updateReportStatus(
    reportId: string,
    status: Report['status'],
    resolution_note?: string
  ) {
    const updates: Record<string, any> = { status };
    if (status !== 'open' && status !== 'triaged') {
      updates.resolved_at = new Date().toISOString();
      if (resolution_note) updates.resolution_note = resolution_note;
    }
    return supabase.from('reports').update(updates).eq('id', reportId);
  },

  // ── Listings ───────────────────────────────────────────────────────────────

  async fetchAllListings(search?: string) {
    let q = supabase
      .from('listings')
      .select('id, title, category, faction, is_active, created_at, want_in_return, profiles:user_id (id, username, display_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search?.trim()) {
      q = q.ilike('title', `%${search.trim()}%`);
    }

    const { data, error } = await q;
    return { data: (data as Listing[]) ?? [], error };
  },

  async deleteListing(id: string) {
    return supabase.from('listings').delete().eq('id', id);
  },

  // ── LFG ───────────────────────────────────────────────────────────────────

  async fetchAllLFGPosts(activeOnly?: boolean) {
    let q = supabase
      .from('lfg_posts')
      .select('id, faction, zone, region, slots_total, description, is_active, expires_at, created_at, profiles:user_id (id, username, display_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (activeOnly) {
      q = q.eq('is_active', true).gt('expires_at', new Date().toISOString());
    }

    const { data, error } = await q;
    return { data: (data as LFGPost[]) ?? [], error };
  },

  async deactivateLFGPost(id: string) {
    return supabase.from('lfg_posts').update({ is_active: false }).eq('id', id);
  },

  async deleteLFGPost(id: string) {
    return supabase.from('lfg_posts').delete().eq('id', id);
  },
};
