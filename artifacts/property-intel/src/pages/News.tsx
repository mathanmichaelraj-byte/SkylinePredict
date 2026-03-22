import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNews } from '@/hooks/use-news';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Newspaper, ExternalLink, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

type Topic = 'all' | 'infra' | 'policy' | 'jobs' | 'environment' | 'legal' | 'development' | 'business' | 'market';

export default function News() {
  const { data: news, isLoading } = useNews();
  const [filterTopic, setFilterTopic] = useState<Topic>('all');

  const topics: Topic[] = ['all', 'infra', 'policy', 'jobs', 'environment', 'legal', 'development', 'business', 'market'];

  const filteredNews = filterTopic === 'all' ? news : news?.filter((n: any) => n.topic === filterTopic);

  return (
    <AppLayout>
      <div className="w-full h-full p-8 max-w-6xl mx-auto flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-border/50 pb-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Newspaper className="w-6 h-6" /></div>
              Market Signals
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Real-time intelligence from news and policy changes affecting real estate valuations.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filter by Catalyst
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map(t => (
                <button key={t} onClick={() => setFilterTopic(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize border ${
                    filterTopic === t
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-secondary rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-secondary rounded w-full mb-2"></div>
                  <div className="h-4 bg-secondary rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredNews?.map((article: any, i: number) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} key={article.id}
              >
                <Card className="hover:border-primary/50 transition-colors group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        <Badge variant={article.sentiment === 'positive' ? 'green' : article.sentiment === 'negative' ? 'red' : 'blue'}
                          className="uppercase tracking-widest text-[10px]">{article.sentiment}</Badge>
                        <Badge variant="outline" className="uppercase tracking-widest text-[10px] bg-secondary/50">{article.topic}</Badge>
                      </div>
                      {article.area && <span className="text-xs text-muted-foreground">{article.area}</span>}
                    </div>

                    <h3 className="text-xl font-display font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>

                    {article.summary && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{article.summary}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                        Source: {article.source}
                      </div>
                      <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        Read Source Analysis <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
          {filteredNews?.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">No signals found for this category.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
