/**
 * Validation utilities for Streetify platform.
 * Specific business rules:
 * 1) Emails can ONLY exist with '@' symbol, cannot exist without '@'
 * 2) Drivers (and only drivers) must use either:
 *    - '+94' followed by 9 digits (+94XXXXXXXXX)
 *    - '0' followed by 9 digits (0XXXXXXXXX)
 */

export const EMAIL_ERROR_MSG =
  "Email must be a valid email address containing the '@' symbol (e.g. user@streetify.lk).";

export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  return trimmed.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export const DRIVER_PHONE_ERROR_MSG =
  "Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567).";

export const DRIVER_PHONE_HELP_TEXT =
  "Allowed formats: +94XXXXXXXXX (+94 with 9 digits) or 0XXXXXXXXX (0 with 9 digits)";

export function isValidDriverPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.trim().replace(/[\s\-]/g, "");
  return /^(\+94\d{9}|0\d{9})$/.test(cleaned);
}
