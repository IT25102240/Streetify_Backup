/**
 * TripSyncService — Cross-Tab Real-Time Trip Synchronization
 *
 * Utilizes HTML5 BroadcastChannel ('streetify-trip-sync') to synchronize state
 * in real time across multiple browser tabs on localhost (e.g. Tab 1: Passenger,
 * Tab 2: Driver, Tab 3: Admin) with sub-5ms latency.
 *
 * Backed by localStorage storage events as fallback for older environments.
 */

export type TripSyncEventType =
  | "RIDE_REQUESTED"
  | "RIDE_ACCEPTED"
  | "TRIP_STATUS_UPDATED"
  | "DRIVER_LOCATION"
  | "PAYMENT_COMPLETED"
  | "TRIP_CANCELLED";

export interface RideRequestedPayload {
  tripId: string | number;
  passengerName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  rideType: string;
  estimatedFare: number;
  estimatedDistanceKm: number;
  timestamp: number;
}

export interface RideAcceptedPayload {
  tripId: string | number;
  driverId: string | number;
  driverName: string;
  vehiclePlate: string;
  vehicleModel: string;
  rating: number;
  etaMinutes: number;
  driverLat?: number;
  driverLng?: number;
  timestamp: number;
}

export interface TripStatusUpdatedPayload {
  tripId: string | number;
  status: "ASSIGNED" | "EN_ROUTE" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  statusMessage?: string;
  tripData?: any;
  timestamp: number;
}

export interface TripCancelledPayload {
  tripId: string | number;
  by: "PASSENGER" | "DRIVER" | "ADMIN";
  reason: string;
  timestamp: number;
}

export interface DriverLocationPayload {
  driverId: string | number;
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
  timestamp: number;
}

export interface PaymentCompletedPayload {
  tripId: string | number;
  amount: number;
  paymentMethod: string;
  txnId: string;
  timestamp: number;
}

export interface TripSyncMessage<T = any> {
  id: string;
  type: TripSyncEventType;
  payload: T;
  sourceTabId: string;
  timestamp: number;
}

type SyncListener<T = any> = (payload: T, message: TripSyncMessage<T>) => void;

class TripSyncServiceImpl {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners: Map<TripSyncEventType, Set<SyncListener>> = new Map();
  private allListeners: Set<(message: TripSyncMessage) => void> = new Set();

  constructor() {
    this.tabId = "tab_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    this.initChannel();
  }

  private initChannel() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel("streetify-trip-sync");
        this.channel.onmessage = (event: MessageEvent<TripSyncMessage>) => {
          this.handleIncoming(event.data);
        };
      } catch (err) {
        console.warn("BroadcastChannel initialization fallback:", err);
      }
    }

    // Cross-tab fallback via storage event
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e: StorageEvent) => {
        if (e.key === "streetify_sync_bridge" && e.newValue) {
          try {
            const data: TripSyncMessage = JSON.parse(e.newValue);
            if (data.sourceTabId !== this.tabId) {
              this.handleIncoming(data);
            }
          } catch {}
        }
      });
    }
  }

  private handleIncoming(message: TripSyncMessage) {
    if (!message || !message.type) return;

    // Notify type-specific listeners
    const group = this.listeners.get(message.type);
    if (group) {
      group.forEach((listener) => {
        try {
          listener(message.payload, message);
        } catch (err) {
          console.error(`Error in tripSync listener for ${message.type}:`, err);
        }
      });
    }

    // Notify all-event listeners (e.g. for audit log or telemetry)
    this.allListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error("Error in tripSync allListener:", err);
      }
    });

    // Also trigger custom DOM event on current window
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("streetify-sync-event", {
          detail: message,
        })
      );
    }
  }

  private broadcast<T>(type: TripSyncEventType, payload: T): TripSyncMessage<T> {
    const message: TripSyncMessage<T> = {
      id: "sync_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      type,
      payload,
      sourceTabId: this.tabId,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn("BroadcastChannel post error:", err);
      }
    }

    // Storage event trigger for secondary fallback
    try {
      localStorage.setItem("streetify_sync_bridge", JSON.stringify(message));
    } catch {}

    return message;
  }

  // ─── Public Publishers ───────────────────────────────────────────────────

  publishRideRequested(payload: Omit<RideRequestedPayload, "timestamp">) {
    return this.broadcast<RideRequestedPayload>("RIDE_REQUESTED", {
      ...payload,
      timestamp: Date.now(),
    });
  }

  publishRideAccepted(payload: Omit<RideAcceptedPayload, "timestamp">) {
    return this.broadcast<RideAcceptedPayload>("RIDE_ACCEPTED", {
      ...payload,
      timestamp: Date.now(),
    });
  }

  publishStatusUpdate(
    tripId: string | number,
    status: TripStatusUpdatedPayload["status"],
    statusMessage?: string,
    tripData?: any
  ) {
    return this.broadcast<TripStatusUpdatedPayload>("TRIP_STATUS_UPDATED", {
      tripId,
      status,
      statusMessage,
      tripData,
      timestamp: Date.now(),
    });
  }

  publishDriverLocation(payload: Omit<DriverLocationPayload, "timestamp">) {
    return this.broadcast<DriverLocationPayload>("DRIVER_LOCATION", {
      ...payload,
      timestamp: Date.now(),
    });
  }

  publishPaymentCompleted(payload: Omit<PaymentCompletedPayload, "timestamp">) {
    return this.broadcast<PaymentCompletedPayload>("PAYMENT_COMPLETED", {
      ...payload,
      timestamp: Date.now(),
    });
  }

  publishTripCancelled(tripId: string | number, by: "PASSENGER" | "DRIVER" | "ADMIN", reason: string) {
    return this.broadcast<TripCancelledPayload>("TRIP_CANCELLED", {
      tripId,
      by,
      reason,
      timestamp: Date.now(),
    });
  }

  // ─── Public Subscriptions ────────────────────────────────────────────────

  subscribe<T = any>(type: TripSyncEventType, callback: SyncListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(callback as SyncListener);

    return () => {
      set.delete(callback as SyncListener);
    };
  }

  subscribeAll(callback: (message: TripSyncMessage) => void): () => void {
    this.allListeners.add(callback);
    return () => {
      this.allListeners.delete(callback);
    };
  }

  getTabId() {
    return this.tabId;
  }
}

export const tripSyncService = new TripSyncServiceImpl();
