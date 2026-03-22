import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PropertyMap } from '@/components/map/PropertyMap';
import { useProperties } from '@/hooks/use-properties';
import { usePlaces, useSearch } from '@/hooks/use-places';
import {
  Search, SlidersHorizontal, MapPin, X, Building2, Hospital,
  GraduationCap, TreePine, ShieldAlert, Train, ChevronRight,
  Star, LayoutList, Map, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCompactCurrency } from '@/lib/utils';
import { Link } from 'wouter';

type PropertyType = 'flat' | 'villa' | 'house' | 'plot';
type PropertyValueLabel = 'green' | 'blue' | 'red';

const PLACE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  hospital:        { icon: <Hospital className="w-3.5 h-3.5" />,     color: '#ef4444', label: 'Hospitals' },
  school:          { icon: <GraduationCap className="w-3.5 h-3.5" />, color: '#8b5cf6', label: 'Schools' },
  college:         { icon: <GraduationCap className="w-3.5 h-3.5" />, color: '#6366f1', label: 'Colleges' },
  police_station:  { icon: <ShieldAlert className="w-3.5 h-3.5" />,  color: '#3b82f6', label: 'Police' },
  park:            { icon: <TreePine className="w-3.5 h-3.5" />,      color: '#22c55e', label: 'Parks' },
  metro_station:   { icon: <Train className="w-3.5 h-3.5" />,        color: '#f59e0b', label: 'Metro' },
  mall:            { icon: <Building2 className="w-3.5 h-3.5" />,    color: '#ec4899', label: 'Malls' },
};

