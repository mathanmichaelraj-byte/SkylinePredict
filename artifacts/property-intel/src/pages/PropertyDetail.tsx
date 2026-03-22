import React, { useMemo } from 'react';
import { useRoute } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyDetail } from '@/hooks/use-properties';
import { usePlaces } from '@/hooks/use-places';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import { ValueBadge } from '@/components/ValueBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import {
  MapPin, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Train, GraduationCap, Hospital, Building, ShoppingBag, Car, Map as MapIcon,
  ShieldCheck, AlertCircle, ArrowLeft, ArrowRight, Star, Shield, Leaf, Activity
} from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

const LandmarkIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'metro': return <Train className="w-4 h-4" />;
    case 'school': return <GraduationCap className="w-4 h-4" />;
    case 'hospital': return <Hospital className="w-4 h-4" />;
    case 'it_park': return <Building className="w-4 h-4" />;
    case 'mall': return <ShoppingBag className="w-4 h-4" />;
    case 'bus_stop': return <Car className="w-4 h-4" />;
    default: return <MapIcon className="w-4 h-4" />;
  }
};

// Haversine distance
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function PropertyDetail() {
  const [, params] = useRoute('/property/:id');
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: property, isLoading, isError } = usePropertyDetail(id);
  const { data: allPlaces } = usePlaces('Chennai', !!property);

  // Find nearby places within 3km
  const nearbyPlaces = useMemo(() => {
    if (!property || !allPlaces) return { hospital: [], school: [], college: [], police_station: [], park: [], metro_station: [] };
    const result: Record<string, typeof allPlaces> = { hospital: [], school: [], college: [], police_station: [], park: [], metro_station: [] };
    for (const place of allPlaces) {
      const dist = haversineKm(property.lat, property.lng, place.lat, place.lng);
      if (dist <= 5 && result[place.type]) {
        result[place.type].push({ ...place, _dist: dist } as any);
      }
    }
    // Sort each by distance
    Object.keys(result).forEach(k => result[k].sort((a: any, b: any) => a._dist - b._dist));
    return result;
  }, [property, allPlaces]);

  // Surrounding score 0–100
  const surroundingScore = useMemo(() => {
    const h = Math.min(nearbyPlaces.hospital.length, 3) * 10;
    const s = Math.min(nearbyPlaces.school.length + nearbyPlaces.college.length, 4) * 8;
    const p = Math.min(nearbyPlaces.police_station.length, 2) * 8;
    const pk = Math.min(nearbyPlaces.park.length, 2) * 7;
    const m = Math.min(nearbyPlaces.metro_station.length, 2) * 7;
    return Math.min(h + s + p + pk + m + 30, 100);
  }, [nearbyPlaces]);

  // Future price projection (next 12 months)
  const priceChartData = useMemo(() => {
    if (!property) return [];
    const hist = (property.priceHistory || []).map((d: any) => ({ ...d, type: 'historical' }));
    if (hist.length === 0) return [];

    const lastPrice = hist[hist.length - 1].pricePerSqft;
    const growthRate = property.futureOutlook === 'high' ? 0.013 : property.futureOutlook === 'medium' ? 0.007 : 0.002;

    const futureMonths = ["Mar'26","Apr'26","May'26","Jun'26","Jul'26","Aug'26","Sep'26","Oct'26","Nov'26","Dec'26","Jan'27","Feb'27"];
    const projections = futureMonths.map((month, i) => ({
      month,
      pricePerSqft: undefined,
      projected: Math.round(lastPrice * Math.pow(1 + growthRate, i + 1)),
      type: 'projected',
    }));

    return [...hist.map((d: any) => ({ ...d, projected: undefined })), ...projections];
  }, [property]);

  const projectedPrice1Y = useMemo(() => {
    if (!property?.pricePerSqft) return 0;
    const r = property.futureOutlook === 'high' ? 0.013 : property.futureOutlook === 'medium' ? 0.007 : 0.002;
    return Math.round(property.pricePerSqft * Math.pow(1 + r, 12));
  }, [property]);

  const projectedTotal1Y = useMemo(() => {
    if (!property) return 0;
    return Math.round(property.askingPrice * (1 + (projectedPrice1Y - property.pricePerSqft) / property.pricePerSqft));
  }, [property, projectedPrice1Y]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <Building className="w-12 h-12 text-primary mb-4 opacity-50" />
            <p className="text-muted-foreground font-display text-xl">Loading Property Intel...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !property) {
    return (
      <AppLayout>
        <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Asset Not Found</h2>
          <p className="text-muted-foreground mb-6">The property data you are looking for is unavailable.</p>
          <Link href="/"><button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">Return to Map</button></Link>
        </div>
      </AppLayout>
    );
  }

  const isOverpriced = property.askingPrice > property.fairPriceMax;
  const isUnderpriced = property.askingPrice < property.fairPriceMin;
  const priceGapPercent = ((property.askingPrice - property.fairPriceMax) / property.fairPriceMax) * 100;

  return (
    <AppLayout>
      <div className="w-full h-full overflow-y-auto pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4" /> Intel Map
            </button>
          </Link>
          <div className="flex gap-3 items-center">
            {property.verificationStatus === 'verified' && (
              <Badge variant="outline" className="bg-value-green/5 border-value-green/20 text-value-green">
                <ShieldCheck className="w-3 h-3 mr-1.5" /> Verified
              </Badge>
            )}
            <ValueBadge label={property.valueLabel} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

          {/* Hero + Pricing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative h-[360px] rounded-3xl overflow-hidden shadow-2xl group bg-secondary">
              <div className="w-full h-full flex items-center justify-center">
                <Building className="w-24 h-24 text-muted-foreground/20" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-8 left-8 pr-8">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                  <MapPin className="w-4 h-4" />{property.area}, {property.city}
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-3">{property.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm font-medium">
                  <span className="capitalize px-3 py-1 bg-secondary/80 rounded-lg">{property.type}</span>
                  <span>{property.areaSqft} sqft</span>
                  {property.bedrooms && <span>{property.bedrooms} Beds</span>}
                  {property.yearBuilt && <span>Built {property.yearBuilt}</span>}
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-b from-card to-background border border-border rounded-3xl p-7 flex flex-col shadow-xl"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Financial Assessment</h3>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Asking Price</p>
                <div className="text-3xl font-display font-bold text-foreground">{formatCurrency(property.askingPrice)}</div>
                <p className="text-sm text-primary mt-1 font-medium">{formatCurrency(property.pricePerSqft)} / sqft</p>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 mb-5">
                <p className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                  AI Fair Value Range <TrendingUp className="w-4 h-4" />
                </p>
                <div className="font-display text-lg font-bold text-foreground">
                  {formatCompactCurrency(property.fairPriceMin)} – {formatCompactCurrency(property.fairPriceMax)}
                </div>
                <div className="mt-3">
                  {isOverpriced ? (
                    <div className="flex items-start gap-2 text-value-red bg-value-red/10 p-3 rounded-xl border border-value-red/20 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{Math.abs(priceGapPercent).toFixed(1)}% above fair value. Strong negotiation leverage.</span>
                    </div>
                  ) : isUnderpriced ? (
                    <div className="flex items-start gap-2 text-value-green bg-value-green/10 p-3 rounded-xl border border-value-green/20 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Priced below fair market. Excellent ROI potential.</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-value-blue bg-value-blue/10 p-3 rounded-xl border border-value-blue/20 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Fairly priced within market expectations.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Year Projection */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
                <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">1-Year Projected Value</p>
                <div className="font-display text-xl font-bold text-primary">{formatCompactCurrency(projectedTotal1Y)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₹{projectedPrice1Y}/sqft · {property.futureOutlook.toUpperCase()} growth outlook
                </p>
              </div>

              <button className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm mt-auto">
                Contact Seller / Agent
              </button>
            </motion.div>
          </div>

          {/* Score Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Value Score', value: `${property.valueScore}/10`, icon: <Star className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Connectivity', value: `${property.connectivityScore}/10`, icon: <Train className="w-5 h-5" />, color: 'text-value-blue', bg: 'bg-value-blue/10' },
              { label: 'Surrounding', value: `${surroundingScore}/100`, icon: <Leaf className="w-5 h-5" />, color: 'text-value-green', bg: 'bg-value-green/10' },
              { label: 'Future Outlook', value: property.futureOutlook.toUpperCase(), icon: <Activity className="w-5 h-5" />, color: property.futureOutlook === 'high' ? 'text-value-green' : property.futureOutlook === 'medium' ? 'text-value-blue' : 'text-value-red', bg: property.futureOutlook === 'high' ? 'bg-value-green/10' : property.futureOutlook === 'medium' ? 'bg-value-blue/10' : 'bg-value-red/10' },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>{icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                  <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Investment Outlook */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Investment Outlook</CardTitle>
                  <Badge variant="outline" className="capitalize bg-secondary">{property.futureOutlook} Potential</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {property.investmentFactors.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-value-green mb-3">
                      <TrendingUp className="w-4 h-4" /> Growth Catalysts
                    </h4>
                    <ul className="space-y-2.5">
                      {property.investmentFactors.map((factor: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-value-green mt-1.5 flex-shrink-0" />{factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {property.riskFactors.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-value-red mb-3">
                      <TrendingDown className="w-4 h-4" /> Risk Factors
                    </h4>
                    <ul className="space-y-2.5">
                      {property.riskFactors.map((factor: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-value-red mt-1.5 flex-shrink-0" />{factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Surrounding Amenities */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Surrounding Amenities</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-primary">{surroundingScore}<span className="text-base text-muted-foreground">/100</span></div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Area Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: 'hospital', emoji: '🏥', label: 'Hospitals', color: '#ef4444' },
                    { key: 'school', emoji: '🏫', label: 'Schools', color: '#8b5cf6' },
                    { key: 'college', emoji: '🎓', label: 'Colleges', color: '#6366f1' },
                    { key: 'police_station', emoji: '🚔', label: 'Police Stations', color: '#3b82f6' },
                    { key: 'park', emoji: '🌳', label: 'Parks', color: '#22c55e' },
                    { key: 'metro_station', emoji: '🚇', label: 'Metro Stations', color: '#f59e0b' },
                  ].map(({ key, emoji, label, color }) => {
                    const items = (nearbyPlaces[key] || []) as any[];
                    const count = items.length;
                    const nearest = items[0];
                    return (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                        <span className="text-xl">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{label}</p>
                          {nearest ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {nearest.name} · {nearest._dist?.toFixed(1)} km
                              {nearest.rating ? ` · ★ ${nearest.rating}` : ''}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">None within 5km</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold" style={{ color: count > 0 ? color : '#6b7280' }}>{count}</span>
                          <p className="text-[10px] text-muted-foreground">within 5km</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Price History + Future Projection Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Trend + Future Projection (₹/sqft)</CardTitle>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-8 h-0.5 bg-primary inline-block rounded" /> Historical</span>
                    <span className="flex items-center gap-1.5"><span className="w-8 h-0.5 border-t-2 border-dashed border-primary/60 inline-block" /> Projected</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Projection Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Current ₹/sqft</p>
                    <p className="font-bold text-foreground">₹{property.pricePerSqft.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">1Y Projected ₹/sqft</p>
                    <p className="font-bold text-primary">₹{projectedPrice1Y.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${
                    property.futureOutlook === 'high' ? 'bg-value-green/10 border border-value-green/20' :
                    property.futureOutlook === 'medium' ? 'bg-value-blue/10 border border-value-blue/20' :
                    'bg-value-red/10 border border-value-red/20'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">Est. Annual Growth</p>
                    <p className="font-bold" style={{ color: property.futureOutlook === 'high' ? '#22c55e' : property.futureOutlook === 'medium' ? '#3b82f6' : '#ef4444' }}>
                      {property.futureOutlook === 'high' ? '~15.6%' : property.futureOutlook === 'medium' ? '~8.4%' : '~2.4%'}
                    </p>
                  </div>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dy={8} interval={2} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }}
                        formatter={(value: any, name: string) => [value ? `₹${Number(value).toLocaleString()}` : '—', name === 'pricePerSqft' ? 'Historical' : 'Projected']}
                      />
                      <ReferenceLine x="Feb'26" stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Today', fill: 'hsl(var(--primary))', fontSize: 10 }} />
                      <Area type="monotone" dataKey="pricePerSqft" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#histGrad)" connectNulls={false} dot={false} activeDot={{ r: 5, fill: 'hsl(var(--primary))' }} />
                      <Area type="monotone" dataKey="projected" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="6 3" strokeOpacity={0.7} fill="url(#projGrad)" connectNulls={false} dot={false} activeDot={{ r: 4, fill: 'hsl(var(--primary))', strokeDasharray: '0' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Connectivity Ecosystem */}
            {property.landmarks.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Hyperlocal Ecosystem</CardTitle>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold text-primary">{property.connectivityScore}<span className="text-base text-muted-foreground">/10</span></span>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Connectivity</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {property.landmarks.map((lm: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary border border-border">
                            <LandmarkIcon type={lm.type} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{lm.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{lm.type.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium bg-background px-3 py-1 rounded-full border border-border">{lm.distanceKm} km</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* News Sentiment */}
            <Card className={`${property.landmarks.length > 0 ? '' : 'md:col-span-2'} bg-gradient-to-r from-card to-secondary/20`}>
              <CardContent className="p-7">
                <div className="flex flex-col md:flex-row gap-7 items-start">
                  <div className="w-full md:w-1/3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Area Sentiment Intel</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3.5 rounded-2xl ${
                        property.newsSentiment === 'positive' ? 'bg-value-green/10 text-value-green' :
                        property.newsSentiment === 'negative' ? 'bg-value-red/10 text-value-red' :
                        'bg-value-blue/10 text-value-blue'
                      }`}>
                        {property.newsSentiment === 'positive' ? <TrendingUp className="w-7 h-7" /> :
                         property.newsSentiment === 'negative' ? <TrendingDown className="w-7 h-7" /> :
                         <Minus className="w-7 h-7" />}
                      </div>
                      <div>
                        <p className="text-xl font-display font-bold capitalize text-foreground">{property.newsSentiment}</p>
                        <p className="text-xs text-muted-foreground">News signal</p>
                      </div>
                    </div>
                    <Link href="/news">
                      <button className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                        View All News <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                  <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-7">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Recent Signals</h4>
                    <div className="space-y-3">
                      {property.newsHeadlines.map((headline: string, i: number) => (
                        <div key={i} className="p-3.5 bg-background/60 rounded-xl border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
                          "{headline}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
