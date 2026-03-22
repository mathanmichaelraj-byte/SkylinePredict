import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Search, MapPin, Calendar, Home,
  ChevronDown, CheckCircle2, AlertTriangle, Minus, Sparkles,
  Building2, BarChart3, Info, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';

const AREA_SUGGESTIONS = [
  "OMR – Perungudi", "Sholinganallur", "Siruseri", "Kelambakkam", "Perungalathur",
  "Velachery", "Pallikaranai", "Medavakkam", "Thoraipakkam", "Navalur",
  "Anna Nagar", "Adyar", "T Nagar", "Mylapore", "Nungambakkam",
  "Porur", "Ambattur", "Mogappair", "Avadi", "Poonamallee",
  "Tambaram", "Chromepet", "Pallavaram", "Perambur", "ECR",
  "Guindy", "Kodambakkam", "Virugambakkam", "Vadapalani",
];

const PROPERTY_TYPES = [
  { val: 'flat', icon: '🏢', label: 'Apartment / Flat' },
  { val: 'villa', icon: '🏡', label: 'Villa / Row House' },
  { val: 'house', icon: '🏠', label: 'Independent House' },
  { val: 'plot', icon: '🌿', label: 'Land / Plot' },
];

const CURRENT_YEAR = 2026;
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR + i);

interface Prediction {
  area: string; city: string; propertyType: string;
  currentYear: number; targetYear: number; yearsAhead: number;
  basePricePerSqft: number; targetPricePerSqft: number;
  targetOptimisticPsqft: number; targetConservativePsqft: number;
  targetBaseTotal?: number; targetOptimisticTotal?: number; targetConservativeTotal?: number;
  baseAnnualGrowthRate: number; optimisticAnnualGrowthRate: number; conservativeAnnualGrowthRate: number;
  amenityScore: number; futurePotentialScore: number; areaSentiment: string;
  projections: Array<{
    year: number; optimisticPsqft: number; basePsqft: number; conservativePsqft: number;
    optimisticTotal?: number; baseTotal?: number; conservativeTotal?: number;
  }>;
  drivers: Array<{ factor: string; impact: string; effect: string }>;
  areaSqft?: number;
}

