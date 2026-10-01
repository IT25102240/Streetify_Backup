/**
 * FareCalculationService — Calculates trip fares based on:
 * - Base fare per vehicle type
 * - Distance traveled (per km rate)
 * - Time duration (per minute rate)
 * - Fuel cost calculation
 * - Demand/surge pricing
 * - Platform fee
 * 
 * Generates detailed receipts for both driver and passenger
 */

export type VehicleType = "STANDARD" | "XL" | "MOTO";
export type PaymentMethod = "CASH" | "CARD" | "WALLET";

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  fuelCost: number;
  demandSurcharge: number;
  platformFee: number;
  totalFare: number;
  driverNet: number;
  platformCommission: number;
}

export interface TripDetails {
  tripId: string;
  vehicleType: VehicleType;
  distanceKm: number;
  durationMinutes: number;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  passengerName: string;
  driverName: string;
  vehiclePlate: string;
  vehicleModel: string;
  paymentMethod: PaymentMethod;
  startTime: Date;
  endTime: Date;
}

export interface ReceiptData extends TripDetails {
  fareBreakdown: FareBreakdown;
  generatedAt: Date;
  receiptNumber: string;
}

// Vehicle type configurations with Sri Lankan market rates
const VEHICLE_CONFIGS: Record<VehicleType, {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  fuelConsumptionLtrPerKm: number; // Liters per km
  fuelPricePerLtr: number; // LKR per liter (current Sri Lankan price)
  demandMultiplier: { min: number; max: number }; // Surge pricing range
}> = {
  STANDARD: {
    baseFare: 200,
    perKmRate: 33,
    perMinuteRate: 5,
    fuelConsumptionLtrPerKm: 0.08, // ~12.5 km/L
    fuelPricePerLtr: 350, // Current petrol price in LKR
    demandMultiplier: { min: 1.0, max: 2.5 },
  },
  XL: {
    baseFare: 340,
    perKmRate: 48,
    perMinuteRate: 7,
    fuelConsumptionLtrPerKm: 0.12, // ~8.3 km/L
    fuelPricePerLtr: 350,
    demandMultiplier: { min: 1.0, max: 2.5 },
  },
  MOTO: {
    baseFare: 80,
    perKmRate: 18,
    perMinuteRate: 3,
    fuelConsumptionLtrPerKm: 0.03, // ~33 km/L
    fuelPricePerLtr: 350,
    demandMultiplier: { min: 1.0, max: 2.0 },
  },
};

const PLATFORM_COMMISSION_RATE = 0.15; // 15%
const PLATFORM_FEE = 4; // Fixed platform fee in LKR

class FareCalculationServiceImpl {
  /**
   * Calculate demand/surge multiplier based on time and simulated demand
   */
  private calculateDemandMultiplier(vehicleType: VehicleType): number {
    const config = VEHICLE_CONFIGS[vehicleType];
    const hour = new Date().getHours();
    
    // Peak hours: 7-9 AM, 5-7 PM
    const isMorningPeak = hour >= 7 && hour <= 9;
    const isEveningPeak = hour >= 17 && hour <= 19;
    const isPeak = isMorningPeak || isEveningPeak;
    
    // Weekend factor
    const isWeekend = [0, 6].includes(new Date().getDay());
    
    let multiplier = config.demandMultiplier.min;
    
    if (isPeak) {
      multiplier = config.demandMultiplier.min + (config.demandMultiplier.max - config.demandMultiplier.min) * 0.7;
    } else if (isWeekend) {
      multiplier = config.demandMultiplier.min + (config.demandMultiplier.max - config.demandMultiplier.min) * 0.3;
    }
    
    // Add some randomness to simulate real demand
    multiplier += (Math.random() - 0.5) * 0.2;
    
    return Math.max(config.demandMultiplier.min, Math.min(config.demandMultiplier.max, multiplier));
  }

