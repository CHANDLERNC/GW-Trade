import { useState, useEffect } from 'react';
import { listingsService } from '@/services/listings.service';
import { Listing, ListingFilters } from '@/types';
import { useQuery } from '@/hooks/useQuery';

export function useListings(filters: ListingFilters = {}) {
  const filtersKey = JSON.stringify(filters);
  const { data: listings, loading, refreshing, error, refetch } = useQuery<Listing>(
    () => listingsService.getListings(JSON.parse(filtersKey) as ListingFilters),
    [filtersKey]
  );
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
