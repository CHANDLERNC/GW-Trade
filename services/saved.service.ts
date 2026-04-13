import { supabase } from '@/lib/supabase';

export const savedService = {
  async getSavedListingIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map((r) => r.listing_id as string);
  },

  // Delete-first toggle: avoids a read round-trip.
  // Returns true = now saved, false = now unsaved.
  async toggleSavedListing(userId: string, listingId: string): Promise<boolean> {
    const { data: deleted } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .select('listing_id');

    if (deleted && deleted.length > 0) return false;

    await supabase
      .from('saved_listings')
      .insert({ user_id: userId, listing_id: listingId });
    return true;
  },

  async getSavedSellerIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('saved_sellers')
      .select('seller_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map((r) => r.seller_id as string);
  },

  async toggleSavedSeller(userId: string, sellerId: string): Promise<boolean> {
    const { data: deleted } = await supabase
      .from('saved_sellers')
      .delete()
      .eq('user_id', userId)
      .eq('seller_id', sellerId)
      .select('seller_id');

    if (deleted && deleted.length > 0) return false;

    await supabase
      .from('saved_sellers')
      .insert({ user_id: userId, seller_id: sellerId });
    return true;
  },

  async migrateSavedIds(
    userId: string,
    listingIds: string[],
    sellerIds: string[]
  ): Promise<void> {
    const ops: Promise<unknown>[] = [];

    if (listingIds.length > 0) {
      ops.push(
        supabase
          .from('saved_listings')
          .upsert(listingIds.map((id) => ({ user_id: userId, listing_id: id })))
      );
    }
    if (sellerIds.length > 0) {
      ops.push(
        supabase
          .from('saved_sellers')
          .upsert(sellerIds.map((id) => ({ user_id: userId, seller_id: id })))
      );
    }

    await Promise.all(ops);
  },
};