  /**
   * Calculate fare breakdown for a trip
   */
  calculateFare(
    vehicleType: VehicleType,
    distanceKm: number,
    durationMinutes: number
  ): FareBreakdown {
    const config = VEHICLE_CONFIGS[vehicleType];
    const demandMultiplier = this.calculateDemandMultiplier(vehicleType);
    
    const baseFare = config.baseFare;
    const distanceFare = distanceKm * config.perKmRate * demandMultiplier;
    const timeFare = durationMinutes * config.perMinuteRate * demandMultiplier;
    const fuelCost = distanceKm * config.fuelConsumptionLtrPerKm * config.fuelPricePerLtr;
    const demandSurcharge = (distanceFare + timeFare) * (demandMultiplier - 1);
    
    const subtotal = baseFare + distanceFare + timeFare;
    const totalFare = Math.round(subtotal + fuelCost + PLATFORM_FEE);
    
    const platformCommission = Math.round(totalFare * PLATFORM_COMMISSION_RATE);
    const driverNet = totalFare - platformCommission;
    
    return {
      baseFare: Math.round(baseFare),
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare),
      fuelCost: Math.round(fuelCost),
      demandSurcharge: Math.round(demandSurcharge),
      platformFee: PLATFORM_FEE,
      totalFare,
      driverNet,
      platformCommission,
    };
  }

  /**
   * Estimate fare before trip (for booking screen)
   */
  estimateFare(vehicleType: VehicleType, estimatedDistanceKm: number, estimatedDurationMinutes: number): FareBreakdown {
    return this.calculateFare(vehicleType, estimatedDistanceKm, estimatedDurationMinutes);
  }

  /**
   * Generate complete receipt data for a completed trip
   */
  generateReceipt(tripDetails: TripDetails): ReceiptData {
    const fareBreakdown = this.calculateFare(
      tripDetails.vehicleType,
      tripDetails.distanceKm,
      tripDetails.durationMinutes
    );

    const receiptNumber = `RCPT-${tripDetails.tripId}-${Date.now().toString().slice(-6)}`;

    return {
      ...tripDetails,
      fareBreakdown,
      generatedAt: new Date(),
      receiptNumber,
    };
  }

  /**
   * Format receipt for display (driver view)
   */
  formatDriverReceipt(receipt: ReceiptData): string {
    const { fareBreakdown, ...trip } = receipt;
    return `
═══════════════════════════════
       STREETIFY DRIVER RECEIPT
═══════════════════════════════
Receipt: ${receipt.receiptNumber}
Date: ${receipt.generatedAt.toLocaleDateString('en-GB')} ${receipt.generatedAt.toLocaleTimeString('en-GB')}

TRIP DETAILS
Trip ID: ${trip.tripId}
Vehicle: ${trip.vehicleModel} (${trip.vehiclePlate})
Driver: ${trip.driverName}
Passenger: ${trip.passengerName}
Route: ${trip.pickupAddress} → ${trip.dropoffAddress}
Distance: ${trip.distanceKm.toFixed(1)} km
Duration: ${trip.durationMinutes} min
Payment: ${trip.paymentMethod}

FARE BREAKDOWN
Base Fare:              LKR ${fareBreakdown.baseFare.toLocaleString()}
Distance (${trip.distanceKm.toFixed(1)} km):      LKR ${fareBreakdown.distanceFare.toLocaleString()}
Time (${trip.durationMinutes} min):            LKR ${fareBreakdown.timeFare.toLocaleString()}
Fuel Cost:              LKR ${fareBreakdown.fuelCost.toLocaleString()}
Demand Surcharge:       LKR ${fareBreakdown.demandSurcharge.toLocaleString()}
Platform Fee:           LKR ${fareBreakdown.platformFee.toLocaleString()}
────────────────────────────────────
TOTAL FARE:             LKR ${fareBreakdown.totalFare.toLocaleString()}

DRIVER EARNINGS
Total Collected:        LKR ${fareBreakdown.totalFare.toLocaleString()}
Platform Commission (15%): - LKR ${fareBreakdown.platformCommission.toLocaleString()}
────────────────────────────────────
YOUR NET PAYOUT:        LKR ${fareBreakdown.driverNet.toLocaleString()}

${trip.paymentMethod === "CASH" ? "Collect CASH from passenger" : "Amount settled via " + trip.paymentMethod}
═══════════════════════════════
    `.trim();
  }

  /**
   * Format receipt for display (passenger view)
   */
  formatPassengerReceipt(receipt: ReceiptData): string {
    const { fareBreakdown, ...trip } = receipt;
    return `
═══════════════════════════════
       STREETIFY PASSENGER RECEIPT
═══════════════════════════════
Receipt: ${receipt.receiptNumber}
Date: ${receipt.generatedAt.toLocaleDateString('en-GB')} ${receipt.generatedAt.toLocaleTimeString('en-GB')}

TRIP DETAILS
Trip ID: ${trip.tripId}
Vehicle: ${trip.vehicleModel} (${trip.vehiclePlate})
Driver: ${trip.driverName}
Route: ${trip.pickupAddress} → ${trip.dropoffAddress}
Distance: ${trip.distanceKm.toFixed(1)} km
Duration: ${trip.durationMinutes} min
Payment: ${trip.paymentMethod}

FARE BREAKDOWN
Base Fare:              LKR ${fareBreakdown.baseFare.toLocaleString()}
Distance (${trip.distanceKm.toFixed(1)} km):      LKR ${fareBreakdown.distanceFare.toLocaleString()}
Time (${trip.durationMinutes} min):            LKR ${fareBreakdown.timeFare.toLocaleString()}
Fuel Cost:              LKR ${fareBreakdown.fuelCost.toLocaleString()}
Demand Surcharge:       LKR ${fareBreakdown.demandSurcharge.toLocaleString()}
Platform Fee:           LKR ${fareBreakdown.platformFee.toLocaleString()}
────────────────────────────────────
TOTAL PAID:             LKR ${fareBreakdown.totalFare.toLocaleString()}

Thank you for riding with Streetify!
═══════════════════════════════
    `.trim();
  }

  /**
   * Get vehicle config for display
   */
  getVehicleConfig(vehicleType: VehicleType) {
    return VEHICLE_CONFIGS[vehicleType];
  }

  /**
   * Get all vehicle configs
   */
  getAllVehicleConfigs() {
    return VEHICLE_CONFIGS;
  }
}

export const fareCalculationService = new FareCalculationServiceImpl();