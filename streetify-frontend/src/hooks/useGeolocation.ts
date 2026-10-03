/**
 * useGeolocation — Live GPS/WiFi position hook with multi-tier fallback
 *
 * Tier 1: Browser GPS (high accuracy, quick timeout)
 * Tier 2: Browser WiFi/Cell tower triangulation (low accuracy, instant)
 * Tier 3: IP-based Geolocation fallback (works on any desktop/PC without GPS)
 * Tier 4: Colombo Metro default fallback (6.9271, 79.8612)
 *
 * Guarantees that passenger and driver location is always resolved quickly
 * and never gets stuck indefinitely in "Detecting your location...".
 */
import { useState, useEffect, useCallback, useRef } from "react";

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number; // metres
  source?: "gps" | "wifi" | "ip" | "default";
}

export interface UseGeolocationResult {
  coords: GeoCoords | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

const DEFAULT_LAT = parseFloat(localStorage.getItem("last_lat") || "6.9271");
const DEFAULT_LNG = parseFloat(localStorage.getItem("last_lng") || "79.8612");

const COLOMBO_DEFAULT: GeoCoords = {
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  accuracy: 100,
  source: "default",
};

export function useGeolocation(): UseGeolocationResult {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError]   = useState<string | null>(null);
  
  // Helper to save to state and localStorage
  const saveCoords = useCallback((newCoords: GeoCoords) => {
    setCoords(newCoords);
    localStorage.setItem("last_lat", newCoords.lat.toString());
    localStorage.setItem("last_lng", newCoords.lng.toString());
  }, []);
  const [loading, setLoad]  = useState(true);
  const watchId = useRef<number | null>(null);
  const hasResolvedRef = useRef(false);

  // Fallback to IP geolocation if browser GPS takes too long or fails
  const fetchIpLocation = useCallback(async () => {
    if (hasResolvedRef.current) return;
    try {
      const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error("IP lookup failed");
      const data = await res.json();
      if (data.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
        if (!hasResolvedRef.current) {
          hasResolvedRef.current = true;
          saveCoords({
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 1500,
            source: "ip",
          });
          setLoad(false);
          setError(null);
          return;
        }
      }
    } catch {
      // Ignore IP lookup failure, will use default fallback
    }

    if (!hasResolvedRef.current) {
      hasResolvedRef.current = true;
      saveCoords(COLOMBO_DEFAULT);
      setLoad(false);
    }
  }, []);

  const start = useCallback(() => {
    hasResolvedRef.current = false;
    setLoad(true);
    setError(null);

    // If browser doesn't support geolocation at all
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Using network location.");
      fetchIpLocation();
      return;
    }

    // Safety timeout: if browser GPS is stuck/unresponsive for > 3.5s, fall back to IP/default
    const safetyTimer = setTimeout(() => {
      if (!hasResolvedRef.current) {
        fetchIpLocation();
      }
    }, 3500);

    // Stop existing watch if any
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    // Step 1: First try quick fix with highAccuracy: true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(safetyTimer);
        hasResolvedRef.current = true;
        saveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "gps",
        });
        setLoad(false);
        setError(null);
      },
      () => {
        // Step 2: High accuracy failed (common on desktop/laptops), try low-accuracy immediately
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(safetyTimer);
            hasResolvedRef.current = true;
            saveCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              source: "wifi",
            });
            setLoad(false);
            setError(null);
          },
          (err) => {
            clearTimeout(safetyTimer);
            switch (err.code) {
              case err.PERMISSION_DENIED:
                setError("Location permission denied. Using estimated location.");
                break;
              case err.POSITION_UNAVAILABLE:
                setError("Hardware GPS unavailable. Using network location.");
                break;
              case err.TIMEOUT:
                setError("GPS request timed out. Using estimated location.");
                break;
              default:
                setError("Unable to obtain GPS. Using estimated location.");
            }
            fetchIpLocation();
          },
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 10000 }
    );

    // Step 3: Continuously watch position for live movement updates
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        hasResolvedRef.current = true;
        saveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: pos.coords.accuracy < 50 ? "gps" : "wifi",
        });
        setLoad(false);
        setError(null);
      },
      () => {
        // Ignore watch errors if we already have coords
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [fetchIpLocation]);

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
 * Uses OpenStreetMap Nominatim with fast timeout and fallback
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Check known landmark proximities in Colombo metro first for lightning-fast resolution
  const knownLandmarks = [
    { name: "Colombo Fort Station, Colombo 01", lat: 6.9337, lng: 79.8452, dist: 0.008 },
    { name: "World Trade Centre, Colombo 01",   lat: 6.9329, lng: 79.8438, dist: 0.008 },
    { name: "Galle Face Green, Colombo 03",      lat: 6.9270, lng: 79.8450, dist: 0.008 },
    { name: "Nawaloka Hospital, Colombo 02",    lat: 6.9208, lng: 79.8519, dist: 0.008 },
    { name: "Maradana, Colombo 10",             lat: 6.9271, lng: 79.8612, dist: 0.009 },
    { name: "42/B Kotte Road, Nugegoda",        lat: 6.8649, lng: 79.8997, dist: 0.008 },
  ];

  for (const lm of knownLandmarks) {
    const dLat = Math.abs(lm.lat - lat);
    const dLng = Math.abs(lm.lng - lng);
    if (dLat < lm.dist && dLng < lm.dist) {
      return lm.name;
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
      {
        headers: { "Accept-Language": "en", "User-Agent": "Streetify-App/2.0" },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();

    const a = data.address ?? {};
    const parts = [
      a.road || a.pedestrian || a.suburb || a.neighbourhood,
      a.city || a.town || a.county || a.state_district,
      a.state || a.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : (data.display_name?.split(",").slice(0, 3).join(",") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  } catch {
    // If online lookup fails or times out, provide formatted coordinates or general zone
    if (lat >= 6.85 && lat <= 7.0 && lng >= 79.80 && lng <= 79.95) {
      return `Colombo Metro (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * searchPlaces — Searches for a real-world address in Sri Lanka using OpenStreetMap Nominatim
 */
export async function searchPlaces(query: string): Promise<Array<{ label: string; addr: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 3) return [];
  try {
    // Restrict search to Sri Lanka (countrycodes=lk)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=lk&limit=5&addressdetails=1`,
      {
        headers: { "Accept-Language": "en", "User-Agent": "Streetify-App/2.0" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) throw new Error("Nominatim search error");
    const data = await res.json();
    return data.map((item: any) => {
      const a = item.address ?? {};
      const label = item.name || a.road || a.pedestrian || a.suburb || "Location";
      const parts = [
        a.city || a.town || a.county || a.state_district,
        a.state || a.country,
      ].filter(Boolean);
      return {
        label,
        addr: parts.length > 0 ? parts.join(", ") : item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });
  } catch (err) {
    console.error("Place search failed:", err);
    return [];
  }
}
