import { useQuery } from "@tanstack/react-query";

export interface Area {
  id: number; name: string; city: string; lat: number; lng: number;
  avgPricePerSqft: number; valueScore: number; futureScore: number;
  sentiment: string; propertyCount: number; appreciation1y: number; appreciation3y: number;
}

export function useAreas(city = "Chennai") {
  return useQuery<Area[]>({
    queryKey: ["areas", city],
    queryFn: async () => {
      const res = await fetch(`/api/areas?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error("Failed to fetch areas");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
