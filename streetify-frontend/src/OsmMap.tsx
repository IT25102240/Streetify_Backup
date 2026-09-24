/**
 * OsmMap — Real Leaflet.js map using OpenStreetMap tiles
 * DriverPin — pulsing location marker rendered as Leaflet divIcon markers
 *
 * Colombo, Sri Lanka is the default fallback center (6.9271, 79.8612).
 * Dark tiles: Stadia Maps Alidade Smooth Dark (free, no API key needed).
 * Light tiles: Standard OpenStreetMap (free, no API key needed).
 * Props are kept identical to the old SVG version so callers need no changes.
 */
import React, { useEffect, useRef, ReactNode, CSSProperties } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Fix Leaflet's default icon path broken by bundlers ── */
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

/* ── Colombo fallback + known Sri Lankan locations ── */
const COLOMBO = { lat: 6.9271, lng: 79.8612 };

const LOCATION_COORDS: Record<string, [number, number]> = {
  "colombo fort railway station": [6.9337, 79.8452],
  "42/b kotte road, nugegoda":    [6.8649, 79.8997],
  "world trade centre, col 01":   [6.9329, 79.8438],
  "bandaranaike int. airport":    [7.1805, 79.8837],
  "nawaloka hospital, col 02":    [6.9208, 79.8519],
  "home":                         [6.8649, 79.8997],
  "office":                       [6.9329, 79.8438],
  "bia terminal 1":               [7.1805, 79.8837],
  "nawaloka":                     [6.9208, 79.8519],
};

function resolveLatLng(addr?: string): [number, number] | null {
  if (!addr) return null;
  const key = addr.toLowerCase().trim();
  return LOCATION_COORDS[key] ?? null;
}

/* ── Custom Leaflet div icons ── */
function makePickupIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:#22c55e;border:3px solid white;
      box-shadow:0 2px 8px rgba(34,197,94,0.6);
      display:flex;align-items:center;justify-content:center;">
      <div style="width:7px;height:7px;background:white;border-radius:50%;"></div>
    </div>
    <div style="
      position:absolute;top:24px;left:50%;transform:translateX(-50%);
      background:#22c55e;color:white;font-size:9px;font-weight:700;
      padding:1px 5px;border-radius:3px;white-space:nowrap;font-family:monospace;">Pickup</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -15],
  });
}

function makeDropoffIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:#1D4ED8;border:3px solid white;
      box-shadow:0 2px 8px rgba(29,78,216,0.6);
      display:flex;align-items:center;justify-content:center;">
      <div style="width:7px;height:7px;background:white;border-radius:50%;"></div>
    </div>
    <div style="
      position:absolute;top:24px;left:50%;transform:translateX(-50%);
      background:#1D4ED8;color:white;font-size:9px;font-weight:700;
      padding:1px 5px;border-radius:3px;white-space:nowrap;font-family:monospace;">Drop-off</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -15],
  });
}

/** "You are here" pulsing blue dot — shown at user's real GPS position */
function makeMyLocationIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:24px;height:24px;">
        <!-- outer pulse ring -->
        <div style="
          position:absolute;inset:-8px;border-radius:50%;
          background:rgba(37,99,235,0.18);
          animation:youhere-pulse 2s ease-out infinite;"></div>
        <!-- inner dot -->
        <div style="
          width:24px;height:24px;border-radius:50%;
          background:#2563EB;border:3px solid white;
          box-shadow:0 0 0 3px rgba(37,99,235,0.35),0 2px 10px rgba(37,99,235,0.5);
          display:flex;align-items:center;justify-content:center;">
          <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
        </div>
      </div>
      <style>
        @keyframes youhere-pulse {
          0%   { transform:scale(1);   opacity:0.8; }
          70%  { transform:scale(2.4); opacity:0; }
          100% { transform:scale(2.4); opacity:0; }
        }
      </style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });
}

/* ── Component interface ── */
interface OsmMapProps {
  height?: string | number;
  children?: ReactNode;
  animate?: boolean;
  dark?: boolean;
  className?: string;
  showPickup?: boolean;
  showDropoff?: boolean;
  pickupAddress?: string;
  dropoffAddress?: string;
  // Explicit pickup coords (overrides address lookup)
  pickupLat?: number;
  pickupLng?: number;
  // Explicit dropoff coords
  dropoffLat?: number;
  dropoffLng?: number;
  // Real user location coords — shows animated "You are here" dot
  myLat?: number;
  myLng?: number;
  // Called when map ref is ready (for external re-center button)
  onMapReady?: (map: L.Map) => void;
}

