import { useQuery } from "@tanstack/react-query";

export interface Place {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  area: string;
  city: string;
  rating?: number;
  ratingCount?: number;
  address?: string;
}

export function usePlaces(city = "Chennai", enabled = true) {
  return useQuery<Place[]>({
    queryKey: ["places", city],
    queryFn: async () => {
      const res = await fetch(`/api/places?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error("Failed to fetch places");
      return res.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export interface SearchResult {
  properties: Array<{ id: number; title: string; area: string; city: string; lat: number; lng: number; askingPrice: number; valueLabel: string; type: string }>;
  areas: Array<{ area: string; city: string; lat: number; lng: number }>;
}

export function useSearch(q: string, city = "Chennai") {
  return useQuery<SearchResult>({
    queryKey: ["search", q, city],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: q.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
