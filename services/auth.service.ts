import { supabase } from '@/lib/supabase';

export const authService = {
  async signUp(email: string, password: string, username: string) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return { data: null, error: { message: 'Username already taken' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (!error && data.user) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id);
    }

    return { data, error };
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gzwmarket://reset-password',
    });
  },
};
