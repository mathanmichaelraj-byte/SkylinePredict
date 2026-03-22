import { useQuery } from "@tanstack/react-query";

export interface NewsArticle {
  id: number; title: string; source: string; area: string;
  city: string; sentiment: string; topic: string; summary?: string;
}

export function useNews(params?: Record<string, any>) {
  const query = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return useQuery<NewsArticle[]>({
    queryKey: ["news", params],
    queryFn: async () => {
      const res = await fetch(`/api/news?${query}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
