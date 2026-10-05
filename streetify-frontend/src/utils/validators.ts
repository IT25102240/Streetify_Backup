/**
 * Validation utilities for Streetify platform.
 * Specific business rules:
 * 1) Emails can ONLY exist with '@' symbol, cannot exist without '@'
 * 2) Drivers (and only drivers) must use either:
 *    - '+94' followed by 9 digits (+94XXXXXXXXX)
 */

export const EMAIL_ERROR_MSG =
  "Email must be a valid email address containing the '@' symbol (e.g. user@streetify.lk).";

export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  return trimmed.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export const DRIVER_PHONE_ERROR_MSG =
  "Phone number must be '+94' followed by exactly 9 digits (e.g. +94771234567).";

export const DRIVER_PHONE_HELP_TEXT =
  "Allowed format: +94XXXXXXXXX (+94 with exactly 9 digits)";

export function isValidDriverPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.trim().replace(/[\s\-]/g, "");
  return /^\+94\d{9}$/.test(cleaned);
}
