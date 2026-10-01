/**
 * Screen B — Passenger Booking
 * Responsive Wide-Screen & Mobile View:
 * - Desktop: Full-bleed wide Leaflet map with floating/sidebar booking dashboard
 * - Mobile: Responsive touch-friendly layout
 * - Real-time GPS tracking with auto-centering & accurate reverse geocoding
 * - Real geographic Leaflet driver pins clustered realistically around passenger
 * - Interactive map clicking to choose pickup or dropoff location
 */
import { useState, useEffect, useRef, useCallback } from "react";
import OsmMap, { DriverMarkerData } from "../OsmMap";
import { Btn, Card, Pill, WsLive } from "../ui";
import { apiClient } from "../api/apiClient";
import { useGeolocation, reverseGeocode } from "../hooks/useGeolocation";
import { NotificationService } from "../services/notificationService";
import { tabStorage } from "../utils/storage";
import { tripSyncService } from "../services/tripSyncService";
import type L from "leaflet";

type RideType = "standard" | "xl" | "moto";
type BookingStep = "idle" | "selecting" | "estimating" | "confirm" | "searching" | "matched";

interface DriverState {
  id: string;
  name: string;
  plate: string;
  lat: number;
  lng: number;
  eta: number;
  rating: number;
  heading: number;
  type?: string;
}

const RIDE_TYPES: { key: RideType; label: string; icon: string; desc: string; base: number; perKm: number }[] = [
  { key: "standard", label: "Standard",     icon: "🚗",  desc: "Sedan · up to 4 passengers",   base: 200, perKm: 33 },
  { key: "xl",       label: "Streetify XL", icon: "🚐",  desc: "SUV/Van · up to 7 passengers",  base: 340, perKm: 48 },
  { key: "moto",     label: "Moto",         icon: "🏍️", desc: "Motorcycle · fastest & cheapest", base: 80,  perKm: 18 },
];

const SAVED_PLACES = [
  { icon: "🏠", label: "Home",           addr: "42/B Kotte Road, Nugegoda", lat: 6.8649, lng: 79.8997 },
  { icon: "🏢", label: "Office",         addr: "World Trade Centre, Col 01", lat: 6.9329, lng: 79.8438 },
  { icon: "✈️", label: "BIA Terminal 1", addr: "Bandaranaike Int. Airport", lat: 7.1805, lng: 79.8837 },
  { icon: "🏥", label: "Nawaloka",       addr: "Nawaloka Hospital, Col 02", lat: 6.9208, lng: 79.8519 },
  { icon: "🌊", label: "Galle Face",     addr: "Galle Face Green, Col 03",   lat: 6.9270, lng: 79.8450 },
];

const SL_PLACES = [
  { label: "Dalada Maligawa", addr: "Temple of the Sacred Tooth Relic, Kandy", lat: 7.2936, lng: 80.6413 },
  { label: "Galle Face Green", addr: "Galle Face, Colombo 03", lat: 6.9270, lng: 79.8450 },
  { label: "BIA Terminal 1", addr: "Bandaranaike Int. Airport, Katunayake", lat: 7.1805, lng: 79.8837 },
  { label: "Colombo Fort Station", addr: "Railway Station, Colombo Fort", lat: 6.9337, lng: 79.8452 },
  { label: "Lotus Tower", addr: "Colombo Lotus Tower, Colombo 10", lat: 6.9273, lng: 79.8584 },
  { label: "World Trade Center", addr: "Echelon Square, Colombo 01", lat: 6.9329, lng: 79.8438 },
  { label: "Nawaloka Hospital", addr: "Nawaloka Hospital, Colombo 02", lat: 6.9208, lng: 79.8519 },
  { label: "One Galle Face Mall", addr: "1A Centre Road, Colombo 02", lat: 6.9277, lng: 79.8436 },
  { label: "Majestic City", addr: "10 Station Rd, Colombo 04", lat: 6.8937, lng: 79.8549 },
  { label: "Mount Lavinia Hotel", addr: "100 Hotel Rd, Mount Lavinia", lat: 6.8333, lng: 79.8656 },
  { label: "Independence Memorial Hall", addr: "Independence Ave, Colombo 07", lat: 6.9048, lng: 79.8677 },
  { label: "National Museum Colombo", addr: "Marcus Fernando Mawatha, Colombo 07", lat: 6.9099, lng: 79.8608 },
  { label: "Gangaramaya Temple", addr: "61 Sri Jinarathana Rd, Colombo 02", lat: 6.9168, lng: 79.8564 },
  { label: "Kandy Lake", addr: "Kandy Lake Round, Kandy", lat: 7.2917, lng: 80.6410 },
  { label: "Peradeniya Gardens", addr: "Royal Botanical Gardens, Peradeniya, Kandy", lat: 7.2687, lng: 80.5968 },
  { label: "Sigiriya Rock Fortress", addr: "Sigiriya, Central Province", lat: 7.9570, lng: 80.7603 },
  { label: "Dambulla Cave Temple", addr: "Kandy - Jaffna Highway, Dambulla", lat: 7.8567, lng: 80.6486 },
  { label: "Nine Arches Bridge", addr: "Demodara, Ella", lat: 6.8767, lng: 81.0607 },
  { label: "Little Adam's Peak", addr: "Ella - Passara Rd, Ella", lat: 6.8622, lng: 81.0543 },
  { label: "Galle Dutch Fort", addr: "Church St, Galle", lat: 6.0270, lng: 80.2170 },
  { label: "Mirissa Beach", addr: "Mirissa, Southern Province", lat: 5.9483, lng: 80.4571 },
  { label: "Unawatuna Beach", addr: "Unawatuna, Galle", lat: 6.0104, lng: 80.2492 },
  { label: "Gregory Lake", addr: "Peradeniya-Badulla Rd, Nuwara Eliya", lat: 6.9530, lng: 80.7819 },
  { label: "Jaffna Fort", addr: "Jaffna City, Northern Province", lat: 9.6615, lng: 80.0090 },
  { label: "Nallur Kandaswamy Kovil", addr: "Point Pedro Rd, Nallur, Jaffna", lat: 9.6745, lng: 80.0294 },
  { label: "Negombo Beach", addr: "Porutota Rd, Negombo", lat: 7.2275, lng: 79.8407 },
  { label: "Pinnawala Elephant Orphanage", addr: "Rambukkana Rd, Pinnawala", lat: 7.3015, lng: 80.3871 },
];

