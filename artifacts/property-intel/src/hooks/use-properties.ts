import { useQuery } from "@tanstack/react-query";

export interface Property {
  id: number; title: string; address: string; area: string; city: string;
  lat: number; lng: number; type: string; areaSqft: number;
  bedrooms?: number; bathrooms?: number; askingPrice: number;
  fairPriceMin: number; fairPriceMax: number; pricePerSqft: number;
  valueLabel: string; valueScore: number; futureOutlook: string;
  connectivityScore: number; verificationStatus: string;
  yearBuilt?: number; description: string; imageUrl?: string;
}

export function useProperties(params?: Record<string, any>) {
  const query = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return useQuery<Property[]>({
    queryKey: ["properties", params],
    queryFn: async () => {
      const res = await fetch(`/api/properties?${query}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePropertyDetail(id: number) {
  return useQuery<Property>({
    queryKey: ["property", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error("Failed to fetch property");
      return res.json();
    },
    enabled: !isNaN(id) && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}
