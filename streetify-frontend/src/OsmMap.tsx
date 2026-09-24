/**
 * OsmMap — simulated OpenStreetMap tile view with SVG road overlay + animated route
 * DriverPin — pulsing location marker for driver positions
 *
 * In production: swap the SVG overlay for a real Leaflet/MapLibre instance
 * and render DriverPin as L.divIcon markers inside a useEffect.
 */
import React, { ReactNode, CSSProperties } from "react";

interface OsmMapProps {
  height?: string | number;
  children?: ReactNode;
  animate?: boolean;
  dark?: boolean;
  className?: string;
  showPickup?: boolean;
  showDropoff?: boolean;
}

export default function OsmMap({
  height = 300,
  children,
  animate = true,
  dark = false,
  className = "",
  showPickup = true,
  showDropoff = false,
}: OsmMapProps) {
  const h = typeof height === "number" ? `${height}px` : height;

  const bg   = dark ? "#0f1923" : "#e8ecef";
  const road = dark ? "#1d2e3f" : "#ffffff";
  const text = dark ? "#4a6080" : "#b0bec5";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height: h, background: bg }}
    >
      {/* OSM-style tile grid */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: dark ? 0.85 : 1 }}
      >
        {/* Horizontal roads */}
        {[18, 35, 52, 68, 80].map((y) => (
          <rect key={`hr${y}`} x="0" y={`${y}%`} width="100%" height={y === 52 ? "6" : "3"} fill={road} opacity={y === 52 ? "1" : "0.7"} />
        ))}
        {/* Vertical roads */}
        {[15, 30, 50, 68, 82].map((x) => (
          <rect key={`vr${x}`} x={`${x}%`} y="0" width={x === 50 ? "6" : "3"} height="100%" fill={road} opacity={x === 50 ? "1" : "0.7"} />
        ))}

        {/* City blocks — subtle shading */}
        {[
          [0,0,29,34],   [31,0,18,34],  [51,0,16,34],  [69,0,28,34],
          [0,36,14,30],  [16,36,13,30], [31,36,18,30],  [51,36,16,30], [69,36,12,30], [83,36,17,30],
          [0,68,14,32],  [16,68,13,32], [31,68,18,32],  [51,68,16,32], [69,68,12,32], [83,68,17,32],
        ].map(([x, y, w, h2], i) => (
          <rect key={i} x={`${x}%`} y={`${y}%`} width={`${w}%`} height={`${h2}%`} fill={dark ? "#162230" : "#dde3e8"} opacity="0.6" />
        ))}

        {/* Park / green space */}
        <rect x="0" y="68%" width="14%" height="32%" fill={dark ? "#0d2218" : "#c8e6c9"} opacity="0.5" rx="2" />
        <rect x="51%" y="0" width="16%" height="34%" fill={dark ? "#0d2218" : "#c8e6c9"} opacity="0.4" rx="2" />

        {/* Map labels */}
        {[
          { x: "7%",  y: "82%", label: "Galle Face" },
          { x: "33%", y: "45%", label: "Pettah" },
          { x: "56%", y: "15%", label: "Colombo 07" },
          { x: "72%", y: "76%", label: "Bambalapitiya" },
        ].map(({ x, y, label }) => (
          <text key={label} x={x} y={y} fill={text} fontSize="9" fontFamily="DM Mono, monospace" fontWeight="500">
            {label}
          </text>
        ))}

        {/* Animated route */}
        {animate && (
          <>
            {/* Base route glow */}
            <path
              d="M 30% 78% L 30% 52% L 50% 52% L 50% 18%"
              stroke={dark ? "#3b82f6" : "#1D4ED8"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.25"
            />
            {/* Animated draw */}
            <path
              d="M 30% 78% L 30% 52% L 50% 52% L 50% 18%"
              stroke={dark ? "#60a5fa" : "#1D4ED8"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="640"
              style={{
                strokeDashoffset: "640",
                animation: "route-draw 2.2s cubic-bezier(.22,1,.36,1) 0.4s forwards",
              } as CSSProperties}
            />
            {/* Flowing dash overlay */}
            <path
              d="M 30% 78% L 30% 52% L 50% 52% L 50% 18%"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="10 18"
              opacity="0.5"
              style={{ animation: "route-dash 1.2s linear infinite" } as CSSProperties}
            />
          </>
        )}

        {/* Pickup marker */}
        {showPickup && (
          <g transform="translate(30%, 78%)">
            <circle cx="0" cy="0" r="10" fill="#22c55e" opacity="0.2" />
            <circle cx="0" cy="0" r="6" fill="#22c55e" />
            <circle cx="0" cy="0" r="3" fill="white" />
            <text x="10" y="4" fill={text} fontSize="9" fontFamily="DM Mono, monospace">Pickup</text>
          </g>
        )}

        {/* Dropoff marker */}
        {showDropoff && (
          <g transform="translate(50%, 18%)">
            <circle cx="0" cy="0" r="10" fill="#1D4ED8" opacity="0.2" />
            <circle cx="0" cy="0" r="6" fill="#1D4ED8" />
            <circle cx="0" cy="0" r="3" fill="white" />
            <text x="10" y="4" fill={text} fontSize="9" fontFamily="DM Mono, monospace">Drop-off</text>
          </g>
        )}

        {/* OSM attribution */}
        <rect x="0" y="95%" width="100%" height="5%" fill="rgba(0,0,0,0.15)" />
        <text x="8" y="98%" fill={text} fontSize="8" fontFamily="DM Mono, monospace">
          © OpenStreetMap contributors — simulated overlay
        </text>
      </svg>

      {/* Slot for driver pins / overlays */}
      <div className="absolute inset-0 pointer-events-none">{children}</div>
    </div>
  );
}

/* ── DriverPin — pulsing map marker ── */
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
  style?: React.CSSProperties;
}) {
  const pos = style ?? { top, left };
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ ...pos, transform: "translate(-50%,-50%)" }}
    >
      {/* Pulse ring */}
      {online && (
        <span
          className="absolute inset-0 rounded-full bg-blue-500 opacity-30"
          style={{ animation: "pulse-ring 1.8s ease-out infinite" }}
        />
      )}
      {/* Car icon bubble */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-base shadow-lg border-2 ${online ? "bg-white border-blue-600" : "bg-slate-200 border-slate-400"}`}
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