export default function Home() {
  const [city] = useState('Chennai');
  const [type, setType] = useState<PropertyType | undefined>(undefined);
  const [valueLabel, setValueLabel] = useState<PropertyValueLabel | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Places layer toggles
  const [activePlaceTypes, setActivePlaceTypes] = useState<Set<string>>(new Set());
  const showPlaces = activePlaceTypes.size > 0;

  // Price range filter
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const { data: properties, isLoading, isError } = useProperties({ city, type, valueLabel, minPrice, maxPrice });
  const { data: places } = usePlaces(city, showPlaces);
  const { data: searchResults } = useSearch(debouncedQ, city);

  const filteredPlaces = useMemo(() => {
    if (!places || activePlaceTypes.size === 0) return [];
    return places.filter(p => activePlaceTypes.has(p.type));
  }, [places, activePlaceTypes]);

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    if (searchInput.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        setDebouncedQ(searchInput.trim());
        setShowDropdown(true);
      }, 300);
    } else {
      setDebouncedQ('');
      setShowDropdown(false);
    }
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSearchSelect(lat: number, lng: number, zoom = 15) {
    setFlyTarget({ lat, lng, zoom });
    setShowDropdown(false);
    setSearchInput('');
    setDebouncedQ('');
  }

  function togglePlaceType(type: string) {
    setActivePlaceTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function resetAll() {
    setType(undefined);
    setValueLabel(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setActivePlaceTypes(new Set());
    setSearchInput('');
  }

  const hasActiveFilters = type || valueLabel || minPrice || maxPrice || activePlaceTypes.size > 0;

  return (
    <AppLayout>
      <div className="relative w-full h-full flex">

        {/* Map / List Area */}
        <div className="flex-1 h-full relative overflow-hidden">

          {/* Map */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'map' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-primary font-medium tracking-widest uppercase text-sm">Initializing Intel Engine...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <p className="text-destructive">Failed to load property data.</p>
              </div>
            ) : (
              <PropertyMap
                properties={properties || []}
                places={filteredPlaces}
                flyTarget={flyTarget}
                onFlyComplete={() => setFlyTarget(null)}
              />
            )}
          </div>

          {/* List View */}
          <div className={`absolute inset-0 overflow-y-auto bg-background transition-opacity duration-300 ${viewMode === 'list' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(properties || []).map(p => (
                <Link key={p.id} href={`/property/${p.id}`}>
                  <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                          p.valueLabel === 'green' ? 'bg-value-green/15 text-value-green' :
                          p.valueLabel === 'blue' ? 'bg-value-blue/15 text-value-blue' :
                          'bg-value-red/15 text-value-red'
                        }`}>
                          {p.valueLabel === 'green' ? 'Good Value' : p.valueLabel === 'blue' ? 'Fair Price' : 'Risky'}
                        </span>
                        <h3 className="font-display font-bold text-foreground text-sm leading-tight">{p.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.area}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-display font-bold text-lg text-foreground">{formatCompactCurrency(p.askingPrice)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {p.areaSqft && <span>{p.areaSqft} sqft</span>}
                      {p.bedrooms ? <span>• {p.bedrooms} beds</span> : null}
                      <span className="ml-auto text-primary group-hover:translate-x-1 transition-transform">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Floating Top Controls */}
          <div className="absolute top-5 left-5 z-[400] flex gap-3 items-start">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`glass-panel p-3 rounded-xl transition-colors flex items-center gap-2 font-medium text-sm ${isFilterOpen ? 'bg-primary/20 text-primary border-primary/30' : 'text-foreground hover:bg-white/10'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
            </button>

            {/* Live Search */}
            <div ref={searchRef} className="relative">
              <div className="glass-panel rounded-xl flex items-center gap-2 px-3 py-2.5 min-w-[260px]">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onFocus={() => debouncedQ && setShowDropdown(true)}
                  placeholder="Search area, locality, landmark..."
                  className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full"
                />
                {searchInput && (
                  <button onClick={() => { setSearchInput(''); setShowDropdown(false); }}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              <AnimatePresence>
                {showDropdown && searchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 w-full min-w-[320px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {searchResults.areas.length > 0 && (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Areas</p>
                        {searchResults.areas.map((a, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearchSelect(a.lat, a.lng, 14)}
                            className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary transition-colors text-left"
                          >
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{a.area}</p>
                              <p className="text-xs text-muted-foreground">{a.city}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.properties.length > 0 && (
                      <div className="px-4 pt-2 pb-3 border-t border-border/50">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Properties</p>
                        {searchResults.properties.map(p => (
                          <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                            onClick={() => handleSearchSelect(p.lat, p.lng, 16)}
                          >
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              p.valueLabel === 'green' ? 'bg-value-green' :
                              p.valueLabel === 'blue' ? 'bg-value-blue' : 'bg-value-red'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.area} • {formatCompactCurrency(p.askingPrice)}</p>
                            </div>
                            <Link href={`/property/${p.id}`}>
                              <span className="text-xs text-primary font-semibold hover:underline flex-shrink-0">Details</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.properties.length === 0 && searchResults.areas.length === 0 && (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        No results for "{debouncedQ}"
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Map / List toggle */}
            <div className="glass-panel rounded-xl flex p-1 gap-1">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Map className="w-3.5 h-3.5" /> Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutList className="w-3.5 h-3.5" /> List
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-5 z-[400] glass-panel p-4 rounded-xl">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2.5">AI Value</h4>
            <div className="space-y-2">
              {[
                { color: 'bg-value-green', label: 'Good Value', glow: 'rgba(52,168,83,0.5)' },
                { color: 'bg-value-blue', label: 'Fair Price', glow: 'rgba(66,133,244,0.5)' },
                { color: 'bg-value-red', label: 'Risky', glow: 'rgba(211,47,47,0.5)' },
              ].map(({ color, label, glow }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} style={{ boxShadow: `0 0 8px ${glow}` }} />
                  <span className="text-xs font-medium text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              className="h-full bg-card border-l border-border flex flex-col z-[500] shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-background/60 flex-shrink-0">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Intel Filters</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="text-primary font-semibold">{properties?.length ?? 0}</span> properties
                  </p>
                </div>
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10">
                      Reset
                    </button>
                  )}
                  <button onClick={() => setIsFilterOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Asset Class */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Asset Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'flat', icon: '🏢', label: 'Flat' },
                      { val: 'villa', icon: '🏡', label: 'Villa' },
                      { val: 'house', icon: '🏠', label: 'House' },
                      { val: 'plot', icon: '🌿', label: 'Plot' },
                    ].map(({ val, icon, label }) => (
                      <button
                        key={val}
                        onClick={() => setType(type === val ? undefined : val as PropertyType)}
                        className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                          type === val
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <span>{icon}</span><span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Outlook */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">AI Outlook</label>
                  <div className="space-y-2">
                    {[
                      { val: 'green', label: 'Good Value / Underpriced', dot: 'bg-value-green', textColor: 'text-value-green' },
                      { val: 'blue', label: 'Fair Market Price', dot: 'bg-value-blue', textColor: 'text-value-blue' },
                      { val: 'red', label: 'Risky / Overpriced', dot: 'bg-value-red', textColor: 'text-value-red' },
                    ].map(item => (
                      <button
                        key={item.val}
                        onClick={() => setValueLabel(valueLabel === item.val ? undefined : item.val as PropertyValueLabel)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          valueLabel === item.val
                            ? 'bg-secondary border-border/80 text-foreground'
                            : 'bg-background border-border text-muted-foreground hover:bg-secondary/40'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${item.dot} flex-shrink-0`} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {valueLabel === item.val && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Budget Range</label>
                  <div className="space-y-2">
                    {[
                      { label: 'Under ₹50L', min: undefined, max: 5000000 },
                      { label: '₹50L – ₹1Cr', min: 5000000, max: 10000000 },
                      { label: '₹1Cr – ₹2Cr', min: 10000000, max: 20000000 },
                      { label: '₹2Cr – ₹5Cr', min: 20000000, max: 50000000 },
                      { label: 'Above ₹5Cr', min: 50000000, max: undefined },
                    ].map(range => {
                      const active = minPrice === range.min && maxPrice === range.max;
                      return (
                        <button
                          key={range.label}
                          onClick={() => {
                            if (active) { setMinPrice(undefined); setMaxPrice(undefined); }
                            else { setMinPrice(range.min); setMaxPrice(range.max); }
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            active
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'bg-background border-border text-muted-foreground hover:bg-secondary/40'
                          }`}
                        >
                          {range.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nearby Places Layer */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Nearby Places on Map
                  </label>
                  <p className="text-[11px] text-muted-foreground mb-3">Toggle layers to see value-impacting amenities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PLACE_TYPE_CONFIG).map(([key, cfg]) => {
                      const active = activePlaceTypes.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => togglePlaceType(key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            active ? 'border-2 text-foreground bg-secondary' : 'bg-background border-border text-muted-foreground hover:bg-secondary/40'
                          }`}
                          style={active ? { borderColor: cfg.color, color: cfg.color } : {}}
                        >
                          <span style={active ? { color: cfg.color } : {}}>{cfg.icon}</span>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  {showPlaces && (
                    <div className="mt-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" />
                        {filteredPlaces.length} places visible. Hover to see ratings.
                      </p>
                    </div>
                  )}
                </div>

                {/* Property Score Guide */}
                <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-primary" /> How Value Is Calculated
                  </h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex gap-2"><span className="text-value-green font-semibold">+</span>Hospital &amp; school density</div>
                    <div className="flex gap-2"><span className="text-value-green font-semibold">+</span>Metro / rail access</div>
                    <div className="flex gap-2"><span className="text-value-green font-semibold">+</span>IT park proximity</div>
                    <div className="flex gap-2"><span className="text-value-green font-semibold">+</span>Infrastructure news sentiment</div>
                    <div className="flex gap-2"><span className="text-value-red font-semibold">–</span>Flood / legal risk zones</div>
                    <div className="flex gap-2"><span className="text-value-red font-semibold">–</span>Unverified documents</div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