export default function PriceAnalytics() {
  const [areaInput, setAreaInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [targetYear, setTargetYear] = useState(2030);
  const [propertyType, setPropertyType] = useState('flat');
  const [areaSqft, setAreaSqft] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() =>
    AREA_SUGGESTIONS.filter(a => a.toLowerCase().includes(areaInput.toLowerCase())).slice(0, 8),
    [areaInput]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handlePredict() {
    const area = selectedArea || areaInput;
    if (!area.trim()) { setError('Please enter or select an area.'); return; }
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        area: area.trim(),
        target_year: String(targetYear),
        city: 'Chennai',
        property_type: propertyType,
        ...(areaSqft ? { area_sqft: areaSqft } : {}),
      });
      const res = await fetch(`/api/predict?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Prediction failed');
      }
      const data: Prediction = await res.json();
      setPrediction(data);
    } catch (e: any) {
      setError(e.message || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const gainPercent = prediction
    ? ((prediction.targetPricePerSqft - prediction.basePricePerSqft) / prediction.basePricePerSqft) * 100
    : 0;

  return (
    <AppLayout>
      <div className="w-full h-full overflow-y-auto">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-background via-primary/5 to-background border-b border-border px-8 py-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative max-w-5xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Price Analytics Engine</h1>
                <p className="text-sm text-muted-foreground mt-0.5">AI-powered property value prediction for Chennai real estate</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-4 max-w-2xl leading-relaxed">
              Enter any Chennai area, select a target year, and our model uses historical appreciation, 
              amenity density, infrastructure pipeline, and news sentiment to predict future property values 
              with optimistic / base / conservative scenarios.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Input Form */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-xl mb-8">
            <h2 className="text-lg font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Configure Prediction
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Area Search */}
              <div ref={searchRef} className="relative lg:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Area / Locality</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={areaInput}
                    onChange={e => { setAreaInput(e.target.value); setSelectedArea(''); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="e.g. OMR, Siruseri..."
                    className="w-full pl-9 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <AnimatePresence>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {filteredSuggestions.map(area => (
                        <button key={area} onClick={() => { setAreaInput(area); setSelectedArea(area); setShowSuggestions(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-secondary transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{area}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Target Year */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Target Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={targetYear}
                    onChange={e => setTargetYear(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary/50 appearance-none cursor-pointer"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y} ({y - CURRENT_YEAR === 0 ? 'Now' : `+${y - CURRENT_YEAR}yr`})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Property Type</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={propertyType}
                    onChange={e => setPropertyType(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary/50 appearance-none cursor-pointer"
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t.val} value={t.val}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Area Sqft (optional) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Area (sqft) <span className="text-muted-foreground/50 normal-case font-normal">— optional</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={areaSqft}
                    onChange={e => setAreaSqft(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full pl-9 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl border border-destructive/20">{error}</p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handlePredict}
                disabled={loading}
                className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2.5 text-sm"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Predict Property Value</>
                )}
              </button>
              {prediction && (
                <p className="text-xs text-muted-foreground">
                  Predicted for <span className="text-foreground font-semibold">{prediction.area}</span> · {prediction.targetYear}
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {prediction && (
              <motion.div
                key={`${prediction.area}-${prediction.targetYear}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Current Price */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Current ({prediction.currentYear})</p>
                    <p className="text-2xl font-display font-bold text-foreground">₹{prediction.basePricePerSqft.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">per sqft</p>
                    {prediction.areaSqft && (
                      <p className="text-xs text-primary font-medium mt-1.5">
                        Total: {formatCompactCurrency(prediction.basePricePerSqft * prediction.areaSqft)}
                      </p>
                    )}
                  </div>

                  {/* Base Prediction */}
                  <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-3xl" />
                    <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-2">Base ({prediction.targetYear})</p>
                    <p className="text-2xl font-display font-bold text-primary">₹{prediction.targetPricePerSqft.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">per sqft</p>
                    {prediction.targetBaseTotal && (
                      <p className="text-xs text-primary font-medium mt-1.5">
                        Total: {formatCompactCurrency(prediction.targetBaseTotal)}
                      </p>
                    )}
                  </div>

                  {/* Gain */}
                  <div className={`rounded-2xl p-5 border ${gainPercent >= 0 ? 'bg-value-green/5 border-value-green/20' : 'bg-value-red/5 border-value-red/20'}`}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Total Gain</p>
                    <div className={`flex items-center gap-1.5 ${gainPercent >= 0 ? 'text-value-green' : 'text-value-red'}`}>
                      {gainPercent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      <span className="text-2xl font-display font-bold">{Math.abs(gainPercent).toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">over {prediction.yearsAhead} year{prediction.yearsAhead !== 1 ? 's' : ''}</p>
                    <p className="text-xs font-medium mt-1.5" style={{ color: gainPercent >= 0 ? '#22c55e' : '#ef4444' }}>
                      {prediction.baseAnnualGrowthRate.toFixed(1)}% p.a.
                    </p>
                  </div>

                  {/* Amenity Score */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Amenity Score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-display font-bold text-foreground">{prediction.amenityScore}</span>
                      <span className="text-sm text-muted-foreground mb-0.5">/ 30</span>
                    </div>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(prediction.amenityScore / 30) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Sentiment: <span className={`font-semibold capitalize ${prediction.areaSentiment === 'positive' ? 'text-value-green' : prediction.areaSentiment === 'negative' ? 'text-value-red' : 'text-value-blue'}`}>{prediction.areaSentiment}</span>
                    </p>
                  </div>
                </div>

                {/* Main Chart */}
                <div className="bg-card border border-border rounded-3xl p-7">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground">Price Projection: {prediction.area}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 capitalize">{prediction.propertyType} · {prediction.currentYear} → {prediction.targetYear}</p>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-medium">
                      <span className="flex items-center gap-1.5"><span className="w-8 h-1 bg-value-green rounded-full inline-block" /> Optimistic ({prediction.optimisticAnnualGrowthRate.toFixed(1)}% p.a.)</span>
                      <span className="flex items-center gap-1.5"><span className="w-8 h-1 bg-primary rounded-full inline-block" /> Base ({prediction.baseAnnualGrowthRate.toFixed(1)}% p.a.)</span>
                      <span className="flex items-center gap-1.5"><span className="w-8 h-1 bg-value-red/70 rounded-full inline-block" /> Conservative ({prediction.conservativeAnnualGrowthRate.toFixed(1)}% p.a.)</span>
                    </div>
                  </div>

                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={prediction.projections} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }}
                          formatter={(value: any, name: string) => [
                            `₹${Number(value).toLocaleString()}/sqft`,
                            name === 'optimisticPsqft' ? 'Optimistic' : name === 'basePsqft' ? 'Base' : 'Conservative'
                          ]}
                          labelFormatter={v => `Year ${v}`}
                        />
                        <ReferenceLine x={CURRENT_YEAR} stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: 'Now', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        {prediction.targetYear !== CURRENT_YEAR && (
                          <ReferenceLine x={prediction.targetYear} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: 'Target', fill: '#f59e0b', fontSize: 10 }} />
                        )}
                        <Area type="monotone" dataKey="optimisticPsqft" name="optimisticPsqft" stroke="#22c55e" strokeWidth={2} fill="url(#optGrad)" dot={false} activeDot={{ r: 5 }} />
                        <Area type="monotone" dataKey="basePsqft" name="basePsqft" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#baseGrad)" dot={false} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                        <Area type="monotone" dataKey="conservativePsqft" name="conservativePsqft" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.7} fill="url(#consGrad)" dot={false} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* If sqft provided, show total value chart */}
                  {prediction.areaSqft && prediction.projections[0]?.baseTotal && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4">Total Property Value (for {prediction.areaSqft.toLocaleString()} sqft)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[prediction.currentYear, ...YEARS.filter(y => y > prediction.currentYear && y <= prediction.targetYear && (y - prediction.currentYear) % Math.ceil(prediction.yearsAhead / 3) === 0), prediction.targetYear]
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .map(year => {
                            const proj = prediction.projections.find(p => p.year === year);
                            if (!proj) return null;
                            return (
                              <div key={year} className={`rounded-xl p-3 border text-center ${year === prediction.targetYear ? 'bg-primary/10 border-primary/30' : 'bg-secondary/30 border-border/50'}`}>
                                <p className="text-xs text-muted-foreground mb-1">{year}</p>
                                <p className={`font-bold text-sm ${year === prediction.targetYear ? 'text-primary' : 'text-foreground'}`}>
                                  {proj.baseTotal ? formatCompactCurrency(proj.baseTotal) : '—'}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3-Scenario Table + Drivers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scenario Comparison */}
                  <div className="bg-card border border-border rounded-3xl p-7">
                    <h3 className="text-base font-display font-bold text-foreground mb-5">3-Scenario Outlook ({prediction.targetYear})</h3>
                    <div className="space-y-4">
                      {[
                        {
                          label: 'Optimistic', icon: <TrendingUp className="w-4 h-4" />, color: 'text-value-green',
                          bg: 'bg-value-green/10 border-value-green/20',
                          psqft: prediction.targetOptimisticPsqft,
                          total: prediction.targetOptimisticTotal,
                          rate: prediction.optimisticAnnualGrowthRate,
                          desc: 'Best-case: all infra projects complete, strong IT demand'
                        },
                        {
                          label: 'Base', icon: <Activity className="w-4 h-4" />, color: 'text-primary',
                          bg: 'bg-primary/10 border-primary/20',
                          psqft: prediction.targetPricePerSqft,
                          total: prediction.targetBaseTotal,
                          rate: prediction.baseAnnualGrowthRate,
                          desc: 'Most likely scenario based on historical trends'
                        },
                        {
                          label: 'Conservative', icon: <TrendingDown className="w-4 h-4" />, color: 'text-value-red',
                          bg: 'bg-value-red/10 border-value-red/20',
                          psqft: prediction.targetConservativePsqft,
                          total: prediction.targetConservativeTotal,
                          rate: prediction.conservativeAnnualGrowthRate,
                          desc: 'Worst-case: slowdowns, policy changes, low demand'
                        },
                      ].map(s => (
                        <div key={s.label} className={`flex items-start gap-4 p-4 rounded-2xl border ${s.bg}`}>
                          <div className={`mt-0.5 ${s.color}`}>{s.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-bold ${s.color}`}>{s.label}</span>
                              <span className={`text-sm font-bold ${s.color}`}>{s.rate.toFixed(1)}% p.a.</span>
                            </div>
                            <p className="text-lg font-display font-bold text-foreground">₹{s.psqft.toLocaleString()}/sqft</p>
                            {s.total && (
                              <p className="text-xs text-muted-foreground mt-0.5">Total: {formatCompactCurrency(s.total)}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5 italic">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Drivers */}
                  <div className="bg-card border border-border rounded-3xl p-7">
                    <h3 className="text-base font-display font-bold text-foreground mb-5">Key Value Drivers</h3>
                    <div className="space-y-3">
                      {prediction.drivers.map((d, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                          d.effect === 'positive' ? 'bg-value-green/5 border-value-green/15' : 'bg-value-red/5 border-value-red/15'
                        }`}>
                          <div className={`mt-0.5 flex-shrink-0 ${d.effect === 'positive' ? 'text-value-green' : 'text-value-red'}`}>
                            {d.effect === 'positive' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground font-medium">{d.factor}</p>
                            <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                              d.impact === 'high' ? 'text-primary' : d.impact === 'medium' ? 'text-value-blue' : 'text-muted-foreground'
                            }`}>{d.impact} impact</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 p-4 bg-secondary/30 border border-border/50 rounded-2xl">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Predictions are based on historical area appreciation (1Y: {Math.round(gainPercent / prediction.yearsAhead)}% avg), nearby amenity density within 5km, 
                          infrastructure future score ({prediction.futurePotentialScore}/10), and area sentiment signals. 
                          Actual results may vary with market conditions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Year-by-Year Table */}
                <div className="bg-card border border-border rounded-3xl p-7 overflow-x-auto">
                  <h3 className="text-base font-display font-bold text-foreground mb-5">Year-by-Year Breakdown (₹/sqft)</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conservative</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-primary uppercase tracking-wider">Base</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optimistic</th>
                        {prediction.areaSqft && <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Value</th>}
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prediction.projections.map((p, i) => {
                        const prev = prediction.projections[i - 1];
                        const yoyGrowth = prev ? ((p.basePsqft - prev.basePsqft) / prev.basePsqft * 100) : 0;
                        const isTarget = p.year === prediction.targetYear;
                        return (
                          <tr key={p.year} className={`border-b border-border/40 transition-colors hover:bg-secondary/30 ${isTarget ? 'bg-primary/5' : ''}`}>
                            <td className={`py-3 px-4 font-semibold ${isTarget ? 'text-primary' : 'text-foreground'}`}>
                              {p.year} {isTarget && <span className="text-[10px] text-primary ml-1">← Target</span>}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground">₹{p.conservativePsqft.toLocaleString()}</td>
                            <td className={`py-3 px-4 text-right font-bold ${isTarget ? 'text-primary' : 'text-foreground'}`}>₹{p.basePsqft.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-value-green">₹{p.optimisticPsqft.toLocaleString()}</td>
                            {prediction.areaSqft && (
                              <td className="py-3 px-4 text-right text-muted-foreground">{p.baseTotal ? formatCompactCurrency(p.baseTotal) : '—'}</td>
                            )}
                            <td className="py-3 px-4 text-right">
                              {i > 0 && (
                                <span className={`text-xs font-semibold ${yoyGrowth >= 0 ? 'text-value-green' : 'text-value-red'}`}>
                                  {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
                                </span>
                              )}
                              {i === 0 && <span className="text-xs text-muted-foreground">Base</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!prediction && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Enter area details to predict</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Select any Chennai area, set your target investment year, and our AI engine will compute data-driven price projections with 3 growth scenarios.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg">
                {[
                  { icon: '📍', title: 'Location-Aware', desc: 'Uses nearby hospitals, schools, metro & parks' },
                  { icon: '📈', title: 'Historical Data', desc: 'Based on real Chennai appreciation trends' },
                  { icon: '🔮', title: '3 Scenarios', desc: 'Optimistic, base, and conservative forecasts' },
                ].map(f => (
                  <div key={f.title} className="text-center p-4 bg-card border border-border rounded-2xl">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="text-xs font-bold text-foreground mb-1">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
