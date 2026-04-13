import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listingsService } from '@/services/listings.service';
import { profileService } from '@/services/profile.service';
import { savedService } from '@/services/saved.service';
import { useAuth } from '@/context/AuthContext';
import { Listing, Profile } from '@/types';

// ── One-time migration from AsyncStorage → Supabase ───────────────────────────

const MIGRATION_KEY = '@gzw_saved_migrated_v1';

async function runMigrationIfNeeded(userId: string): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_KEY);
    if (done) return;

    const [rawListings, rawSellers] = await Promise.all([
      AsyncStorage.getItem('@gzw_saved_ids'),
      AsyncStorage.getItem('@gzw_saved_seller_ids'),
    ]);

    const listingIds: string[] = rawListings ? JSON.parse(rawListings) : [];
    const sellerIds: string[] = rawSellers ? JSON.parse(rawSellers) : [];

    await savedService.migrateSavedIds(userId, listingIds, sellerIds);

    await Promise.all([
      AsyncStorage.removeItem('@gzw_saved_ids'),
      AsyncStorage.removeItem('@gzw_saved_seller_ids'),
      AsyncStorage.setItem(MIGRATION_KEY, '1'),
    ]);
  } catch {
    // Non-fatal — existing local saves just don't transfer on failure
  }
}

// ── Saved Listings ─────────────────────────────────────────────────────────────

export async function toggleSaved(currentUserId: string, listingId: string): Promise<boolean> {
  return savedService.toggleSavedListing(currentUserId, listingId);
}

export function useSavedListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    await runMigrationIfNeeded(user.id);
    const ids = await savedService.getSavedListingIds(user.id);
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    const results = await Promise.all(ids.map((id) => listingsService.getListing(id)));
    setListings(results.filter((r) => r.data != null).map((r) => r.data as Listing));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { listings, loading, reload: load };
}

export function useIsSaved(listingId: string) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    savedService.getSavedListingIds(user.id).then((ids) => setSaved(ids.includes(listingId)));
  }, [user, listingId]);

  const toggle = useCallback(async () => {
    if (!user) return false;
    const next = await savedService.toggleSavedListing(user.id, listingId);
    setSaved(next);
    return next;
  }, [user, listingId]);

  return { saved, toggle };
}

// ── Saved Sellers ──────────────────────────────────────────────────────────────

// currentUserId = the logged-in user; sellerId = the seller being (un)saved
export async function toggleSavedSeller(currentUserId: string, sellerId: string): Promise<boolean> {
  return savedService.toggleSavedSeller(currentUserId, sellerId);
}

export function useSavedSellers() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSellers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = await savedService.getSavedSellerIds(user.id);
    if (ids.length === 0) {
      setSellers([]);
      setLoading(false);
      return;
    }
    const results = await Promise.all(ids.map((id) => profileService.getProfile(id)));
    setSellers(results.filter((r) => r.data != null).map((r) => r.data as Profile));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { sellers, loading, reload: load };
}

export function useIsSellerSaved(sellerId: string) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    savedService.getSavedSellerIds(user.id).then((ids) => setSaved(ids.includes(sellerId)));
  }, [user, sellerId]);

  const toggle = useCallback(async () => {
    if (!user) return false;
    const next = await savedService.toggleSavedSeller(user.id, sellerId);
    setSaved(next);
    return next;
  }, [user, sellerId]);

  return { saved, toggle };
}
