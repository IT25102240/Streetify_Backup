/**
 * useGeolocation — Live GPS/WiFi position hook
 *
 * Uses browser Geolocation API (navigator.geolocation.watchPosition).
 * Works on localhost and HTTPS. No API key required.
 *
 * Returns:
 *   coords   — { lat, lng, accuracy } or null while locating
 *   error    — string error message or null
 *   loading  — true while waiting for first fix
 *   refetch  — call to manually request a position refresh
 */
import { useState, useEffect, useCallback, useRef } from "react";

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

export interface UseGeolocationResult {
  coords: GeoCoords | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 5000,
};

export function useGeolocation(): UseGeolocationResult {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoad]  = useState(true);
  const watchId = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoad(false);
      return;
    }

    setLoad(true);
    setError(null);

    // Stop any existing watch
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoad(false);
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please allow location access.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Check your device settings.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Retrying…");
            break;
          default:
            setError("Unable to get your location.");
        }
        setLoad(false);
      },
      GEO_OPTIONS
    );
  }, []);

  useEffect(() => {
    start();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [start]);

  return { coords, error, loading, refetch: start };
}

/**
 * reverseGeocode — Turns lat/lng into a human-readable address
 * Uses OpenStreetMap Nominatim API — completely free, no key needed.
 * Rate limit: max 1 request/second (fine for user-triggered calls).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "Streetify-StudentApp/1.0" } }
    );
    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();

    // Build a short, readable address
    const a = data.address ?? {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : (data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
