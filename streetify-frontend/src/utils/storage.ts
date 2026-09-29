/**
 * Tab-Isolated Storage Utility for Streetify
 *
 * Scopes authentication and active ride state to sessionStorage first (which is
 * completely isolated per browser tab on localhost). This allows opening multiple
 * tabs concurrently (Tab 1: Passenger, Tab 2: Driver, Tab 3: Admin) without
 * token overwrites or role collisions.
 *
 * If not present in sessionStorage, it falls back to localStorage for single-tab persistence.
 */

export const tabStorage = {
  getItem(key: string): string | null {
    try {
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal !== null && sessionVal !== undefined) {
        return sessionVal;
      }
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * Sets value in current tab's sessionStorage AND mirrors to localStorage
   * for backward compatibility with single-tab sessions.
   */
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write error", e);
    }
  },

  /**
   * Strictly writes to current tab's sessionStorage only.
   * Crucial for 2-tab demonstration so Tab 2 never mutates Tab 1's state.
   */
  setTabOnly(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("SessionStorage write error", e);
    }
  },

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage remove error", e);
    }
  },

  clearAuth(): void {
    const authKeys = [
      "jwt_token",
      "user_role",
      "user_name",
      "user_email",
      "admin_role",
      "vehicle_info",
      "active_trip",
      "driver_trip_id",
      "last_completed_trip",
    ];
    authKeys.forEach((k) => {
      try {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      } catch {}
    });
  },
};
