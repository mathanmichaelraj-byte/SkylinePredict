import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Property } from '@workspace/api-client-react/src/generated/api.schemas';
import { Place } from '@/hooks/use-places';
import { formatCompactCurrency } from '@/lib/utils';
import { ValueBadge } from '@/components/ValueBadge';
import { Link } from 'wouter';
import { Building2, BedDouble, Bath, Square, ArrowRight, Star } from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
  places?: Place[];
  flyTarget?: { lat: number; lng: number; zoom?: number } | null;
  onFlyComplete?: () => void;
  center?: [number, number];
  zoom?: number;
}

// Property pin icons
const createPropertyIcon = (color: string, valueLabel: string) => {
  const colors: Record<string, string> = {
    green: '#22c55e',
    blue: '#3b82f6',
    red: '#ef4444',
  };
  const hex = colors[color] || '#888';
  const label = color === 'green' ? '✓' : color === 'blue' ? '≈' : '!';

  return divIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${hex};
        border: 2.5px solid rgba(255,255,255,0.9);
        box-shadow: 0 4px 12px ${hex}66;
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white; font-weight: 900; font-size: 11px; line-height: 1;
        ">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
};

const propertyIcons = {
  green: createPropertyIcon('green', 'green'),
  blue: createPropertyIcon('blue', 'blue'),
  red: createPropertyIcon('red', 'red'),
};

// Place icons
const PLACE_STYLES: Record<string, { emoji: string; color: string; bg: string }> = {
  hospital:       { emoji: '🏥', color: '#ef4444', bg: '#fef2f2' },
  school:         { emoji: '🏫', color: '#8b5cf6', bg: '#f5f3ff' },
  college:        { emoji: '🎓', color: '#6366f1', bg: '#eef2ff' },
  police_station: { emoji: '🚔', color: '#3b82f6', bg: '#eff6ff' },
  park:           { emoji: '🌳', color: '#22c55e', bg: '#f0fdf4' },
  metro_station:  { emoji: '🚇', color: '#f59e0b', bg: '#fffbeb' },
  mall:           { emoji: '🛍️', color: '#ec4899', bg: '#fdf2f8' },
};

function createPlaceIcon(type: string) {
  const style = PLACE_STYLES[type] || { emoji: '📍', color: '#888', bg: '#f3f4f6' };
  return divIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 8px;
        background: ${style.bg};
        border: 2px solid ${style.color}44;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ">${style.emoji}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// StarRating component
function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= full ? '#f59e0b' : i === full + 1 && half ? '#f59e0b' : '#4b5563', fontSize: 10 }}>
          {i <= full ? '★' : i === full + 1 && half ? '⯨' : '☆'}
        </span>
      ))}
      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

// MapController — listens to flyTarget and pans the map
function MapController({ flyTarget, onFlyComplete }: { flyTarget?: { lat: number; lng: number; zoom?: number } | null; onFlyComplete?: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTarget) return;
    map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom ?? 15, { animate: true, duration: 1.2 });
    const timer = setTimeout(() => onFlyComplete?.(), 1300);
    return () => clearTimeout(timer);
  }, [flyTarget]);
  return null;
}

export function PropertyMap({
  properties,
  places = [],
  flyTarget,
  onFlyComplete,
  center = [13.0067, 80.2206],
  zoom = 11,
}: PropertyMapProps) {
  const mapCenter = useMemo<[number, number]>(() => {
    if (properties.length > 0) {
      const avgLat = properties.reduce((s, p) => s + p.lat, 0) / properties.length;
      const avgLng = properties.reduce((s, p) => s + p.lng, 0) / properties.length;
      return [avgLat, avgLng];
    }
    return center;
  }, []);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />
        <MapController flyTarget={flyTarget} onFlyComplete={onFlyComplete} />

        {/* Property Markers */}
        {properties.map(property => (
          <Marker
            key={`prop-${property.id}`}
            position={[property.lat, property.lng]}
            icon={propertyIcons[property.valueLabel as keyof typeof propertyIcons] || propertyIcons.blue}
          >
            <Popup className="property-popup" maxWidth={300} minWidth={280}>
              <div className="rounded-2xl overflow-hidden bg-[#1a1a1a] text-white" style={{ margin: -1 }}>
                {/* Header */}
                <div className="h-28 relative bg-[#111] flex items-center justify-center">
                  <Building2 className="w-10 h-10 opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      property.valueLabel === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      property.valueLabel === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {property.valueLabel === 'green' ? 'Good Value' : property.valueLabel === 'blue' ? 'Fair Price' : 'Risky'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 text-right">
                    <p className="text-xs text-white/50 uppercase tracking-wider">Fair Value</p>
                    <p className="text-sm font-bold text-white/80">{formatCompactCurrency(property.fairPriceMin)}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs text-white/50 capitalize">{property.type} · {property.area}</p>
                  </div>
                  <h3 className="font-bold text-base text-white leading-tight mb-1">{formatCompactCurrency(property.askingPrice)}</h3>
                  <p className="text-xs text-white/60 mb-3 leading-snug line-clamp-2">{property.title}</p>

                  <div className="flex items-center gap-3 text-xs text-white/50 mb-4 py-2 border-t border-white/10">
                    <span className="flex items-center gap-1"><Square className="w-3 h-3" />{property.areaSqft} sqft</span>
                    {property.bedrooms ? <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{property.bedrooms}</span> : null}
                    {property.bathrooms ? <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}</span> : null}
                  </div>

                  <Link href={`/property/${property.id}`} className="block">
                    <button className="w-full py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 group transition-colors">
                      Full Analysis
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Place Markers */}
        {places.map(place => {
          const style = PLACE_STYLES[place.type] || { emoji: '📍', color: '#888', bg: '#f3f4f6' };
          return (
            <Marker
              key={`place-${place.id}`}
              position={[place.lat, place.lng]}
              icon={createPlaceIcon(place.type)}
            >
              <Popup maxWidth={220} minWidth={200}>
                <div className="bg-[#1a1a1a] text-white rounded-xl p-3" style={{ margin: -1 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{style.emoji}</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: style.color }}>
                        {place.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs font-bold text-white leading-tight">{place.name}</p>
                    </div>
                  </div>
                  {place.rating && (
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={place.rating} />
                      {place.ratingCount && (
                        <span className="text-[10px] text-white/40">({place.ratingCount.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                  {place.address && (
                    <p className="text-[10px] text-white/50 leading-relaxed">{place.address}</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] text-white/40 italic">
                      {place.type === 'hospital' ? '🏥 Boosts health access score' :
                       place.type === 'school' || place.type === 'college' ? '📚 Boosts education score' :
                       place.type === 'police_station' ? '🛡️ Boosts safety score' :
                       place.type === 'park' ? '🌿 Boosts livability score' :
                       place.type === 'metro_station' ? '🚇 Boosts connectivity score' :
                       '✨ Boosts area value'}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
