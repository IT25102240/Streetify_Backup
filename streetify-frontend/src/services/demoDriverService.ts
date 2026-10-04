/**
 * DemoDriverService — Manages demo drivers for demonstration purposes
 * 
 * Demo drivers are simulated drivers that:
 * - Are available in all vehicle types (3 per vehicle type)
 * - Can be used by passengers for demo rides
 * - Don't interfere with real online drivers
 * - Show on map for passengers to see available options
 * - Can actually complete trips for demonstration
 */

import { tabStorage } from "../utils/storage";

export type VehicleType = "STANDARD" | "XL" | "MOTO";
export type DemoDriverStatus = "available" | "on_trip" | "offline";

export interface DemoDriver {
  id: string;
  name: string;
  plate: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  lat: number;
  lng: number;
  heading: number;
  rating: number;
  eta: number; // minutes to passenger
  status: DemoDriverStatus;
  isDemo: true;
  currentTripId?: string;
}

// Base coordinates for demo drivers (default: Kandy - Deiyannewela Lane)
const COLOMBO_CENTER = { lat: 7.2847, lng: 80.6275 };

// Demo driver templates - 3 per vehicle type
const DEMO_DRIVER_TEMPLATES: Omit<DemoDriver, "id" | "lat" | "lng" | "heading" | "eta" | "status" | "currentTripId">[] = [
  // STANDARD (Car/Sedan) - 3 drivers
  { name: "Demo Kamal", plate: "DEMO-001", vehicleType: "STANDARD", vehicleModel: "Toyota Prius", rating: 4.95, isDemo: true },
  { name: "Demo Sunil", plate: "DEMO-002", vehicleType: "STANDARD", vehicleModel: "Honda Vezel", rating: 4.88, isDemo: true },
  { name: "Demo Nimal", plate: "DEMO-003", vehicleType: "STANDARD", vehicleModel: "Nissan Leaf", rating: 4.92, isDemo: true },
  // XL (SUV/Van) - 3 drivers
  { name: "Demo Ramesh", plate: "DEMO-004", vehicleType: "XL", vehicleModel: "Toyota HiAce", rating: 4.85, isDemo: true },
  { name: "Demo Asanka", plate: "DEMO-005", vehicleType: "XL", vehicleModel: "Nissan Caravan", rating: 4.78, isDemo: true },
  { name: "Demo Pradeep", plate: "DEMO-006", vehicleType: "XL", vehicleModel: "Hyundai H1", rating: 4.91, isDemo: true },
  // MOTO (Motorcycle) - 3 drivers
  { name: "Demo Kasun", plate: "DEMO-007", vehicleType: "MOTO", vehicleModel: "Honda PCX 150", rating: 4.96, isDemo: true },
  { name: "Demo Malith", plate: "DEMO-008", vehicleType: "MOTO", vehicleModel: "Yamaha NMAX", rating: 4.89, isDemo: true },
  { name: "Demo Tharindu", plate: "DEMO-009", vehicleType: "MOTO", vehicleModel: "Suzuki Burgman", rating: 4.93, isDemo: true },
];

// Offsets around center for initial positioning
const POSITION_OFFSETS = [
  { lat: 0.002, lng: -0.003 },
  { lat: -0.003, lng: 0.004 },
  { lat: 0.001, lng: 0.005 },
  { lat: -0.004, lng: -0.002 },
  { lat: 0.003, lng: 0.001 },
  { lat: -0.002, lng: 0.003 },
  { lat: 0.004, lng: -0.001 },
  { lat: -0.001, lng: -0.004 },
  { lat: 0.002, lng: 0.002 },
];

class DemoDriverServiceImpl {
  private demoDrivers: DemoDriver[] = [];
  private initialized = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(drivers: DemoDriver[]) => void> = new Set();

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;
    
    // Create demo drivers from templates
    this.demoDrivers = DEMO_DRIVER_TEMPLATES.map((template, index) => ({
      ...template,
      id: `demo-${template.plate}`,
      lat: COLOMBO_CENTER.lat + POSITION_OFFSETS[index].lat,
      lng: COLOMBO_CENTER.lng + POSITION_OFFSETS[index].lng,
      heading: Math.floor(Math.random() * 360),
      eta: Math.floor(Math.random() * 8) + 2, // 2-10 minutes
      status: "available" as DemoDriverStatus,
    }));

