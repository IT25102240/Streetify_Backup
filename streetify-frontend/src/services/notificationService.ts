/**
 * External System: Notification Service
 * Manages SMS alerts, Push notifications, OTP dispatch, and Email receipts.
 */

import { tabStorage } from "../utils/storage";

export interface AppNotification {
  id: string;
  type: "OTP" | "TRIP_ALERT" | "RECEIPT" | "SUPPORT" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  code?: string; // For OTP codes
  data?: any;
}

export const NotificationService = {
  getStorageKey(): string {
    const role = tabStorage.getItem("user_role") || "passenger";
    return `streetify_notifications_${role.toUpperCase()}`;
  },

  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  send(notification: Omit<AppNotification, "id" | "timestamp" | "read">): AppNotification {
    const full: AppNotification = {
      ...notification,
      id: "NTF-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    const current = this.getNotifications();
    const updated = [full, ...current].slice(0, 30); // Keep last 30
    localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));

    // Dispatch global event for in-app bell badge & toast popups
    window.dispatchEvent(new CustomEvent("streetify-notification-received", { detail: full }));
    return full;
  },

  sendOtp(target: string, purpose: string = "Account Verification"): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.send({
      type: "OTP",
      title: `SMS from Streetify (${purpose})`,
      message: `Your verification code is ${code}. Valid for 5 minutes. Do not share this PIN with anyone.`,
      code,
      data: { target, purpose }
    });
    return code;
  },

  sendTripAlert(title: string, message: string, tripId?: any) {
    this.send({
      type: "TRIP_ALERT",
      title,
      message,
      data: { tripId }
    });
  },

  sendReceipt(tripId: any, amount: number, paymentMethod: string) {
    this.send({
      type: "RECEIPT",
      title: "Digital Payment Receipt Dispatched",
      message: `Payment of LKR ${amount.toLocaleString()} via ${paymentMethod.toUpperCase()} processed successfully. Receipt TXN-${Date.now().toString().slice(-6)} sent to your email.`,
      data: { tripId, amount, paymentMethod }
    });
  },

  sendSupportNotice(ticketRef: string, resolution: string) {
    this.send({
      type: "SUPPORT",
      title: `Support Ticket ${ticketRef} Resolved`,
      message: resolution || "Your dispute inquiry has been resolved by our customer care team.",
      data: { ticketRef }
    });
  },

  markAsRead(id: string) {
    const current = this.getNotifications();
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("streetify-notification-updated"));
  },

  markAllAsRead() {
    const current = this.getNotifications();
    const updated = current.map(n => ({ ...n, read: true }));
    localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("streetify-notification-updated"));
  },

  clearAll() {
    localStorage.removeItem(this.getStorageKey());
    window.dispatchEvent(new CustomEvent("streetify-notification-updated"));
  }
};
