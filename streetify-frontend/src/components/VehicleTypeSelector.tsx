/**
 * VehicleTypeSelector — Popup component for passengers to select vehicle type
 * Shows available real-time drivers + demo drivers for each vehicle type
 * Includes real-time driver count and demo driver availability
 */

import { useState, useEffect, useRef } from "react";
import { Btn, Card, Pill } from "../ui";
import { demoDriverService, demoDriversToMarkers, type DemoDriver, type VehicleType } from "../services/demoDriverService";
import { fareCalculationService } from "../services/fareCalculationService";
import { tabStorage } from "../utils/storage";

interface VehicleTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vehicleType: VehicleType, selectedDriver?: DemoDriver) => void;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  realDriverCounts?: Record<VehicleType, number>;
}

const VEHICLE_TYPE_CONFIG: Record<VehicleType, { 
  label: string; 
  icon: string; 
  desc: string;
  capacity: string;
}> = {
  STANDARD: { label: "Standard", icon: "🚗", desc: "Sedan · up to 4 passengers", capacity: "4 seats" },
  XL: { label: "Streetify XL", icon: "🚐", desc: "SUV/Van · up to 7 passengers", capacity: "7 seats" },
  MOTO: { label: "Moto", icon: "🏍️", desc: "Motorcycle · fastest & cheapest", capacity: "1-2 seats" },
};

