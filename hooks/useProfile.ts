import { useState } from 'react';
import { profileService } from '@/services/profile.service';
import { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';

type ProfileUpdates = Partial<
  Pick<Profile, 'username' | 'display_name' | 'bio' | 'faction_preference' | 'display_name_color' | 'equipped_badge_id'>
>;

export function useProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: ProfileUpdates) => {
    if (!user) return { error: 'Not authenticated' };
    setSaving(true);
    setError(null);
    const { data, error } = await profileService.updateProfile(user.id, updates);
    if (error) {
      setError(error.message);
    } else {
      await refreshProfile();
    }
    setSaving(false);
    return { data, error };
  };

  return { profile, saving, error, updateProfile };
}