export default function ScreenBooking() {
  const [pickup, setPickup]       = useState("Detecting your location…");
  const [dropoff, setDropoff]     = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>({ lat: 6.9271, lng: 79.8612 });
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapTargetMode, setMapTargetMode] = useState<"pickup" | "dropoff">("dropoff");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  const [rideType, setRide]       = useState<RideType>("standard");
  const [step, setStep]           = useState<BookingStep>("idle");
  const [fareReady, setFareReady] = useState(false);
  const [wsConnected, setWsConn]  = useState(true);
  const [drivers, setDrivers]     = useState<DriverState[]>([]);
  const [matchedDriver, setMatch] = useState<DriverState | null>(null);
  const [liveTripStatus, setLiveTripStatus] = useState<"IDLE" | "REQUESTED" | "ASSIGNED" | "EN_ROUTE" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED">("IDLE");
  const [searchDots, setDots]     = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const wsTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const initialLocSet = useRef(false);

  /* Real GPS location with multi-tier fallback */
  const { coords: myCoords, error: geoError, loading: geoLoading, refetch: refetchGps } = useGeolocation();

  const DISTANCE = 8.4;
  const selected = RIDE_TYPES.find(r => r.key === rideType)!;
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [bookingError, setBookingError] = useState("");
  const fare = estimatedFare || Math.round(selected.base + (estimatedDistance || DISTANCE) * selected.perKm);

  /* When live GPS resolves, update pickup and coordinates */
  useEffect(() => {
    if (!myCoords) return;

    setPickupCoords({ lat: myCoords.lat, lng: myCoords.lng });

    // Reverse geocode to get nice street address
    reverseGeocode(myCoords.lat, myCoords.lng).then(addr => {
      setPickup(addr);
    });

    // Populate 9 demo drivers (3 per vehicle type) around user's location
    if (!initialLocSet.current) {
      initialLocSet.current = true;
      const bLat = myCoords.lat;
      const bLng = myCoords.lng;
      setDrivers([
        { id: "demo-c1", name: "Kasun P.", plate: "CAB-4821", lat: bLat + 0.003, lng: bLng - 0.002, eta: 4, rating: 4.9, heading: 45, type: "standard" },
        { id: "demo-c2", name: "Nuwan M.", plate: "WP-5503",  lat: bLat - 0.004, lng: bLng + 0.003, eta: 6, rating: 4.8, heading: 180, type: "standard" },
        { id: "demo-c3", name: "Amara N.", plate: "WP-2217",  lat: bLat + 0.002, lng: bLng + 0.004, eta: 8, rating: 4.7, heading: 270, type: "standard" },
        { id: "demo-v1", name: "Kamal D.", plate: "VAN-8991", lat: bLat - 0.005, lng: bLng - 0.005, eta: 7, rating: 4.9, heading: 90, type: "xl" },
        { id: "demo-v2", name: "Saman K.", plate: "WP-1122",  lat: bLat + 0.006, lng: bLng + 0.001, eta: 9, rating: 4.6, heading: 120, type: "xl" },
        { id: "demo-v3", name: "Ruwan T.", plate: "WP-3344",  lat: bLat - 0.001, lng: bLng - 0.006, eta: 5, rating: 4.8, heading: 310, type: "xl" },
        { id: "demo-m1", name: "Nimal S.", plate: "BCA-1020", lat: bLat + 0.001, lng: bLng + 0.002, eta: 2, rating: 4.9, heading: 15, type: "moto" },
        { id: "demo-m2", name: "Ajith W.", plate: "BCC-9988", lat: bLat - 0.002, lng: bLng + 0.001, eta: 3, rating: 4.7, heading: 195, type: "moto" },
        { id: "demo-m3", name: "Namal B.", plate: "BXZ-7766", lat: bLat + 0.003, lng: bLng - 0.004, eta: 4, rating: 4.8, heading: 75, type: "moto" },
      ]);
    }
  }, [myCoords?.lat, myCoords?.lng]);

  /* Fallback initial drivers if GPS takes time */
  useEffect(() => {
    if (drivers.length === 0) {
      const bLat = 6.9271;
      const bLng = 79.8612;
      setDrivers([
        { id: "demo-c1", name: "Kasun P.", plate: "CAB-4821", lat: bLat + 0.003, lng: bLng - 0.002, eta: 4, rating: 4.9, heading: 45, type: "standard" },
        { id: "demo-c2", name: "Nuwan M.", plate: "WP-5503",  lat: bLat - 0.004, lng: bLng + 0.003, eta: 6, rating: 4.8, heading: 180, type: "standard" },
        { id: "demo-c3", name: "Amara N.", plate: "WP-2217",  lat: bLat + 0.002, lng: bLng + 0.004, eta: 8, rating: 4.7, heading: 270, type: "standard" },
        { id: "demo-v1", name: "Kamal D.", plate: "VAN-8991", lat: bLat - 0.005, lng: bLng - 0.005, eta: 7, rating: 4.9, heading: 90, type: "xl" },
        { id: "demo-v2", name: "Saman K.", plate: "WP-1122",  lat: bLat + 0.006, lng: bLng + 0.001, eta: 9, rating: 4.6, heading: 120, type: "xl" },
        { id: "demo-v3", name: "Ruwan T.", plate: "WP-3344",  lat: bLat - 0.001, lng: bLng - 0.006, eta: 5, rating: 4.8, heading: 310, type: "xl" },
        { id: "demo-m1", name: "Nimal S.", plate: "BCA-1020", lat: bLat + 0.001, lng: bLng + 0.002, eta: 2, rating: 4.9, heading: 15, type: "moto" },
        { id: "demo-m2", name: "Ajith W.", plate: "BCC-9988", lat: bLat - 0.002, lng: bLng + 0.001, eta: 3, rating: 4.7, heading: 195, type: "moto" },
        { id: "demo-m3", name: "Namal B.", plate: "BXZ-7766", lat: bLat + 0.003, lng: bLng - 0.004, eta: 4, rating: 4.8, heading: 75, type: "moto" },
      ]);
    }
  }, [drivers.length]);

  /* Recenter map to real GPS on 🎯 button press */
  const recenterToMyLocation = useCallback(() => {
    if (leafletMapRef.current && myCoords) {
      leafletMapRef.current.flyTo([myCoords.lat, myCoords.lng], 16, { animate: true, duration: 1 });
    } else if (leafletMapRef.current && pickupCoords) {
      leafletMapRef.current.flyTo([pickupCoords.lat, pickupCoords.lng], 15, { animate: true, duration: 1 });
    }
  }, [myCoords, pickupCoords]);

  /* Handle clicking on map to pick location */
  const handleMapClick = async ({ lat, lng }: { lat: number; lng: number }) => {
    if (mapTargetMode === "pickup") {
      setPickupCoords({ lat, lng });
      setPickup("Locating address…");
      const addr = await reverseGeocode(lat, lng);
      setPickup(addr);
      setMapTargetMode("dropoff");
    } else {
      setDropoffCoords({ lat, lng });
      setDropoff("Locating address…");
      const addr = await reverseGeocode(lat, lng);
      setDropoff(addr);
      setStep("selecting");
      setFareReady(false);
    }
  };

  /* Simulate dynamic real-time driver telemetry (realistic micro-movement along streets) */
  useEffect(() => {
    wsTickRef.current = setInterval(() => {
      setDrivers(prev => prev.map(d => {
        const dLat = (Math.random() - 0.48) * 0.0004;
        const dLng = (Math.random() - 0.48) * 0.0004;
        return {
          ...d,
          lat: d.lat + dLat,
          lng: d.lng + dLng,
          eta: Math.max(1, d.eta + (Math.random() > 0.7 ? -1 : Math.random() > 0.85 ? 1 : 0)),
        };
      }));
    }, 3000);
    return () => { if (wsTickRef.current) clearInterval(wsTickRef.current); };
  }, []);

  /* Real API call for fare estimate */
  useEffect(() => {
    if (step !== "estimating") return;
    setFareReady(false);
    setBookingError("");

    const pLat = pickupCoords.lat;
    const pLng = pickupCoords.lng;
    const dLat = dropoffCoords?.lat ?? 6.9329;
    const dLng = dropoffCoords?.lng ?? 79.8438;

    apiClient<any>('/rides/estimate', {
      method: 'POST',
      body: JSON.stringify({
        pickupAddress: pickup,
        pickupLat: pLat,
        pickupLng: pLng,
        dropoffAddress: dropoff,
        dropoffLat: dLat,
        dropoffLng: dLng,
        rideType: rideType.toUpperCase()
      })
    })
    .then(data => {
      setEstimatedFare(data.totalFare ?? data.estimatedFare ?? data.fare ?? 0);
      setEstimatedDistance(data.distanceKm ?? data.estimatedDistanceKm ?? DISTANCE);
      setFareReady(true);
      setStep("confirm");
    })
    .catch(err => {
      console.warn("Backend estimate fallback:", err);
      // Client-side fallback calculation based on euclidean distance approx
      const approxDist = Math.max(
        1.5,
        Math.round(
          Math.sqrt(Math.pow((dLat - pLat) * 111, 2) + Math.pow((dLng - pLng) * 111, 2)) * 1.35 * 10
        ) / 10
      );
      setEstimatedDistance(approxDist || DISTANCE);
      setEstimatedFare(Math.round(selected.base + (approxDist || DISTANCE) * selected.perKm));
      setFareReady(true);
      setStep("confirm");
    });
  }, [step, rideType, pickup, dropoff, pickupCoords, dropoffCoords, selected.base, selected.perKm]);

  /* Cross-tab real-time sync with Driver Tab 2 */
  useEffect(() => {
    const unsubAccept = tripSyncService.subscribe("RIDE_ACCEPTED", (data: any) => {
      if (dotRef.current) clearInterval(dotRef.current);
      const matched: DriverState = {
        id: String(data.driverId || "d1"),
        name: data.driverName || "Kamal Perera",
        plate: data.vehiclePlate || "CAB-4821",
        lat: data.driverLat || (pickupCoords.lat + 0.001),
        lng: data.driverLng || (pickupCoords.lng + 0.001),
        eta: data.etaMinutes || 3,
        rating: data.rating || 4.95,
        heading: 90,
      };
      setMatch(matched);
      setLiveTripStatus("ASSIGNED");
      setStep("matched");

      // Update active_trip with driver information
      const activeStr = tabStorage.getItem("active_trip");
      if (activeStr) {
        try {
          const parsed = JSON.parse(activeStr);
          parsed.driverName = matched.name;
          parsed.vehiclePlate = matched.plate;
          tabStorage.setItem("active_trip", JSON.stringify(parsed));
        } catch {}
      }

      NotificationService.sendTripAlert(
        "Driver Assigned! 🚖",
        `${matched.name} accepted your ride in ${matched.plate} (ETA ${matched.eta}m)`
      );
    });

    const unsubStatus = tripSyncService.subscribe("TRIP_STATUS_UPDATED", (data: any) => {
      setLiveTripStatus(data.status);
      if (data.status === "EN_ROUTE") {
        NotificationService.sendTripAlert("Driver En Route 🚗", "Driver is navigating towards your pickup location.");
      } else if (data.status === "ARRIVED") {
        NotificationService.sendTripAlert("Driver Arrived 📍", "Driver is waiting at your pickup spot. Please board.");
      } else if (data.status === "IN_PROGRESS") {
        NotificationService.sendTripAlert("Trip Started 🛣️", "You are en route to your destination.");
      } else if (data.status === "COMPLETED") {
        NotificationService.sendTripAlert("Trip Completed 🏁", "Arrived at destination! Redirecting to payment…");
        const activeStr = tabStorage.getItem("active_trip");
        if (activeStr) {
          tabStorage.setItem("last_completed_trip", activeStr);
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("navigate", { detail: { screen: "payment" } }));
        }, 1500);
      }
    });

    const unsubCancel = tripSyncService.subscribe("TRIP_CANCELLED", (data: any) => {
      if (data.by !== "PASSENGER") {
        setStep("idle");
        setMatch(null);
        setLiveTripStatus("IDLE");
        tabStorage.removeItem("active_trip");
        NotificationService.sendTripAlert("Trip Cancelled ✕", `Driver cancelled: ${data.reason || "Unable to fulfill ride"}`);
      }
    });

    return () => {
      unsubAccept();
      unsubStatus();
      unsubCancel();
    };
  }, [pickupCoords]);

  /* Searching animation dots & fallback simulation if only 1 tab is running */
  useEffect(() => {
    if (step === "searching") {
      dotRef.current = setInterval(() => setDots(d => (d + 1) % 4), 500);
      const t = setTimeout(() => {
        if (dotRef.current) clearInterval(dotRef.current);
        const matched = drivers.find(d => d.type === rideType) ?? drivers[0] ?? {
          id: "demo-d1", name: "Kasun P.", plate: "CAB-4821", lat: pickupCoords.lat + 0.001, lng: pickupCoords.lng + 0.001, eta: 3, rating: 4.91, heading: 90, type: rideType
        };
        setMatch(matched);
        setLiveTripStatus("ASSIGNED");
        setStep("matched");
        NotificationService.sendTripAlert(
          "Driver Assigned! 🚖",
          `${matched.name} is on the way in ${matched.plate} (ETA ${matched.eta}m)`
        );
      }, 15000); // 15 seconds demo fallback wait
      return () => { clearTimeout(t); if (dotRef.current) clearInterval(dotRef.current); };
    }
  }, [step, drivers, pickupCoords, rideType]);

  /* Demo Driver Auto-Progression Simulator */
  useEffect(() => {
    if (step === "matched" && matchedDriver && matchedDriver.id.startsWith("demo-")) {
      const timer = setTimeout(() => {
        if (liveTripStatus === "ASSIGNED") {
          tripSyncService.publishStatusUpdate(matchedDriver.id, "EN_ROUTE");
        } else if (liveTripStatus === "EN_ROUTE") {
          tripSyncService.publishStatusUpdate(matchedDriver.id, "ARRIVED");
        } else if (liveTripStatus === "ARRIVED") {
          tripSyncService.publishStatusUpdate(matchedDriver.id, "IN_PROGRESS");
        } else if (liveTripStatus === "IN_PROGRESS") {
          tripSyncService.publishStatusUpdate(matchedDriver.id, "COMPLETED");
        }
      }, 5000); // 5 seconds per state transition for demo
      return () => clearTimeout(timer);
    }
  }, [step, matchedDriver, liveTripStatus]);

  function pickSavedPlace(p: typeof SAVED_PLACES[0]) {
    setDropoff(p.addr);
    setDropoffCoords({ lat: p.lat, lng: p.lng });
    setStep("selecting");
    setFareReady(false);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([p.lat, p.lng], 15, { animate: true, duration: 1 });
    }
  }

  const selectPickupPlace = (p: typeof SL_PLACES[0]) => {
    const formatted = p.addr.toLowerCase().includes(p.label.toLowerCase()) ? p.addr : `${p.label}, ${p.addr}`;
    setPickup(formatted);
    setPickupCoords({ lat: p.lat, lng: p.lng });
    setShowPickupSuggestions(false);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([p.lat, p.lng], 15, { animate: true, duration: 1 });
    }
  };

  const selectDropoffPlace = (p: typeof SL_PLACES[0]) => {
    const formatted = p.addr.toLowerCase().includes(p.label.toLowerCase()) ? p.addr : `${p.label}, ${p.addr}`;
    setDropoff(formatted);
    setDropoffCoords({ lat: p.lat, lng: p.lng });
    setShowDropoffSuggestions(false);
    setStep("selecting");
    setFareReady(false);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([p.lat, p.lng], 14, { animate: true, duration: 1.2 });
    }
  };

  const handleCancelTrip = async () => {
    try {
      const activeStr = tabStorage.getItem('active_trip');
      if (activeStr) {
        const active = JSON.parse(activeStr);
        if (active?.tripId) {
          tripSyncService.publishTripCancelled(active.tripId, "PASSENGER", "Passenger cancelled booking");
          await apiClient(`/rides/${active.tripId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason: 'PASSENGER_CANCELLED' })
          }).catch(() => {});
        }
      }
    } catch {}
    tabStorage.removeItem('active_trip');
    if (dotRef.current) clearInterval(dotRef.current);
    setStep("idle");
    setMatch(null);
    setLiveTripStatus("IDLE");
    NotificationService.sendTripAlert("Trip Cancelled ✕", "Your ride request has been cancelled.");
  };

  const FARE_ROWS = [
    { label: "Base fare",    value: `LKR ${selected.base}` },
    { label: `${estimatedDistance.toFixed(1)} km × LKR ${selected.perKm}`, value: `LKR ${Math.round(estimatedDistance * selected.perKm)}` },
    { label: "Platform fee", value: "LKR 4" },
  ];

  // Convert drivers to Leaflet driver markers
  const driverMarkers: DriverMarkerData[] = drivers
    .filter(d => !d.type || d.type === rideType)
    .map(d => ({
      id: d.id,
    name: d.name,
    plate: d.plate,
    lat: d.lat,
    lng: d.lng,
    eta: d.eta,
    rating: d.rating,
    heading: d.heading,
  }));

  return (
    <div className="min-h-[calc(100vh-65px)] w-full flex flex-col lg:flex-row bg-[#08111e] overflow-hidden">

      {/* ── LEFT COLUMN: BOOKING CONTROLS / DASHBOARD (Desktop sidebar, mobile bottom sheet) ── */}
      <div className="order-2 lg:order-1 w-full lg:w-[450px] xl:w-[490px] flex-none bg-[#091426] border-r border-slate-800/80 flex flex-col z-20 shadow-2xl">

        {/* Header bar with Status Indicator */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              <span>Book a Ride</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ECO FLEET
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Real-time driver matching across Sri Lanka</p>
          </div>
          <div className="flex items-center gap-2">
            <WsLive label={`${drivers.length} drivers`} connected={wsConnected} />
          </div>
        </div>

        {/* Scrollable Booking Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* GPS Status Alert if unavailable/loading */}
          {(geoLoading || geoError) && (
            <div className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold backdrop-blur-sm border ${
              geoError
                ? "bg-orange-950/70 border-orange-600/50 text-orange-200"
                : "bg-blue-950/70 border-blue-600/50 text-blue-200"
            }`}>
              <div className="flex items-center gap-2">
                <span>{geoError ? "⚠️" : "📡"}</span>
                <span>{geoError ? geoError : "Locating your GPS position…"}</span>
              </div>
              <button
                onClick={refetchGps}
                className="text-[11px] underline font-bold hover:text-white transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Matched Driver Alert banner & Trip Lifecycle Progress HUD */}
          {step === "matched" && matchedDriver && (
            <div
              className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 shadow-xl text-white border border-emerald-400/40 space-y-3"
              style={{ animation: "slide-in .4s cubic-bezier(.22,1,.36,1) both" }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-none shadow-inner">
                  🚘
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-sm">
                      {liveTripStatus === "EN_ROUTE"
                        ? "Driver is En Route 🚗"
                        : liveTripStatus === "ARRIVED"
                        ? "Driver Has Arrived! 📍"
                        : liveTripStatus === "IN_PROGRESS"
                        ? "Trip In Progress 🛣️"
                        : liveTripStatus === "COMPLETED"
                        ? "Destination Reached! 🏁"
                        : "Driver Assigned!"}
                    </p>
                    <Pill color="green">
                      {liveTripStatus === "IN_PROGRESS" ? "On Board" : `ETA ${matchedDriver.eta}m`}
                    </Pill>
                  </div>
                  <p className="text-xs text-emerald-100 font-mono mt-0.5 truncate">
                    {matchedDriver.name} · {matchedDriver.plate} · ★ {matchedDriver.rating}
                  </p>
                </div>
              </div>

              {/* Step progression indicator synchronized with Driver Tab 2 */}
              <div className="bg-black/25 rounded-xl p-2 flex items-center justify-between text-[10px] font-mono">
                <span className={`px-1.5 py-0.5 rounded ${liveTripStatus === "ASSIGNED" ? "bg-white text-emerald-900 font-bold" : "text-emerald-200"}`}>
                  1. Accepted
                </span>
                <span>→</span>
                <span className={`px-1.5 py-0.5 rounded ${liveTripStatus === "EN_ROUTE" ? "bg-white text-emerald-900 font-bold" : "text-emerald-200"}`}>
                  2. En Route
                </span>
                <span>→</span>
                <span className={`px-1.5 py-0.5 rounded ${liveTripStatus === "ARRIVED" ? "bg-white text-emerald-900 font-bold" : "text-emerald-200"}`}>
                  3. Arrived
                </span>
                <span>→</span>
                <span className={`px-1.5 py-0.5 rounded ${liveTripStatus === "IN_PROGRESS" ? "bg-white text-emerald-900 font-bold" : "text-emerald-200"}`}>
                  4. On Trip
                </span>
              </div>
            </div>
          )}

          {/* Location Inputs Card */}
          <Card className="p-4 bg-slate-900/90 border border-slate-800">
            <div className="flex items-start gap-3">
              {/* Route line visual indicator */}
              <div className="flex flex-col items-center gap-1 flex-none pt-3">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 border-2 border-white" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 via-slate-600 to-blue-500 rounded-full" />
                <div className="w-3.5 h-3.5 bg-blue-600 rounded-full shadow-lg shadow-blue-600/50 border-2 border-white" />
              </div>

              {/* Input fields */}
              <div className="flex-1 space-y-2.5 min-w-0">
                {/* Pickup Input */}
                <div className="relative">
                  <input
                    value={pickup}
                    onChange={e => {
                      setPickup(e.target.value);
                      setShowPickupSuggestions(true);
                    }}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 300)}
                    placeholder="Pickup location"
                    className="w-full pl-3.5 pr-20 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={() => setMapTargetMode("pickup")}
                      title="Click map to pick location"
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-all ${
                        mapTargetMode === "pickup"
                          ? "bg-emerald-500 text-slate-950 shadow"
                          : "bg-slate-700/80 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Pick on Map
                    </button>
                  </div>
                  {showPickupSuggestions && pickup.trim().length > 0 && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1.5 bg-[#0e1e36] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-[999] max-h-56 overflow-y-auto divide-y divide-slate-800/80"
                      onMouseDown={e => e.preventDefault()}
                    >
                      {(() => {
                        const q = pickup.trim().toLowerCase();
                        const matches = SL_PLACES.filter(p => p.label.toLowerCase().includes(q) || p.addr.toLowerCase().includes(q));
                        if (matches.length === 0) {
                          return (
                            <div className="px-3 py-2.5 text-center text-slate-400 text-xs">
                              No matching Sri Lankan places found
                            </div>
                          );
                        }
                        return matches.map(p => (
                          <div 
                            key={p.label}
                            className="px-3.5 py-2.5 hover:bg-slate-800/90 active:bg-emerald-600/30 cursor-pointer text-xs transition-colors flex items-center gap-2.5"
                            onMouseDown={e => {
                              e.preventDefault();
                              selectPickupPlace(p);
                            }}
                            onClick={() => selectPickupPlace(p)}
                          >
                            <span className="text-base flex-none">🟢</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white truncate">{p.label}</p>
                              <p className="text-slate-400 text-[10px] truncate">{p.addr}</p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Dropoff Input */}
                <div className="relative">
                  <input
                    value={dropoff}
                    onChange={e => {
                      setDropoff(e.target.value);
                      setShowDropoffSuggestions(true);
                      if (e.target.value.length > 2) setStep("selecting");
                    }}
                    onFocus={() => setShowDropoffSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 300)}
                    placeholder="Where to? (e.g. Airport, Galle Face)"
                    className="w-full pl-3.5 pr-20 py-2.5 bg-slate-800/90 border border-blue-600/60 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {dropoff ? (
                      <button
                        onClick={() => { setDropoff(""); setDropoffCoords(null); setStep("idle"); }}
                        className="text-slate-400 hover:text-white text-sm px-1.5 py-0.5"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        onClick={() => setMapTargetMode("dropoff")}
                        title="Click map to set destination"
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          mapTargetMode === "dropoff"
                            ? "bg-blue-500 text-white shadow"
                            : "bg-slate-700/80 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        Pick on Map
                      </button>
                    )}
                  </div>
                  {showDropoffSuggestions && dropoff.trim().length > 0 && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1.5 bg-[#0e1e36] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-[999] max-h-56 overflow-y-auto divide-y divide-slate-800/80"
                      onMouseDown={e => e.preventDefault()}
                    >
                      {(() => {
                        const q = dropoff.trim().toLowerCase();
                        const matches = SL_PLACES.filter(p => p.label.toLowerCase().includes(q) || p.addr.toLowerCase().includes(q));
                        if (matches.length === 0) {
                          return (
                            <div className="px-3 py-2.5 text-center text-slate-400 text-xs">
                              No matching Sri Lankan places found
                            </div>
                          );
                        }
                        return matches.map(p => (
                          <div 
                            key={p.label}
                            className="px-3.5 py-2.5 hover:bg-slate-800/90 active:bg-blue-600/30 cursor-pointer text-xs transition-colors flex items-center gap-2.5"
                            onMouseDown={e => {
                              e.preventDefault();
                              selectDropoffPlace(p);
                            }}
                            onClick={() => selectDropoffPlace(p)}
                          >
                            <span className="text-base flex-none">📍</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white truncate">{p.label}</p>
                              <p className="text-slate-400 text-[10px] truncate">{p.addr}</p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick saved destinations */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Saved & Popular Destinations</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {SAVED_PLACES.map(p => {
                  const isChosen = dropoff === p.addr;
                  return (
                    <button
                      key={p.label}
                      onClick={() => pickSavedPlace(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-none ${
                        isChosen
                          ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10"
                          : "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Ride Type Selector */}
          {(step === "selecting" || step === "confirm" || step === "matched") && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Select Vehicle Tier</p>
              <div className="grid grid-cols-1 gap-2">
                {RIDE_TYPES.map(r => {
                  const f = Math.round(r.base + (estimatedDistance > 0 ? estimatedDistance : DISTANCE) * r.perKm);
                  const isSelected = rideType === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => { setRide(r.key); if (step === "confirm") setStep("selecting"); }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all ${
                        isSelected
                          ? "bg-emerald-950/40 border-2 border-emerald-500/80 shadow-lg shadow-emerald-900/30"
                          : "bg-slate-900/70 border border-slate-800 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="text-3xl flex-none">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-white text-sm">{r.label}</p>
                          {isSelected && <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 rounded">Selected</span>}
                        </div>
                        <p className="text-xs mt-0.5 text-slate-400">{r.desc}</p>
                      </div>
                      <div className="text-right flex-none">
                        <p className={`font-black font-mono text-base ${isSelected ? "text-emerald-400" : "text-slate-300"}`}>
                          LKR {f.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500">
                          {estimatedDistance > 0 ? estimatedDistance.toFixed(1) : DISTANCE} km
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fare confirmed summary */}
          {(step === "confirm" || step === "searching" || step === "matched") && (
            <Card className="p-4 bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-black text-white text-sm">Fare Breakdown</p>
                <Pill color="eco">Guaranteed Price</Pill>
              </div>

              <div className="space-y-1.5">
                {FARE_ROWS.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-mono font-semibold text-slate-200">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2">
                  <span className="font-extrabold text-white text-sm">Total Fare</span>
                  <span className="font-black font-mono text-xl text-emerald-400">LKR {fare.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment method selector */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <span>💵</span>
                  <span className="font-semibold text-slate-200">Cash Payment on Arrival</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">DEFAULT</span>
              </div>

              {bookingError && (
                <div className="bg-red-950/80 border border-red-500/80 text-red-200 text-xs p-2.5 rounded-xl font-mono">
                  ⚠️ {bookingError}
                </div>
              )}

              {/* CTA Buttons */}
              {step === "confirm" && (
                <Btn
                  v="primary"
                  size="xl"
                  full
                  onClick={async () => {
                    setStep("searching");
                    setLiveTripStatus("REQUESTED");
                    NotificationService.sendTripAlert(
                      "Ride Requested 📍",
                      `Searching for nearby ${selected.label} drivers near ${pickup.slice(0, 28)}…`
                    );

                    let tripId = `TRIP-${Date.now().toString().slice(-5)}`;
                    let activeData: any = {
                      tripId,
                      fare: fare,
                      distance: estimatedDistance || DISTANCE,
                      pickup: pickup,
                      dropoff: dropoff,
                      passengerName: tabStorage.getItem("user_name") || "Lahiru Peris",
                      driverName: "Kamal Perera",
                      vehiclePlate: "CAB-4821"
                    };

                    try {
                      const response: any = await apiClient('/rides/book', {
                        method: 'POST',
                        body: JSON.stringify({
                          pickupAddress: pickup,
                          pickupLat: pickupCoords.lat,
                          pickupLng: pickupCoords.lng,
                          dropoffAddress: dropoff,
                          dropoffLat: dropoffCoords?.lat ?? 6.9329,
                          dropoffLng: dropoffCoords?.lng ?? 79.8438,
                          rideType: rideType.toUpperCase(),
                          paymentMethod: "CASH"
                        })
                      });
                      if (response) {
                        tripId = (response.tripId ?? response.id ?? tripId).toString();
                        activeData.tripId = tripId;
                        activeData.fare = response.totalFare ?? fare;
                        activeData.distance = response.distanceKm ?? estimatedDistance ?? DISTANCE;
                        if (response.driverName) activeData.driverName = response.driverName;
                        if (response.vehiclePlate) activeData.vehiclePlate = response.vehiclePlate;
                      }
                    } catch (err) {
                      console.warn("Backend /rides/book fallback:", err);
                    }

                    tabStorage.setItem('active_trip', JSON.stringify(activeData));

                    // Broadcast RIDE_REQUESTED to Driver Tab 2 immediately!
                    tripSyncService.publishRideRequested({
                      tripId: activeData.tripId,
                      passengerName: activeData.passengerName,
                      pickupAddress: pickup,
                      pickupLat: pickupCoords.lat,
                      pickupLng: pickupCoords.lng,
                      dropoffAddress: dropoff,
                      dropoffLat: dropoffCoords?.lat ?? 6.9329,
                      dropoffLng: dropoffCoords?.lng ?? 79.8438,
                      rideType: selected.label,
                      estimatedFare: activeData.fare,
                      estimatedDistanceKm: activeData.distance,
                    });
                  }}
                >
                  Confirm & Request {selected.label} →
                </Btn>
              )}

              {step === "searching" && (
                <div className="space-y-2">
                  <Btn v="secondary" size="lg" full disabled>
                    <span className="flex items-center justify-center gap-1.5">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      ))}
                      <span className="ml-2">Connecting with nearby drivers…</span>
                    </span>
                  </Btn>
                  <Btn v="ghost" size="sm" full onClick={handleCancelTrip}>
                    ✕ Cancel Search
                  </Btn>
                </div>
              )}

              {step === "matched" && (
                <div className="space-y-2 pt-1">
                  <Btn
                    v="primary"
                    size="xl"
                    full
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'payment' } }));
                    }}
                  >
                    Proceed to Trip & Payment →
                  </Btn>
                  <Btn v="danger" size="md" full onClick={handleCancelTrip}>
                    Cancel Ride
                  </Btn>
                </div>
              )}
            </Card>
          )}

          {/* Estimate CTA */}
          {step === "selecting" && (
            <Btn
              v="primary"
              size="xl"
              full
              onClick={() => setStep("estimating")}
              disabled={!dropoff}
            >
              Calculate Route & Fare Estimate →
            </Btn>
          )}

          {/* Idle prompt */}
          {step === "idle" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
              <span className="text-4xl block mb-2">🗺️</span>
              <p className="font-extrabold text-white text-sm">Explore Colombo Metro on the Map</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Click anywhere on the wide map to instantly set your pickup or destination, or type in the boxes above.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ── RIGHT COLUMN: EXPANSIVE FULL-WIDTH INTERACTIVE LEAFLET MAP ── */}
      <div className="order-1 lg:order-2 flex-1 min-h-[50vh] lg:min-h-0 lg:h-[calc(100vh-65px)] relative overflow-hidden">

        {/* Live OsmMap with Real Leaflet Markers */}
        <OsmMap
          height="100%"
          dark={isDarkMode}
          animate={step === "confirm" || step === "searching" || step === "matched"}
          showPickup
          showDropoff={!!dropoffCoords || !!dropoff}
          pickupAddress={pickup}
          dropoffAddress={dropoff}
          pickupLat={pickupCoords.lat}
          pickupLng={pickupCoords.lng}
          dropoffLat={dropoffCoords?.lat}
          dropoffLng={dropoffCoords?.lng}
          myLat={myCoords?.lat}
          myLng={myCoords?.lng}
          driverMarkers={driverMarkers}
          autoCenter={true}
          onMapClick={handleMapClick}
          onMapReady={(map) => { leafletMapRef.current = map; }}
          className="w-full h-full"
        />

        {/* Floating Searching Overlay */}
        {step === "searching" && (
          <div className="absolute inset-0 bg-[#08111e]/65 backdrop-blur-sm flex items-center justify-center z-[850] p-4">
            <div className="bg-[#0b1b33]/98 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-sm text-center shadow-2xl">
              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full bg-emerald-400"
                    style={{ animation: `blink 1.2s ease-in-out ${i * 0.22}s infinite` }}
                  />
                ))}
              </div>
              <h3 className="text-lg font-black text-white">Matching with Nearby Driver</h3>
              <p className="text-xs text-emerald-400 font-mono mt-1">Broadcasting request to online drivers…</p>
              
              <div className="mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-left text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <span>⚡</span>
                  <span>2-Tab Viva Demo Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Switch to <strong>Tab 2 (Driver)</strong> and click <strong>"Accept Trip"</strong> to watch real-time cross-tab synchronization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOP LEFT: Quick Telemetry Badge */}
        <div className="absolute top-4 left-4 z-[900] flex flex-wrap items-center gap-2">
          <div className="bg-[#091426]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-white font-mono">
              {drivers.length} Nearby Eco-Cabs Active
            </span>
          </div>

          <div className="hidden sm:flex bg-[#091426]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg text-[11px] font-mono text-slate-300 items-center gap-1.5">
            <span>📍 Map target:</span>
            <span className={`font-bold uppercase ${mapTargetMode === "pickup" ? "text-emerald-400" : "text-blue-400"}`}>
              {mapTargetMode}
            </span>
            <button
              onClick={() => setMapTargetMode(m => m === "pickup" ? "dropoff" : "pickup")}
              className="text-[10px] underline ml-1 text-slate-400 hover:text-white"
            >
              Switch
            </button>
          </div>
        </div>

        {/* TOP RIGHT: Map Layer & Zoom Controls */}
        <div className="absolute top-4 right-4 z-[900] flex flex-col gap-2">
          {/* Dark / Light toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Map Style"
            className="w-10 h-10 bg-[#091426]/95 hover:bg-slate-800 text-white rounded-xl shadow-xl border border-slate-700 flex items-center justify-center text-sm transition-all active:scale-95"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          {/* Zoom In */}
          <button
            onClick={() => leafletMapRef.current?.zoomIn()}
            title="Zoom In"
            className="w-10 h-10 bg-[#091426]/95 hover:bg-slate-800 text-white font-black text-lg rounded-xl shadow-xl border border-slate-700 flex items-center justify-center transition-all active:scale-95"
          >
            +
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => leafletMapRef.current?.zoomOut()}
            title="Zoom Out"
            className="w-10 h-10 bg-[#091426]/95 hover:bg-slate-800 text-white font-black text-lg rounded-xl shadow-xl border border-slate-700 flex items-center justify-center transition-all active:scale-95"
          >
            −
          </button>
        </div>

        {/* BOTTOM RIGHT: High-Visibility Re-Center "Locate Me" Button */}
        <div className="absolute bottom-6 right-6 z-[900] flex flex-col items-end gap-2">
          <button
            onClick={recenterToMyLocation}
            title="Center map on my location"
            className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-2xl border border-blue-400/50 active:scale-95 transition-all"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🎯</span>
            <span className="hidden sm:inline">Recenter on Me</span>
          </button>
        </div>

        {/* BOTTOM LEFT: Interactive Hint Bar */}
        <div className="absolute bottom-6 left-6 z-[900] hidden sm:block max-w-sm">
          <div className="bg-[#091426]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-xl text-xs text-slate-300 flex items-center gap-2">
            <span>💡</span>
            <span>
              Click anywhere on the map to set your <strong>{mapTargetMode}</strong> location.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