/* ── OsmMap: real Leaflet tile map ── */
export default function OsmMap({
  height = 300,
  children,
  animate = true,
  dark = false,
  className = "",
  showPickup = true,
  showDropoff = false,
  pickupAddress,
  dropoffAddress,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  myLat,
  myLng,
  onMapReady,
}: OsmMapProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef= useRef<L.Marker | null>(null);
  const routeLayerRef   = useRef<L.Polyline | null>(null);
  const myLocMarkerRef  = useRef<L.Marker | null>(null);

  /* Resolve pickup coords:
   * Priority: explicit props > address lookup > real GPS > Colombo fallback */
  const pCoords: [number, number] =
    pickupLat && pickupLng
      ? [pickupLat, pickupLng]
      : resolveLatLng(pickupAddress)
        ?? (myLat && myLng ? [myLat, myLng] : null)
        ?? [COLOMBO.lat, COLOMBO.lng];

  const dCoords: [number, number] | null =
    showDropoff
      ? dropoffLat && dropoffLng
        ? [dropoffLat, dropoffLng]
        : resolveLatLng(dropoffAddress)
      : null;

  /* Initial map center: prefer real GPS, else pickup, else Colombo */
  const initialCenter: [number, number] =
    myLat && myLng ? [myLat, myLng] : pCoords;

  /* Tile layer URLs
   * Dark  → Stadia Maps Alidade Smooth Dark — free for dev/student use, no API key required
   *          https://stadiamaps.com/technology/map-tiles/
   * Light → Standard OpenStreetMap — always free, no key required
   */
  const tileUrl = dark
    ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = dark
    ? '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

  /* Initialise map once */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 15,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

    // Pickup marker
    if (showPickup) {
      pickupMarkerRef.current = L.marker(pCoords, { icon: makePickupIcon() })
        .addTo(map)
        .bindTooltip(pickupAddress || "Pickup", { permanent: false });
    }

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Update tile layer when dark prop changes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer(layer => {
      if ((layer as any)._url) map.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
  }, [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Update "You are here" marker when real GPS coords arrive/change */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (myLat && myLng) {
      const pos: [number, number] = [myLat, myLng];
      if (myLocMarkerRef.current) {
        myLocMarkerRef.current.setLatLng(pos);
      } else {
        myLocMarkerRef.current = L.marker(pos, { icon: makeMyLocationIcon(), zIndexOffset: 1000 })
          .addTo(map)
          .bindTooltip("📍 You are here", { permanent: false });
      }
    } else {
      if (myLocMarkerRef.current) {
        map.removeLayer(myLocMarkerRef.current);
        myLocMarkerRef.current = null;
      }
    }
  }, [myLat, myLng]);

  /* Update pickup marker position when coords change */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng(pCoords);
    }
  }, [pCoords[0], pCoords[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Update dropoff marker + draw route when coords change */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (dropoffMarkerRef.current) { map.removeLayer(dropoffMarkerRef.current); dropoffMarkerRef.current = null; }
    if (routeLayerRef.current)   { map.removeLayer(routeLayerRef.current);   routeLayerRef.current = null; }

    if (showDropoff && dCoords) {
      dropoffMarkerRef.current = L.marker(dCoords, { icon: makeDropoffIcon() })
        .addTo(map)
        .bindTooltip(dropoffAddress || "Drop-off", { permanent: false });

      if (animate && showPickup) {
        routeLayerRef.current = L.polyline([pCoords, dCoords], {
          color: dark ? "#60a5fa" : "#1D4ED8",
          weight: 4,
          opacity: 0.85,
          dashArray: "8 6",
        }).addTo(map);

        map.fitBounds(L.latLngBounds([pCoords, dCoords]), { padding: [50, 50] });
      }
    } else if (showPickup && !(myLat && myLng)) {
      map.setView(pCoords, 15, { animate: true });
    }
  }, [showDropoff, dCoords?.[0], dCoords?.[1], animate, dark]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height: h }}>
      {/* Leaflet map container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Driver pins + overlays rendered on top */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 800 }}>
        {children}
      </div>
    </div>
  );
}

/* ── DriverPin — pulsing CSS marker positioned absolutely ── */
export function DriverPin({
  top,
  left,
  label,
  online = true,
  style,
}: {
  top?: string;
  left?: string;
  label?: string;
  online?: boolean;
  style?: CSSProperties;
}) {
  const pos = style ?? { top, left };
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ ...pos, transform: "translate(-50%,-50%)", zIndex: 900 }}
    >
      {online && (
        <span
          className="absolute inset-0 rounded-full bg-blue-500 opacity-30"
          style={{ animation: "pulse-ring 1.8s ease-out infinite" }}
        />
      )}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-base shadow-lg border-2 ${
          online ? "bg-white border-blue-600" : "bg-slate-200 border-slate-400"
        }`}
      >
        🚗
      </div>
      {label && (
        <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold bg-white px-1.5 py-0.5 rounded-md shadow text-slate-700 border border-slate-200">
          {label}
        </p>
      )}
    </div>
  );
}
