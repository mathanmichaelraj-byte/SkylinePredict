import React from 'react';
import { Link, useLocation } from 'wouter';
import { Map, Activity, Newspaper, Building, ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/', label: 'Intelligence Map', icon: Map },
  { path: '/analytics', label: 'Price Analytics', icon: BarChart3 },
  { path: '/areas', label: 'Area Rankings', icon: Activity },
  { path: '/news', label: 'Market Signals', icon: Newspaper },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card/50 backdrop-blur-xl z-50 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Building className="w-5 h-5 text-background" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl leading-none text-foreground tracking-wide">PropertyIntel</span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-semibold mt-1">Intelligence</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <div className="px-2 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} className="block relative">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-medium",
                  isActive 
                    ? "text-primary bg-primary/10 shadow-inner" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors", 
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-border/50">
          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-2">Data Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-value-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-value-green"></span>
              </span>
              <span className="text-sm font-medium text-foreground">Live Updates Syncing</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        {/* Top Header (Optional, for context) */}
        {location !== '/' && (
           <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-8 z-40 sticky top-0">
             <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-foreground font-medium capitalize">
                  {location.split('/')[1] || 'Dashboard'}
                </span>
             </div>
           </header>
        )}
        
        <div className={cn("flex-1 h-full", location !== '/' && "overflow-y-auto")}>
          {children}
        </div>
      </main>
    </div>
  );
}
