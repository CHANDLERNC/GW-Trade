import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { profileService } from '@/services/profile.service';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Register for push notifications whenever a user is logged in
  usePushNotifications(session?.user?.id);

  const loadProfile = async (userId: string) => {
    const { data } = await profileService.getProfile(userId);
    if (data) setProfile(data);
  };

  useEffect(() => {
    let initialHandled = false;

    // Hard timeout — if onAuthStateChange never fires (extreme edge case), unblock after 10s.
    const timeout = setTimeout(() => {
      if (!initialHandled) {
        initialHandled = true;
        setLoading(false);
      }
    }, 10_000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Fire-and-forget so a slow profile fetch never blocks the spinner.
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      // Unblock the loading screen on the very first auth event (INITIAL_SESSION).
      if (!initialHandled) {
        initialHandled = true;
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