export default function VehicleTypeSelector({
  isOpen,
  onClose,
  onSelect,
  pickupAddress,
  dropoffAddress,
  estimatedDistanceKm,
  estimatedDurationMinutes,
  realDriverCounts = { STANDARD: 0, XL: 0, MOTO: 0 },
}: VehicleTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<VehicleType>("STANDARD");
  const [demoDrivers, setDemoDrivers] = useState<DemoDriver[]>([]);
  const [showDriverList, setShowDriverList] = useState<VehicleType | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to demo driver updates
  useEffect(() => {
    if (isOpen) {
      unsubscribeRef.current = demoDriverService.subscribe(setDemoDrivers);
    }
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [isOpen]);

  // Get available demo drivers for selected type
  const availableDemoDrivers = demoDrivers.filter(
    d => d.vehicleType === selectedType && d.status === "available"
  );

  const realCount = realDriverCounts[selectedType] || 0;
  const demoCount = availableDemoDrivers.length;
  const totalAvailable = realCount + demoCount;

  // Get fare estimate for selected type
  const fareEstimate = fareCalculationService.estimateFare(
    selectedType,
    estimatedDistanceKm,
    estimatedDurationMinutes
  );

  const config = VEHICLE_TYPE_CONFIG[selectedType];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4"
         style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-white rounded-2xl"
           style={{
             background: "rgba(9,20,40,0.98)",
             border: "1px solid rgba(34,197,94,0.25)",
             backdropFilter: "blur(20px)",
             animation: "slide-up .35s cubic-bezier(.22,1,.36,1) both"
           }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(34,197,94,0.1)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-2 rounded-xl" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>🚗</span>
            <div>
              <h3 className="text-sm font-bold text-white">Choose Your Ride</h3>
              <p className="text-[11px]" style={{ color: "#7a95b0" }}>
                {pickupAddress?.slice(0, 25)} → {dropoffAddress?.slice(0, 25)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-white text-lg p-1.5 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: "#7a95b0" }}>✕</button>
        </div>

        {/* Route Summary */}
        <div className="p-4 bg-slate-900/50 border-b" style={{ borderColor: "rgba(34,197,94,0.1)" }}>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
            <span>📍</span>
            <span>{estimatedDistanceKm.toFixed(1)} km · ~{estimatedDurationMinutes} min</span>
          </div>
        </div>

        {/* Vehicle Type Grid */}
        <div className="p-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Available Vehicle Types</p>
          
          {(["STANDARD", "XL", "MOTO"] as VehicleType[]).map(type => {
            const vc = VEHICLE_TYPE_CONFIG[type];
            const rc = realDriverCounts[type] || 0;
            const dc = demoDrivers.filter(d => d.vehicleType === type && d.status === "available").length;
            const tc = rc + dc;
            const isSelected = selectedType === type;
            const fare = fareCalculationService.estimateFare(type, estimatedDistanceKm, estimatedDurationMinutes);
            
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all ${
                  isSelected
                    ? "bg-emerald-950/40 border-2 border-emerald-500/80 shadow-lg shadow-emerald-900/30"
                    : "bg-slate-900/70 border border-slate-800 hover:bg-slate-800/60"
                }`}
              >
                <span className="text-3xl flex-none">{vc.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-white text-sm">{vc.label}</p>
                    {isSelected && <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 rounded">Selected</span>}
                  </div>
                  <p className="text-xs mt-0.5 text-slate-400">{vc.desc}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {tc} available ({rc} real + {dc} demo)
                    </span>
                    <span className="text-slate-500">{vc.capacity}</span>
                  </div>
                </div>
                <div className="text-right flex-none">
                  <p className={`font-black font-mono text-base ${isSelected ? "text-emerald-400" : "text-slate-300"}`}>
                    LKR {fare.totalFare.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Estimated</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Type Details */}
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{config.icon}</span>
              <div>
                <p className="font-extrabold text-white text-lg">{config.label}</p>
                <p className="text-xs text-slate-400">{config.desc}</p>
              </div>
            </div>

            {/* Driver Availability */}
            <div className="bg-slate-800/50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver Availability</span>
                <Pill color={totalAvailable > 0 ? "green" : "red"}>
                  {totalAvailable > 0 ? `${totalAvailable} Available` : "None Available"}
                </Pill>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Real: <strong className="text-white">{realCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Demo: <strong className="text-white">{demoCount}</strong></span>
                </div>
              </div>
              
              {/* Show demo drivers list */}
              {demoCount > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowDriverList(showDriverList === selectedType ? null : selectedType)}
                    className="flex items-center justify-between w-full text-xs font-mono text-slate-300 hover:text-white"
                  >
                    <span>{showDriverList === selectedType ? "▲" : "▼"} View Demo Drivers</span>
                    <span className="text-emerald-400">{demoCount} drivers</span>
                  </button>
                  
                  {showDriverList === selectedType && (
                    <div className="mt-2 space-y-2" style={{ animation: "slide-up .2s ease both" }}>
                      {availableDemoDrivers.map(driver => (
                        <button
                          key={driver.id}
                          onClick={() => onSelect(selectedType, driver)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
                        >
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl flex-none">
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm">{driver.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{driver.plate} · {driver.vehicleModel}</p>
                          </div>
                          <div className="text-right flex-none">
                            <p className="font-bold text-emerald-400 text-sm">★ {driver.rating}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{driver.eta} min away</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fare Breakdown */}
            <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fare Breakdown</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Base fare</span><span className="font-mono font-semibold">LKR {fareEstimate.baseFare.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Distance ({estimatedDistanceKm.toFixed(1)} km)</span><span className="font-mono font-semibold">LKR {fareEstimate.distanceFare.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Time ({estimatedDurationMinutes} min)</span><span className="font-mono font-semibold">LKR {fareEstimate.timeFare.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Fuel cost</span><span className="font-mono font-semibold">LKR {fareEstimate.fuelCost.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Demand surcharge</span><span className="font-mono font-semibold text-amber-400">LKR {fareEstimate.demandSurcharge.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Platform fee</span><span className="font-mono font-semibold">LKR {fareEstimate.platformFee}</span></div>
                <div className="flex justify-between pt-2 border-t border-slate-700 font-extrabold text-white">
                  <span>Total</span>
                  <span className="font-mono text-emerald-400">LKR {fareEstimate.totalFare.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Btn
            v="primary"
            size="xl"
            full
            onClick={() => onSelect(selectedType)}
            disabled={totalAvailable === 0}
          >
            {totalAvailable === 0 ? "No Drivers Available" : `Confirm & Book ${config.label} →`}
          </Btn>
        </div>
      </div>
    </div>
  );
}