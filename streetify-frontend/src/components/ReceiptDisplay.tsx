/**
 * ReceiptDisplay — Component to show trip receipt for both driver and passenger
 * Includes detailed fare breakdown, trip details, and print/email options
 */

import { useState, useEffect } from "react";
import { Btn, Card } from "../ui";
import { fareCalculationService, type ReceiptData } from "../services/fareCalculationService";
import { NotificationService } from "../services/notificationService";
import { tabStorage } from "../utils/storage";

interface ReceiptDisplayProps {
  receipt: ReceiptData | null;
  viewAs: "driver" | "passenger";
  onClose: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onNextTrip?: () => void;
  onRateDriver?: () => void;
  onViewHistory?: () => void;
}

export default function ReceiptDisplay({
  receipt,
  viewAs,
  onClose,
  onPrint,
  onEmail,
  onNextTrip,
  onRateDriver,
  onViewHistory,
}: ReceiptDisplayProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  if (!receipt) return null;

  const formattedReceipt = viewAs === "driver" 
    ? fareCalculationService.formatDriverReceipt(receipt)
    : fareCalculationService.formatPassengerReceipt(receipt);

  const { fareBreakdown, ...trip } = receipt;

  return (
    <div className="min-h-screen relative z-0 flex items-start justify-center py-10 px-4">
      <div className="absolute inset-0 -z-10 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 -z-10 bg-slate-950/70 backdrop-blur-[40px]" />
      <div className="w-full max-w-md" style={{ animation: "pop-in .42s cubic-bezier(.22,1,.36,1) both" }}>
        <Card className="overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-br ${viewAs === "driver" ? "from-emerald-600 to-emerald-700" : "from-blue-600 to-blue-700"} text-white py-12 px-6 text-center`}>
            <div className="w-20 h-20 bg-navy border-eco/10/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">{viewAs === "driver" ? "💰" : "🧾"}</span>
            </div>
            <p className="text-2xl font-extrabold">
              {viewAs === "driver" ? "Trip Completed - Earnings" : "Payment Successful - Receipt"}
            </p>
            <p className="text-emerald-200 text-sm mt-2">
              {viewAs === "driver" 
                ? `Your net payout: LKR ${fareBreakdown.driverNet.toLocaleString()}`
                : `Total paid: LKR ${fareBreakdown.totalFare.toLocaleString()}`}
            </p>
          </div>

          {/* Tear perforation */}
          <div className="relative flex items-center h-0 z-10">
            <div className="absolute left-0 w-5 h-8 bg-slate-950 rounded-r-full -ml-px" />
            <div className="absolute right-0 w-5 h-8 bg-slate-950 rounded-l-full -mr-px" />
            <div className="w-full border-t border-dashed border-slate-700 mx-4" />
          </div>

          {/* Receipt Body */}
          <div className="px-6 pt-7 pb-8 space-y-5">
            {/* Trip Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-3">Trip Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Trip ID</span>
                  <span className="font-mono font-semibold text-white">{trip.tripId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle</span>
                  <span className="font-mono font-semibold text-white">{trip.vehicleModel} ({trip.vehiclePlate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver</span>
                  <span className="font-mono font-semibold text-white">{trip.driverName}</span>
                </div>
                {viewAs === "passenger" && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Passenger</span>
                    <span className="font-mono font-semibold text-white">{trip.passengerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Route</span>
                  <span className="font-mono font-semibold text-white truncate max-w-[180px] text-right">
                    {trip.pickupAddress} → {trip.dropoffAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance</span>
                  <span className="font-mono font-semibold text-white">{trip.distanceKm.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-mono font-semibold text-white">{trip.durationMinutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment</span>
                  <span className="font-mono font-semibold text-white">{trip.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="font-mono font-semibold text-white">
                    {trip.generatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {trip.generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Fare Breakdown */}
            <div className="space-y-2.5">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Fare Breakdown</p>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Base Fare</span>
                  <span className="font-mono font-medium">LKR {fareBreakdown.baseFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Distance ({trip.distanceKm.toFixed(1)} km × LKR {fareBreakdown.distanceFare / trip.distanceKm | 0})</span>
                  <span className="font-mono font-medium">LKR {fareBreakdown.distanceFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Time ({trip.durationMinutes} min)</span>
                  <span className="font-mono font-medium">LKR {fareBreakdown.timeFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Fuel Cost</span>
                  <span className="font-mono font-medium">LKR {fareBreakdown.fuelCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span className="text-amber-400">Demand Surcharge</span>
                  <span className="font-mono font-medium text-amber-400">LKR {fareBreakdown.demandSurcharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Platform Fee</span>
                  <span className="font-mono font-medium">LKR {fareBreakdown.platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700 font-extrabold text-white text-lg">
                  <span>Total Fare</span>
                  <span className="font-mono text-emerald-400">LKR {fareBreakdown.totalFare.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Driver Earnings Section (only for driver view) */}
            {viewAs === "driver" && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest font-mono flex items-center gap-2">
                  <span>💰</span> Your Earnings
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Collected</span>
                    <span className="font-mono font-semibold text-white">LKR {fareBreakdown.totalFare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-orange-400">Platform Commission (15%)</span>
                    <span className="font-mono font-semibold text-orange-400">− LKR {fareBreakdown.platformCommission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-500/30 font-extrabold text-emerald-400 text-lg">
                    <span>Net Payout</span>
                    <span className="font-mono text-white">LKR {fareBreakdown.driverNet.toLocaleString()}</span>
                  </div>
                </div>
                {trip.paymentMethod === "CASH" && (
                  <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
                    <span>💵</span>
                    <span>Collect CASH from passenger: <strong className="text-amber-100">LKR {fareBreakdown.totalFare.toLocaleString()}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* QR Code placeholder */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-20 h-20 bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.4 ? "bg-slate-800" : "bg-navy border-eco/10 border border-slate-800"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">Scan to verify receipt</p>
            </div>

            {/* Receipt Meta */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-500 space-y-1.5">
              <p>📅 {trip.generatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {trip.generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
              <p>🗺 {trip.pickupAddress} → {trip.dropoffAddress}</p>
              <p>🚗 {trip.driverName} · {trip.vehiclePlate}</p>
              <p>💳 {trip.paymentMethod === "card" ? "Card Payment" : trip.paymentMethod === "wallet" ? "Streetify Wallet" : "Cash to driver"}</p>
              <p className="text-emerald-400 font-bold">🔒 Receipt: {trip.receiptNumber}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {onPrint && (
                  <Btn v="secondary" size="md" className="flex-1" onClick={() => { onPrint?.(); window.print(); }}>
                    🖨️ Print Receipt
                  </Btn>
                )}
                {onEmail && (
                  <Btn v="secondary" size="md" className="flex-1" onClick={() => {
                    NotificationService.sendReceipt(trip.tripId, fareBreakdown.totalFare, trip.paymentMethod);
                    alert("Receipt PDF dispatched to your registered email!");
                    onEmail?.();
                  }}>
                    📧 Email PDF
                  </Btn>
                )}
              </div>
              
              {viewAs === "driver" ? (
                <div className="grid grid-cols-2 gap-2">
                  {onNextTrip && (
                    <Btn v="primary" size="lg" full onClick={onNextTrip}>
                      🚗 Next Trip
                    </Btn>
                  )}
                  {onViewHistory && (
                    <Btn v="secondary" size="lg" full onClick={onViewHistory}>
                      📋 Trip History
                    </Btn>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {onRateDriver && (
                    <Btn v="primary" size="lg" full onClick={onRateDriver}>
                      ⭐ Rate Driver
                    </Btn>
                  )}
                  {onViewHistory && (
                    <Btn v="secondary" size="lg" full onClick={onViewHistory}>
                      📋 Trip History
                    </Btn>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}