    this.initialized = true;
    this.startPositionUpdates();
  }

  private startPositionUpdates() {
    // Update positions every 5 seconds to simulate movement
    this.updateInterval = setInterval(() => {
      this.demoDrivers = this.demoDrivers.map(driver => {
        if (driver.status !== "available") return driver;
        
        // Small random movement
        const latDelta = (Math.random() - 0.5) * 0.001;
        const lngDelta = (Math.random() - 0.5) * 0.001;
        const newLat = Math.max(6.8, Math.min(7.2, driver.lat + latDelta));
        const newLng = Math.max(79.7, Math.min(80.1, driver.lng + lngDelta));
        
        // Update heading based on movement
        const heading = Math.atan2(lngDelta, latDelta) * (180 / Math.PI) + 180;
        
        return {
          ...driver,
          lat: newLat,
          lng: newLng,
          heading: Math.round(heading),
          eta: Math.max(1, driver.eta + (Math.random() > 0.7 ? -1 : Math.random() > 0.85 ? 1 : 0)),
        };
      });
      
      this.notifyListeners();
    }, 5000);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.demoDrivers]));
  }

  // Subscribe to demo driver updates
  subscribe(callback: (drivers: DemoDriver[]) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback([...this.demoDrivers]);
    return () => this.listeners.delete(callback);
  }

  // Get all demo drivers
  getAll(): DemoDriver[] {
    return [...this.demoDrivers];
  }

  // Get demo drivers by vehicle type
  getByVehicleType(vehicleType: VehicleType): DemoDriver[] {
    return this.demoDrivers.filter(d => d.vehicleType === vehicleType && d.status === "available");
  }

  // Get available demo drivers (all types)
  getAvailable(): DemoDriver[] {
    return this.demoDrivers.filter(d => d.status === "available");
  }

  // Get count of available drivers per vehicle type
  getAvailableCounts(): Record<VehicleType, number> {
    const counts: Record<VehicleType, number> = { STANDARD: 0, XL: 0, MOTO: 0 };
    this.demoDrivers.forEach(d => {
      if (d.status === "available") counts[d.vehicleType]++;
    });
    return counts;
  }

  // Assign demo driver to a trip
  assignToTrip(driverId: string, tripId: string): DemoDriver | null {
    const index = this.demoDrivers.findIndex(d => d.id === driverId);
    if (index === -1) return null;
    
    this.demoDrivers[index] = {
      ...this.demoDrivers[index],
      status: "on_trip",
      currentTripId: tripId,
    };
    this.notifyListeners();
    return this.demoDrivers[index];
  }

  // Complete trip and make driver available again
  completeTrip(driverId: string): DemoDriver | null {
    const index = this.demoDrivers.findIndex(d => d.id === driverId);
    if (index === -1) return null;
    
    this.demoDrivers[index] = {
      ...this.demoDrivers[index],
      status: "available",
      currentTripId: undefined,
      // Reset to a position near Colombo center
      lat: COLOMBO_CENTER.lat + POSITION_OFFSETS[index].lat + (Math.random() - 0.5) * 0.01,
      lng: COLOMBO_CENTER.lng + POSITION_OFFSETS[index].lng + (Math.random() - 0.5) * 0.01,
    };
    this.notifyListeners();
    return this.demoDrivers[index];
  }

  // Get demo driver by ID
  getById(id: string): DemoDriver | undefined {
    return this.demoDrivers.find(d => d.id === id);
  }

  // Cleanup
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.listeners.clear();
  }
}

export const demoDriverService = new DemoDriverServiceImpl();

// Helper to convert demo drivers to map marker format
export function demoDriversToMarkers(drivers: DemoDriver[]): import("../OsmMap").DriverMarkerData[] {
  return drivers.map(d => ({
    id: d.id,
    name: d.name,
    plate: d.plate,
    lat: d.lat,
    lng: d.lng,
    eta: d.eta,
    rating: d.rating,
    heading: d.heading,
  }));
}

// Check if demo mode is enabled
export function isDemoModeEnabled(): boolean {
  return tabStorage.getItem("demo_mode") === "true";
}

export function setDemoMode(enabled: boolean): void {
  tabStorage.setTabOnly("demo_mode", enabled ? "true" : "false");
}