import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAreas } from '@/hooks/use-areas';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';

type Sentiment = 'positive' | 'neutral' | 'negative';

const SentimentBadge = ({ sentiment }: { sentiment: Sentiment }) => {
  if (sentiment === 'positive') return <Badge variant="green" className="w-24 justify-center">Positive</Badge>;
  if (sentiment === 'negative') return <Badge variant="red" className="w-24 justify-center">Negative</Badge>;
  return <Badge variant="blue" className="w-24 justify-center">Neutral</Badge>;
};

export default function Areas() {
  const [search, setSearch] = useState('');
  const { data: areas, isLoading } = useAreas();

  const filteredAreas = areas?.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="w-full h-full p-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Area Analytics</h1>
            <p className="text-muted-foreground mt-1">Compare macro-level data and future appreciation metrics across regions.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search areas..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-secondary/20">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Locale</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Price / Sqft</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground group">
                    <div className="flex items-center gap-1">1Y Appr <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground group">
                    <div className="flex items-center gap-1">3Y Appr <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value Score</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Future Score</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[32, 20, 12, 12, 16, 16, 24].map((w, j) => (
                        <td key={j} className="p-4"><div className={`h-4 bg-secondary rounded w-${w}`}></div></td>
                      ))}
                    </tr>
                  ))
                ) : filteredAreas?.map((area: any, i: number) => (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} key={area.id}
                    className="hover:bg-secondary/30 transition-colors cursor-default"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{area.name}</div>
                      <div className="text-xs text-muted-foreground">{area.city} • {area.propertyCount} listings</div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{formatCurrency(area.avgPricePerSqft)}</td>
                    {[area.appreciation1y, area.appreciation3y].map((val, j) => (
                      <td key={j} className="p-4">
                        <div className={`flex items-center gap-1 font-semibold ${val >= 0 ? 'text-value-green' : 'text-value-red'}`}>
                          {val >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(val)}%
                        </div>
                      </td>
                    ))}
                    {[area.valueScore, area.futureScore].map((score, j) => (
                      <td key={j} className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-1.5 max-w-[60px]">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${score * 10}%` }}></div>
                          </div>
                          <span className="text-sm font-medium text-foreground">{score}/10</span>
                        </div>
                      </td>
                    ))}
                    <td className="p-4 text-center"><SentimentBadge sentiment={area.sentiment} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredAreas?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">No areas found matching your criteria.</div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
