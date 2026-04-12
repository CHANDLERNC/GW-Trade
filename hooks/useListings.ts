import { useState, useEffect, useCallback } from 'react';
import { listingsService } from '@/services/listings.service';
import { Listing, ListingFilters } from '@/types';

export function useListings(filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = JSON.stringify(filters);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    const { data, error } = await listingsService.getListings(
      JSON.parse(filtersKey) as ListingFilters
    );
    if (error) {
      setError(error.message);
    } else {
      setListings((data as Listing[]) ?? []);
    }
    if (isRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, [filtersKey]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return { listings, loading, refreshing, error, refetch };
}

export function useListing(id: string | undefined) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listingsService.getListing(id).then(({ data, error }) => {
      if (error) setError(error.message);
      else setListing(data as Listing);
      setLoading(false);
    });
  }, [id]);

  return { listing, loading, error };
}
